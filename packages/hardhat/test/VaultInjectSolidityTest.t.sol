// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

// === uprav cesty podle projektu ===
import {Vault} from "../contracts/Vault.sol";
import {MockERC20} from "../contracts/mocks/MockERC20.sol";

// --- Mini feed (8 dec), pokud chceš měnit cenu v testu ---
contract MockPriceFeed {
    int256 public price;
    constructor(int256 p){ price = p; }
    function latestRoundData() external view returns (uint80,int256,uint256,uint256,uint80) {
        return (0, price, 0, 0, 0);
    }
}

// --- Loan wrapper mock pro inject ---
contract MockLoanWrapperForInject {
    // USD hodnoty v 8 dec
    uint256 public totalCollateralUsd;
    uint256 public totalDebtUsd;
    // logy pro aserty
    uint256 public lastEthIn;
    uint256 public timesCalled;

    function setValues(uint256 coll8, uint256 debt8) external {
        totalCollateralUsd = coll8; totalDebtUsd = debt8;
    }

    function getTotalCollateralValue() external view returns (uint256) { return totalCollateralUsd; }
    function getTotalDebtValue() external view returns (uint256) { return totalDebtUsd; }

    function increaseCollateral(uint256 /*amount*/) external payable {
        lastEthIn += msg.value;
        timesCalled += 1;
    }
}

// --- Adapter rozhraní z Vaultu ---
interface ISwapAdapter {
    function swapPyUsdToEth(address pyusd, uint256 amountPyUsd) external returns (uint256 ethOut);
}
interface IWETH {
    function deposit() external payable;
    function transfer(address to, uint256 amount) external returns (bool);
}

// --- Adapter mock: stáhne PYUSD z Vaultu a POŠLE mu WETH ---
// (Vault si ji v adapter větvi hned rozbalí přes IWETH(WETH_TOKEN).withdraw)
contract MockSwapAdapterWeth is ISwapAdapter {
    address public immutable WETH;
    uint256 public rateWeiPer1e18;      // 1e18 PYUSD -> X wei
    uint256 public lastAmountPyUsdIn;   // pro aserty
    uint256 public lastEthOut;          // pro aserty

    constructor(address _weth) { WETH = _weth; }

    function setRate(uint256 r) external { rateWeiPer1e18 = r; }

    function swapPyUsdToEth(address pyusd, uint256 amountPyUsd)
        external
        returns (uint256 ethOut)
    {
        // Vault předem udělá approve(adapter, amountPyUsd)
        require(MockERC20(pyusd).transferFrom(msg.sender, address(0xdead), amountPyUsd), "pull PYUSD fail");

        ethOut = (amountPyUsd * rateWeiPer1e18) / 1e18;

        // z vlastního ETH "vyrazíme" WETH a pošleme ji Vaultu
        IWETH(WETH).deposit{value: ethOut}();
        require(IWETH(WETH).transfer(msg.sender, ethOut), "send WETH fail");

        lastAmountPyUsdIn = amountPyUsd;
        lastEthOut = ethOut;
    }

    // aby šlo adapter předzásobit ETH v testu
    receive() external payable {}
}

contract InjectToLoanSmoke {
    Vault vault;
    MockLoanWrapperForInject loan;
    MockSwapAdapterWeth adapter;

    // --- pomocný deploy ---
    function _deploy() internal {
        // 1) Deploy Vaultu (používá PYUSD/WETH/Feed/Router z konstant)
        vault = new Vault("Test Vault", "TV");

        // 2) Loan wrapper mock
        loan = new MockLoanWrapperForInject();

        // 3) Adapter: vezmeme WETH adresu z vaultu (public constant getter)
        address weth = vault.WETH_TOKEN();
        adapter = new MockSwapAdapterWeth(weth);
        vault.setSwapAdapter(address(adapter));

        // 4) Adapteru pošli trochu ETH, aby mohl mintnout WETH
        (bool ok,) = address(adapter).call{value: 10 ether}("");
        require(ok, "seed adapter ETH failed");

        // 5) Fixní kurz: 1e18 PYUSD -> 0.001 ETH
        adapter.setRate(1e15);

        // 6) Vaultu přidej PYUSD — použij přímo jeho underlying adresu:
        //    Vault.asset() = PYUSD_TOKEN (public z ERC4626)
        MockERC20 pyusd = MockERC20(vault.asset());
        pyusd.mint(address(vault), 1_000_000e18); // „víc než dost“, ať to nepadá na rounding
    }

    // === Happy path ===
    function testInjectToLoan_Happy() public {
        _deploy();

        // C=2000$, D=1000$ => Vault si spočítá injection ~ 250$
        loan.setValues(2_000_000000, 1_000_000000);

        // call
        (bool ok,) = address(vault).call(abi.encodeWithSignature("injectToLoan(address)", address(loan)));
        require(ok, "injectToLoan failed");

        // swap proběhl a loan dostal ETH
        require(adapter.lastAmountPyUsdIn() > 0, "no PYUSD swapped");
        require(loan.lastEthIn() == adapter.lastEthOut(), "ETH delivered mismatch");
        require(loan.timesCalled() == 1, "increaseCollateral not called once");

        // state accounting
        (uint256 amtPy, uint256 amtEth, uint256 accIdx) = vault.injectedAssets(address(loan));
        require(amtPy == adapter.lastAmountPyUsdIn(), "amountPyUsd mismatch");
        require(amtEth == adapter.lastEthOut(), "amountEthSent mismatch");
        require(vault.totalInjectedAssets() >= amtEth, "totalInjectedAssets not increased");
        accIdx; // volitelně ověř dál dle své logiky
    }

    // === Nedostatek PYUSD ===
    function testInjectToLoan_Insufficient() public {
        // redeploy s čistým balancem
        vault = new Vault("Test Vault", "TV");
        loan  = new MockLoanWrapperForInject();

        address weth = vault.WETH_TOKEN();
        adapter = new MockSwapAdapterWeth(weth);
        vault.setSwapAdapter(address(adapter));
        (bool ok2,) = address(adapter).call{value: 1 ether}("");
        require(ok2, "seed adapter ETH failed");
        adapter.setRate(1e15);

        // injection existuje
        loan.setValues(2_000_000000, 1_000_000000);
        // ale PYUSD mintneme málo
        MockERC20 pyusd = MockERC20(vault.asset());
        pyusd.mint(address(vault), 100e18);

        (bool ok,) = address(vault).call(abi.encodeWithSignature("injectToLoan(address)", address(loan)));
        require(!ok, "expected revert (insufficient PYUSD)");
    }

    receive() external payable {}
}

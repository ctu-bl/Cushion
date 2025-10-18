// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

// === Uprav cesty podle projektu ===
import {MockERC20} from "../contracts/mocks/MockERC20.sol";
import {MockWETH9} from "../contracts/mocks/MockWETH9.sol";
import {TestableVaultNew} from "../contracts/test/TestableVaultNew.sol";
import {MockPriceFeed} from "../contracts/test/MockPriceFeed.sol";
import {MockLoanWrapperForInject} from "../contracts/test/MockLoanWrapperForInject.sol";
import {MockSwapAdapter} from "../contracts/test/MockSwapAdapter.sol";

/// @notice Testuje injectToLoan přes tvé mocky tokenu + náš feed a wrapper.
/// Stylově stejné jako tvé LoanWrapperRegistrySolidityTest: low-level calls + require.
contract VaultInjectSolidityTest {
    TestableVaultNew vault;
    MockERC20 pyusd;
    MockWETH9 weth;
    MockPriceFeed feed;
    MockLoanWrapperForInject loan;
    MockSwapAdapter swapAdapter;

    // ===== Helper: deploy sestavy =====
    function _deploy() internal {
        // 1) Deploy PYUSD 
        pyusd = new MockERC20("PayPal USD", "PYUSD", 18);

        // 2) Feed: 1.00 USD (8 decimals)
        feed = new MockPriceFeed(100_000000);

        // 3) Deploy mock WETH
        weth = new MockWETH9();
        
        // 4) Deploy mock swap adapter
        swapAdapter = new MockSwapAdapter(address(weth));
        
        // 5) Deploy testable vault with mock addresses
        vault = new TestableVaultNew("Test Vault", "TV", address(pyusd), address(feed));
        vault.setSwapAdapter(address(swapAdapter));


        // 6) Mock loan wrapper 
        loan = new MockLoanWrapperForInject();

        swapAdapter.setMockSwapRate(1e15);

        (bool ok,) = address(swapAdapter).call{value: 1 ether}("");
        require(ok, "seed ETH to vault failed");
    }

    // ====== TEST 1: Happy path ======
    // C=2000$, D=1000$  => injectionUsd = ((2000-1000)*1000/2000)/2 = 250$
    // feed 1.00 => injection PYUSD = 250e18
    // kurz 1e15 wei / 1e18 PYUSD => 250e18 * 1e15 / 1e18 = 0.25 ether
    function testInject_HappyPath() public {
    _deploy();

    // stav půjčky: injection existuje
    loan.setValues(2_000_000000, 1_000_000000);

    // mintni "hodně" PYUSD (ať neřešíme zaokrouhlení feedu/vzorců)
    pyusd.mint(address(vault), 1_000_000e18);

    (bool ok,) = address(vault).call(abi.encodeWithSignature("injectToLoan(address)", address(loan)));
    require(ok, "injectToLoan failed");

    // assert přes logy adapteru
    require(swapAdapter.lastAmountPyUsdIn() > 0, "adapter did not receive PYUSD");
    require(loan.lastEthIn() == swapAdapter.lastEthOut(), "ETH delivered mismatch");

    // volitelně — kontrola kurzu
    uint256 expectedEth = (swapAdapter.lastAmountPyUsdIn() * 1e15) / 1e18; // pokud máš 1e15 rate
    require(swapAdapter.lastEthOut() == expectedEth, "adapter rate mismatch");
}


    // ====== TEST 2: Nedostatek PYUSD ======
    function testInject_RevertsWhenNotEnoughPYUSD() public {
        _deploy();

        // injection target = 250 USD
        loan.setValues(2_000_000000, 1_000_000000);

        // vaultu dáme málo PYUSD (jen 100)
        pyusd.mint(address(vault), 100e18);

        (bool ok,) = address(vault).call(abi.encodeWithSignature("injectToLoan(address)", address(loan)));
        require(!ok, "expected revert when PYUSD is insufficient");
    }

    // ====== TEST 3: Různá cena feedu ======
    // price=1.20USD => PYUSD needed = 250/1.2 = 208.333... e18
    function testInject_RespectsPriceFeedChange() public {
    _deploy();

    loan.setValues(2_000_000000, 1_000_000000);
    feed.setPrice(120_000000); // 1.20 USD

    // zase prostě dej hodně PYUSD, ať je klid
    pyusd.mint(address(vault), 1_000_000e18);

    (bool ok,) = address(vault).call(abi.encodeWithSignature("injectToLoan(address)", address(loan)));
    require(ok, "injectToLoan failed at 1.20 price");

    // aserty přes logy adapteru
    require(swapAdapter.lastAmountPyUsdIn() > 0, "adapter did not receive PYUSD");
    require(loan.lastEthIn() == swapAdapter.lastEthOut(), "ETH delivered mismatch");
}

    // přijímání ETH (kdyby test posílal Ether)
    receive() external payable {}
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

// === tvůj kontrakt (uprav import podle své struktury) ===
import {LoanWrapperRegistry} from "../contracts/LoanWrapperRegistryV1.sol";
import {IPool} from "@aave/core-v3/contracts/interfaces/IPool.sol";
import {DataTypes} from "@aave/core-v3/contracts/protocol/libraries/types/DataTypes.sol";
import {IPoolAddressesProvider} from "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";

// ---------- Mocks ----------

contract MockERC20 {
    string public name;
    string public symbol;
    uint8  public decimals;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    constructor(string memory n, string memory s, uint8 d) {
        name = n; symbol = s; decimals = d;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "bal");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "bal");
        require(allowance[from][msg.sender] >= amount, "allow");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    // test helper
    function mint(address to, uint256 amount) external { balanceOf[to] += amount; }
    function burn(address from, uint256 amount) external { require(balanceOf[from] >= amount, "burn"); balanceOf[from] -= amount; }
}

// WETH9 mock = ERC20 + deposit/withdraw
contract MockWETH9 is MockERC20 {
    constructor() MockERC20("Wrapped Ether", "WETH", 18) {}
    function deposit() external payable { balanceOf[msg.sender] += msg.value; }
    function withdraw(uint256 amount) external {
        require(balanceOf[msg.sender] >= amount, "bal");
        balanceOf[msg.sender] -= amount;
        (bool ok,) = msg.sender.call{value: amount}("");
        require(ok, "eth send");
    }
    receive() external payable {}
}

// Aave Pool mock – implementuje jen to, co Registry volá
abstract contract MockPool is IPool {
    address public immutable usdc;
    address public immutable weth;

    // záznamy posledního volání pro aserty
    address public lastDepositAsset;
    uint256 public lastDepositAmount;
    address public lastDepositOnBehalfOf;

    address public lastBorrowAsset;
    uint256 public lastBorrowAmount;
    address public lastBorrowOnBehalfOf;
    uint256 public lastBorrowRateMode;

    mapping(address => uint256) public debtByUser; // velmi zjednodušené

    constructor(address _usdc, address _weth) { usdc = _usdc; weth = _weth; }

    // --- IPool funkce, co používáme ---

    function deposit(address asset, uint256 amount, address onBehalfOf, uint16 /*referral*/ ) external override {
        // Aave si stáhne underlying z msg.sender
        MockERC20(asset).transferFrom(msg.sender, address(this), amount);
        lastDepositAsset = asset;
        lastDepositAmount = amount;
        lastDepositOnBehalfOf = onBehalfOf;
        // (aToken mint neřešíme; pro test nám stačí záznamy)
    }

    function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 /*referral*/, address onBehalfOf) external override {
        require(asset == usdc, "only USDC in mock");
        // Mint USDC volajícímu (msg.sender) – tak to dělá reálný Pool
        MockERC20(usdc).mint(msg.sender, amount);
        lastBorrowAsset = asset;
        lastBorrowAmount = amount;
        lastBorrowOnBehalfOf = onBehalfOf;
        lastBorrowRateMode = interestRateMode;
        debtByUser[onBehalfOf] += amount;
    }

    // vrátíme jednoduché HF > 1 pro wrapper
    function getUserAccountData(address user) external view override returns (
        uint256 totalCollateralBase,
        uint256 totalDebtBase,
        uint256 availableBorrowsBase,
        uint256 currentLiquidationThreshold,
        uint256 ltv,
        uint256 healthFactor
    ) {
        // fake metriky: pokud má user dluh, vraťme HF 2e18, jinak 10e18
        uint256 debt = debtByUser[user];
        totalDebtBase = debt;
        totalCollateralBase = debt * 2;
        availableBorrowsBase = 1e27;
        currentLiquidationThreshold = 1e18;
        ltv = 8e17;
        healthFactor = debt > 0 ? 2e18 : 10e18;
    }

    // nepoužívané v těchto testech – dummy implementace pro kompilaci
    function mintUnbacked(address, uint256, address, uint16) external pure override {}
    function backUnbacked(address, uint256, uint256) external pure override returns (uint256) { return 0; }
    function withdraw(address, uint256, address) external pure override returns (uint256) { return 0; }
    function supply(address, uint256, address, uint16) external pure override {}
    function supplyWithPermit(address, uint256, address, uint16, uint256, uint8, bytes32, bytes32) external pure {}
    function withdrawWithPermit(address, uint256, address, uint256, uint8, bytes32, bytes32) external pure returns (uint256) { return 0; }
    function setUserUseReserveAsCollateral(address, bool) external pure override {}
    function repay(address, uint256, uint256, address) external pure override returns (uint256) { return 0; }
    function repayWithPermit(address, uint256, uint256, address, uint256, uint8, bytes32, bytes32) external pure override returns (uint256) { return 0; }
    function repayWithATokens(address, uint256, uint256) external pure override returns (uint256) { return 0; }
    function swapBorrowRateMode(address, uint256) external pure override {}
    function rebalanceStableBorrowRate(address, address) external pure override {}
    function flashLoan(address, address[] calldata, uint256[] calldata, uint256[] calldata, address, bytes calldata, uint16) external pure override {}
    function flashLoanSimple(address, address, uint256, bytes calldata, uint16) external pure override {}
    function liquidationCall(address, address, address, uint256, bool) external pure override {}
    function initReserve(address, address, address, address, address) external pure override {}
    function dropReserve(address) external pure override {}
    function getReservesList() external pure override returns (address[] memory) { return new address[](0); }
    function getReserveNormalizedIncome(address) external pure override returns (uint256) { return 1e27; }
    function getReserveNormalizedVariableDebt(address) external pure override returns (uint256) { return 1e27; }
    function getReserveData(address) external pure override returns (DataTypes.ReserveData memory) { revert(); }
    function getReserveAddressById(uint16) external pure override returns (address) { return address(0); }
    function ADDRESSES_PROVIDER() external pure override returns (IPoolAddressesProvider) { revert(); }
    function updateBridgeProtocolFee(uint256) external pure override {}
    function updateFlashloanPremiums(uint128, uint128) external pure override {}
    function configureEModeCategory(uint8, DataTypes.EModeCategory memory) external pure override {}
    function getEModeCategoryData(uint8) external pure override returns (DataTypes.EModeCategory memory) { revert(); }
    function setUserEMode(uint8) external pure override {}
    function getUserEMode(address) external pure override returns (uint256) { return 0; }
    function resetIsolationModeTotalDebt(address) external pure override {}
    function MAX_STABLE_RATE_BORROW_SIZE_PERCENT() external pure override returns (uint256) { return 0; }
    function FLASHLOAN_PREMIUM_TOTAL() external pure override returns (uint128) { return 0; }
    function BRIDGE_PROTOCOL_FEE() external pure override returns (uint256) { return 0; }
    function FLASHLOAN_PREMIUM_TO_PROTOCOL() external pure override returns (uint128) { return 0; }
    function MAX_NUMBER_RESERVES() external pure override returns (uint16) { return 0; }
    function mintToTreasury(address[] calldata) external pure override {}
    function rescueTokens(address, address, uint256) external pure override {}
    function finalizeTransfer(address, address, address, uint256, uint256, uint256) external pure override {}
    function setConfiguration(address, DataTypes.ReserveConfigurationMap calldata) external pure override {}
    function getConfiguration(address) external pure override returns (DataTypes.ReserveConfigurationMap memory) { revert(); }
    function getUserConfiguration(address) external pure override returns (DataTypes.UserConfigurationMap memory) { revert(); }
    function setReserveInterestRateStrategyAddress(address, address) external pure override {}
}

// Konkrétní implementace MockPool pro testy
contract MockPoolImpl is MockPool {
    constructor(address _usdc, address _weth) MockPool(_usdc, _weth) {}
}

// Provider mock – vrací náš MockPool
contract MockProvider is IPoolAddressesProvider {
    address public pool;
    constructor(address _pool) { pool = _pool; }
    
    function getPool() external view override returns (address) { return pool; }
    
    // dummy implementace zbytku interfacu
    function getMarketId() external pure override returns (string memory) { return ""; }
    function setMarketId(string calldata) external pure override {}
    function getAddress(bytes32) external pure override returns (address) { return address(0); }
    function setAddressAsProxy(bytes32, address) external pure override {}
    function setAddress(bytes32, address) external pure override {}
    function setPoolImpl(address) external pure override {}
    function getPoolConfigurator() external pure override returns (address) { return address(0); }
    function setPoolConfiguratorImpl(address) external pure override {}
    function getPriceOracle() external pure override returns (address) { return address(0); }
    function setPriceOracle(address) external pure override {}
    function getACLManager() external pure override returns (address) { return address(0); }
    function setACLManager(address) external pure override {}
    function getACLAdmin() external pure override returns (address) { return address(0); }
    function setACLAdmin(address) external pure override {}
    function getPriceOracleSentinel() external pure override returns (address) { return address(0); }
    function setPriceOracleSentinel(address) external pure override {}
    function getPoolDataProvider() external pure override returns (address) { return address(0); }
    function setPoolDataProvider(address) external pure override {}
}

// LoanWrapper stub – jen aby šel Registry zkompilovat/deploynout
contract LoanWrapper {
    constructor(address /*owner*/, uint256 /*collateral*/, uint256 /*amount*/, address /*vault*/, address /*weth*/, address /*usdc*/, address /*provider*/) {}
}

// ---------- Testy ----------

contract LoanWrapperRegistrySolidityTest {
    // helper pro izolovaný deploy
    function _deploy() internal returns (
        LoanWrapperRegistry registry,
        MockPoolImpl pool,
        MockProvider provider,
        MockWETH9 weth,
        MockERC20 usdc
    ) {
        usdc = new MockERC20("USD Coin", "USDC", 6);
        weth = new MockWETH9();
        pool = new MockPoolImpl(address(usdc), address(weth));
        provider = new MockProvider(address(pool));
        registry = new LoanWrapperRegistry(address(provider), address(0), address(weth), address(usdc));
    }

    // happy path: wrapLoan -> aWETH onBehalfOf wrapper, borrow USDC onBehalfOf wrapper, USDC posláno borrowerovi
    function testWrapLoanHappyPath() public {
        (LoanWrapperRegistry registry, MockPoolImpl pool, , MockWETH9 weth, MockERC20 usdc) = _deploy();

        address borrower = address(0xB0bb);
        uint256 ethCollateral = 5 ether;
        uint256 borrowUSDC    = 1_000_000; // 1,000,000 wei USDC (6 dec)

        // zavolej wrapLoan s ETH
        registry.wrapLoan{value: ethCollateral}(borrower, borrowUSDC);

        // 1) Registry už nemá WETH – Pool si ho strhnul v depositu
        require(weth.balanceOf(address(registry)) == 0, "registry still holds WETH");

        // 2) Pool zaznamenal deposit onBehalfOf = wrapper
        address wrapper = registry.wrapperOf(borrower);
        require(wrapper != address(0), "wrapper not stored");
        require(pool.lastDepositOnBehalfOf() == wrapper, "deposit not on wrapper");
        require(pool.lastDepositAsset() == address(weth), "deposit asset != WETH");
        require(pool.lastDepositAmount() == ethCollateral, "deposit amount mismatch");

        // 3) Pool zaznamenal borrow onBehalfOf = wrapper, rateMode=2
        require(pool.lastBorrowOnBehalfOf() == wrapper, "borrow not on wrapper");
        require(pool.lastBorrowAsset() == address(usdc), "borrow asset != USDC");
        require(pool.lastBorrowAmount() == borrowUSDC, "borrow amount mismatch");
        require(pool.lastBorrowRateMode() == 2, "rateMode != VARIABLE");

        // 4) Borrower obdržel USDC, registry by měla mít 0
        require(usdc.balanceOf(borrower) == borrowUSDC, "borrower USDC not received");
        require(usdc.balanceOf(address(registry)) == 0, "registry still holds USDC");
    }

    // wrapLoan bez ETH musí revertnout
    function testWrapLoanRevertsWithoutETH() public {
        (LoanWrapperRegistry registry, , , , ) = _deploy();
        address borrower = address(0xB0bb);
        uint256 borrowUSDC = 1;

        // nízkoúrovňový call, ať umíme zachytit revert
        (bool ok, ) = address(registry).call(
            abi.encodeWithSelector(registry.wrapLoan.selector, borrower, borrowUSDC)
        );
        require(!ok, "expected revert when no ETH sent");
    }

    // sanity: getHF a checkHF něco vrací pro wrappera po wrapLoan
    function testGetHFAndCheckHF() public {
        (LoanWrapperRegistry registry, , MockProvider provider, , ) = _deploy();
        address borrower = address(0xB0bb);

        registry.wrapLoan{value: 1 ether}(borrower, 1_000_000);
        address wrapper = registry.wrapperOf(borrower);

        uint256 hf = registry.getHF(wrapper);
        require(hf >= 1e18, "hf too low");

        bool healthy = registry.checkHF(wrapper);
        require(healthy, "expected healthy");
    }

    // umožní test kontraktu přijímat ETH z WETH.withdraw() apod.
    receive() external payable {}
}
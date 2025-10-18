// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

// Forge-std pro Hardhat 3 (.t.sol testy)
import {Test} from "forge-std/Test.sol";

// Testovaný kontrakt
import {LoanWrapper} from "../contracts/LoanWrapper.sol";


import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IWETH9} from "../contracts/LoanWrapper.sol";
import {IPoolAddressesProvider} from "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import {IPool} from "@aave/core-v3/contracts/interfaces/IPool.sol";
import {DataTypes} from "@aave/core-v3/contracts/protocol/libraries/types/DataTypes.sol";

/// @notice Jednoduché mock kontrakty pro simulaci Aave komponent

contract MockERC20 is IERC20 {
    string public name = "MockToken";
    string public symbol = "MTK";
    uint8 public decimals = 18;

    mapping(address => uint256) public override balanceOf;
    mapping(address => mapping(address => uint256)) public override allowance;

    function totalSupply() external pure override returns (uint256) {
        return 1e24;
    }

    function transfer(address to, uint256 amount) external override returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function approve(address spender, uint256 amount) external override returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external override returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }
}

contract MockWETH9 is IWETH9 {
    mapping(address => uint256) public balance;

    function deposit() external payable override {
        balance[msg.sender] += msg.value;
    }

    function withdraw(uint256 amount) external override {
        require(balance[msg.sender] >= amount, "Not enough balance");
        balance[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
    }

    receive() external payable {}
}

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

/// @notice Hlavní testovací kontrakt
contract LoanWrapperTest is Test {
    LoanWrapper loan;
    MockERC20 debtToken;
    MockWETH9 colToken;
    MockPoolImpl pool;
    MockProvider provider;

    address owner = address(0x123);
    address vault = address(0x999);
    address investor = address(0x888);

    function setUp() public {
        // deploy mocks
        colToken = new MockWETH9();
        debtToken = new MockERC20();
        pool = new MockPoolImpl(address(debtToken), address(colToken));
        provider = new MockProvider(address(pool));

        // deploy LoanWrapper
        vm.startPrank(owner);
        loan = new LoanWrapper(
            owner,
            10 ether,   // collateral
            5 ether,    // borrowed
            vault,
            address(colToken),
            address(debtToken),
            address(provider)
        );
        vm.stopPrank();
    }

    function testInitialState() public {
        assertEq(loan.isLocked(), false);
        assertEq(loan.getTotalCollateralValue(), 10 ether);
        assertEq(loan.getTotalDebtValue(), 5 ether);
    }

    function testLockAndUnlock() public {
        // lockWrapper je private -> voláme přes increaseCollateral
        vm.deal(investor, 2 ether);
        vm.prank(investor);
        loan.increaseCollateral{value: 2 ether}(2 ether);
        assertEq(loan.isLocked(), true);

        vm.startPrank(investor);
        loan.decreaseCollateral(1 ether);
        vm.stopPrank();

        assertEq(loan.isLocked(), false);
    }

    function testOnlyOwnerCanIncreaseDebt() public {
        vm.prank(investor);
        vm.expectRevert(LoanWrapper.LoanWrapper__AccessDenied.selector);
        loan.increaseDebt(1 ether);
    }

    function testIncreaseDebtByOwner() public {
        vm.prank(owner);
        loan.increaseDebt(1 ether);
        assertEq(loan.getTotalDebtValue(), 6 ether);
    }

    function testDecreaseDebtByOwner() public {
        vm.startPrank(owner);
        debtToken.mint(owner, 10 ether);
        debtToken.approve(address(loan), 10 ether);
        loan.decreaseDebt(1 ether);
        vm.stopPrank();

        assertEq(loan.getTotalDebtValue(), 4 ether);
    }

    function testRepayLoanOnlyByVault() public {
        vm.prank(owner);
        vm.expectRevert(LoanWrapper.LoanWrapper__AccessDenied.selector);
        loan.repayLoan();

        vm.startPrank(vault);
        debtToken.mint(vault, 5 ether);
        debtToken.approve(address(loan), 5 ether);
        loan.repayLoan();
        vm.stopPrank();
    }
}

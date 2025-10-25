// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import {Test, console} from "forge-std/Test.sol";

import {LoanWrapper} from "../contracts/LoanWrapper.sol";


import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IWETH9} from "../contracts/LoanWrapper.sol";
import {IPoolAddressesProvider} from "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import {IPool} from "@aave/core-v3/contracts/interfaces/IPool.sol";
import {DataTypes} from "@aave/core-v3/contracts/protocol/libraries/types/DataTypes.sol";


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
        // console.log("Allowed %d from %s to %s", amount, msg.sender, spender);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external override returns (bool) {
        //console.log("Allowed %d from %s to %s", amount, from, to);
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approveDelegation(address to, uint256 amount) external {
        balanceOf[to] = amount;
    }
}

contract MockWETH9 is IWETH9 {
    mapping(address => uint256) public balance;
    mapping(address => mapping(address => uint256)) public allowance;

    function deposit() external payable override {
        balance[msg.sender] += msg.value;
    }

    function withdraw(uint256 amount) external override {
        require(balance[msg.sender] >= amount, "Not enough balance");
        console.log("Balance %d", address(this).balance);
        balance[msg.sender] -= amount;
        console.log("Amount %d", amount);
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) {
            revert LoanWrapper.LoanWrapper__InsufficientAllowance();
        }
    }

    function transfer(address to, uint256 amount) external override {
        require(balance[msg.sender] >= amount, "Not enough balance");
        balance[msg.sender] -= amount;
        balance[to] += amount;
    }

    function balanecOf(address user) external view returns (uint256) {
        return balance[user];
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    receive() external payable {
        balance[msg.sender] += msg.value;
    }

    fallback() external payable {}
}

abstract contract MockPool is IPool {
    address public immutable usdc;
    address public immutable weth;

    address public lastDepositAsset;
    uint256 public lastDepositAmount;
    address public lastDepositOnBehalfOf;

    address public lastBorrowAsset;
    uint256 public lastBorrowAmount;
    address public lastBorrowOnBehalfOf;
    uint256 public lastBorrowRateMode;

    mapping(address => uint256) public debtByUser;
    uint256 userColl;

    constructor(address _usdc, address _weth) { usdc = _usdc; weth = _weth; }


    function deposit(address asset, uint256 amount, address onBehalfOf, uint16) external override {
        //MockWETH9(weth).transferFrom(msg.sender, address(this), amount);
        lastDepositAsset = asset;
        lastDepositAmount = amount;
        userColl += amount;
        lastDepositOnBehalfOf = onBehalfOf;
    }

    function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16, address onBehalfOf) external override {
        require(asset == usdc, "only USDC in mock");
        MockERC20(usdc).mint(msg.sender, amount);
        lastBorrowAsset = asset;
        lastBorrowAmount = amount;
        lastBorrowOnBehalfOf = onBehalfOf;
        lastBorrowRateMode = interestRateMode;
        debtByUser[onBehalfOf] += amount;
        console.log("from borrow: %d", debtByUser[onBehalfOf]);
    }

    function getUserAccountData(address user) external view override returns (
        uint256 totalCollateralBase,
        uint256 totalDebtBase,
        uint256 availableBorrowsBase,
        uint256 currentLiquidationThreshold,
        uint256 ltv,
        uint256 healthFactor
    ) {
        uint256 debt = debtByUser[user];
        totalDebtBase = debt;
        totalCollateralBase = userColl;
        availableBorrowsBase = 1e27;
        currentLiquidationThreshold = 1e18;
        ltv = 8e17;
        healthFactor = userColl * currentLiquidationThreshold / totalDebtBase;
    }

    function simulateHFDrop(address user) external {
        debtByUser[user] += 4 ether;
        //console.log(userColl * 1e18 / debtByUser[user]);
    }

    function simulateHFRise(address user) external {
        debtByUser[user] -= 4 ether;
    }


    function getReserveData(address asset) external view override returns (DataTypes.ReserveData memory) {
        return DataTypes.ReserveData({
            configuration: DataTypes.ReserveConfigurationMap(0),
            liquidityIndex: 1e27,
            currentLiquidityRate: 0,
            variableBorrowIndex: 1e27,
            currentVariableBorrowRate: 0,
            currentStableBorrowRate: 0,
            lastUpdateTimestamp: uint40(block.timestamp),
            id: 0,
            aTokenAddress: address(0),
            stableDebtTokenAddress: address(0),
            variableDebtTokenAddress: asset,
            interestRateStrategyAddress: address(0),
            accruedToTreasury: 0,
            unbacked: 0,
            isolationModeTotalDebt: 0
        });
    }
    function repay(address asset, uint256 amount, uint256 interestRateMode, address onBehalfOf) external override returns (uint256) {
        if (amount == type(uint256).max) {
            (, amount, , , , ) = this.getUserAccountData(onBehalfOf);
        }
        debtByUser[onBehalfOf] -= amount;
    }

    function mintUnbacked(address, uint256, address, uint16) external pure override {}
    function backUnbacked(address, uint256, uint256) external pure override returns (uint256) { return 0; }
    function withdraw(address, uint256, address) external pure override returns (uint256) { return 0; }
    function supply(address, uint256, address, uint16) external pure override {}
    function supplyWithPermit(address, uint256, address, uint16, uint256, uint8, bytes32, bytes32) external pure {}
    function withdrawWithPermit(address, uint256, address, uint256, uint8, bytes32, bytes32) external pure returns (uint256) { return 0; }
    function setUserUseReserveAsCollateral(address, bool) external pure override {}
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

contract MockPoolImpl is MockPool {
    constructor(address _usdc, address _weth) MockPool(_usdc, _weth) {}
}

contract MockProvider is IPoolAddressesProvider {
    address public pool;
    constructor(address _pool) { pool = _pool; }
    
    function getPool() external view override returns (address) { return pool; }
    
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

contract LoanWrapperTest is Test {
    LoanWrapper loan;
    MockERC20 debtToken;
    MockWETH9 colToken;
    MockPoolImpl pool;
    MockProvider provider;

    address owner = makeAddr("owner");
    address vault = makeAddr("vault");
    address investor = makeAddr("investor");
    address investor2 = makeAddr("investor2");
    address registry = makeAddr("registry");

    function setUp() public {
        colToken = new MockWETH9();
        debtToken = new MockERC20();
        pool = new MockPoolImpl(address(debtToken), address(colToken));
        provider = new MockProvider(address(pool));

        vm.startPrank(registry);
        loan = new LoanWrapper(
            owner,
            10 ether,
            5 ether,
            vault,
            address(colToken),
            address(debtToken),
            address(provider)
        );
        vm.stopPrank();

        // vm.deal(address(colToken), 15 ether);

        pool.deposit(address(colToken), 10 ether, address(loan), 0);
        pool.borrow(address(debtToken), 5 ether, 2, 0, address(loan));
    }

    // --------------init tests------------------
    function testInitialState() public {
        assertEq(loan.isLocked(), false);
        assertEq(loan.getTotalCollateralValue(), 10 ether);
        assertEq(loan.getTotalDebtValue(), 5 ether);
        assertEq(loan.owner(), owner);
    }

    //------------------computeHF() tests--------------------
    function testComputeHFDebtIsZero() public {
        (uint256 col, uint256 debt, , uint256 lt, ,) = pool.getUserAccountData(address(loan));
        assertEq(loan.testComputeHF(col, 0, lt, 0, 0), type(uint256).max);
    }

    function testComputeHFCollIsZero() public {
        (uint256 col, uint256 debt, , uint256 lt, ,) = pool.getUserAccountData(address(loan));
        assertEq(loan.testComputeHF(0, debt, lt, 0, 0), 0);
    }

    function testComputeHFIncreasingAndDecreasing() public {
        
        (uint256 col, uint256 debt, , uint256 lt, ,) = pool.getUserAccountData(address(loan));
        assertEq(loan.testComputeHF(col, debt, lt, 0, 0), 2 * 1e18);
        assertEq(loan.testComputeHF(col, debt + 3 ether, lt, 0, 0), 125 * 1e16);
        assertEq(loan.testComputeHF(col, debt - 1 ether, lt, 0, 0), 25 * 1e17);
        assertEq(loan.testComputeHF(col + 2 ether, debt, lt, 0, 0), 24 * 1e17);
        assertEq(loan.testComputeHF(col - 2 ether, debt, lt, 0, 0), 16 * 1e17);

        assertEq(loan.testComputeHF(col, debt, lt, 0, 3 ether), 125 * 1e16);
        assertEq(loan.testComputeHF(col, debt, lt, 0, -1 ether), 25 * 1e17);
        assertEq(loan.testComputeHF(col, debt, lt, -2 ether, 0), 16 * 1e17);
        assertEq(loan.testComputeHF(col, debt, lt, 2 ether, 0), 24 * 1e17);
    }


    // --------------increaseCollateral() tests------------------
    function testWhen3rdPartyIncreasesCollateralAndHFIsOk_ShouldRevert() public {
        vm.deal(investor, 2 ether);
        vm.prank(investor);
        vm.expectRevert(LoanWrapper.LoanWrapper__NotAccesibleForInvestor.selector);
        loan.increaseCollateral{value: 2 ether}(2 ether);
    }

    function testIncreaseCollateralValueSentNotEqAmount_ShouldRevert() public {
        // Decrease HF first
        pool.simulateHFDrop(address(loan));

        vm.deal(investor, 2 ether);
        vm.prank(investor);
        vm.expectRevert(LoanWrapper.LoanWrapper__InsufficientAllowance.selector);
        loan.increaseCollateral{value: 1.5 ether}(2 ether);
    }

    function testIncreaseCollateralAfterSomeoneAlreadyDid_ShouldRevert() public {
        // Decrease HF first
        pool.simulateHFDrop(address(loan));
        // Investor increases
        vm.deal(investor, 2 ether);
        vm.prank(investor);
        loan.increaseCollateral{value: 2 ether}(2 ether);
        assertEq(loan.getTotalCollateralValue(), 12 ether);

        vm.deal(investor2, 2 ether);
        vm.prank(investor2);
        vm.expectRevert(LoanWrapper.LoanWrapper__AccessDenied.selector);
        loan.increaseCollateral{value: 2 ether}(2 ether);
    }

    function testIncreaseCollateralByOwner() public {
        vm.deal(owner, 2 ether);
        vm.prank(owner);
        loan.increaseCollateral{value: 2 ether}(2 ether);
        assertEq(loan.getTotalCollateralValue(), 12 ether);
        assertEq(loan.getOwnerCollateralValue(), 12 ether);
        assertEq(loan.getInvestorCollateralValue(), 0);
    }

    function testIncreaseCollateralByInvestor() public {
        // Decrease HF first
        pool.simulateHFDrop(address(loan));

        vm.deal(investor, 2 ether);
        vm.prank(investor);
        loan.increaseCollateral{value: 2 ether}(2 ether);
        assertEq(loan.getTotalCollateralValue(), 12 ether);
        assertEq(loan.getOwnerCollateralValue(), 10 ether);
        assertEq(loan.getInvestorCollateralValue(), 2 ether);
    }


    function testDecreaseCollateralByOwnerAndBreaksHF_ShouldRevert() public {
        vm.deal(owner, 5 ether);
        vm.prank(owner);
        vm.expectRevert(LoanWrapper.LoanWrapper__BreaksHealthFactor.selector);
        loan.decreaseCollateral(5 ether);
    }

    function testDecreaseCollateralByInvestorWithoutIncreasingBefore_ShouldRevert() public {
        vm.deal(investor, 5 ether);
        vm.prank(investor);
        vm.expectRevert(LoanWrapper.LoanWrapper__AccessDenied.selector);
        loan.decreaseCollateral(5 ether);
    }

    function testDecreaseCollateralByInvestorAndBreaksHF_ShouldRevert() public {
        // Decrease HF
        pool.simulateHFDrop(address(loan));

        vm.deal(investor, 5 ether);
        vm.prank(investor);
        loan.increaseCollateral{value: 5 ether}(5 ether);

        vm.deal(investor, 5 ether);
        vm.prank(investor);
        vm.expectRevert(LoanWrapper.LoanWrapper__BreaksHealthFactor.selector);
        loan.decreaseCollateral(5 ether);
    }

    function testOnlyInitialInvestorCanWithdraw_ShouldRevert() public {
        // Decrease HF
        pool.simulateHFDrop(address(loan));

        vm.deal(investor, 5 ether);
        vm.prank(investor);
        loan.increaseCollateral{value: 5 ether}(5 ether);

        vm.deal(investor2, 5 ether);
        vm.prank(investor2);
        vm.expectRevert(LoanWrapper.LoanWrapper__AccessDenied.selector);
        loan.decreaseCollateral(5 ether);
    }

    function testOwnerDecreasesCollateralWhenLocked_ShouldRevert() public {
        vm.deal(owner, 1 ether);
        vm.prank(owner);
        loan.increaseCollateral{value: 0.3 ether}(0.3 ether);
        
        // Decrease HF
        pool.simulateHFDrop(address(loan));
        (, , , , , uint256 hf) = pool.getUserAccountData(address(loan));

        vm.deal(investor, 5 ether);
        vm.prank(investor);
        loan.increaseCollateral{value: 5 ether}(5 ether);

        vm.prank(owner);
        vm.expectRevert(LoanWrapper.LoanWrapper__WrapperNotUnlocked.selector);
        loan.decreaseCollateral(5 ether);
    }

    function testOwnerTriesDecreaseMoreCollThanWrapperHas() public {
        vm.prank(owner);
        vm.expectRevert(LoanWrapper.LoanWrapper__InvalidAmount.selector);
        loan.decreaseCollateral(12 ether);
    }

    function testInvestorTriesDecreaseMoreCollThanWrapperHas() public {
        // Decrease HF
        pool.simulateHFDrop(address(loan));

        vm.deal(investor, 1 ether);
        vm.prank(investor);
        loan.increaseCollateral{value: 1 ether}(1 ether);

        vm.prank(investor);
        vm.expectRevert(LoanWrapper.LoanWrapper__InvalidAmount.selector);
        loan.decreaseCollateral(2 ether);
    }


    // --------------increaseDebt() tests------------------
    function testOnlyOwnerCanIncreaseDebt() public {
        vm.prank(investor);
        vm.expectRevert();
        loan.increaseDebt(1 ether);
    }

    function testIncreaseDebtByOwnerLockedWrapper_ShouldRevert() public {
        // Decrease HF first
        pool.simulateHFDrop(address(loan));
        vm.deal(investor, 2 ether);
        vm.prank(investor);
        loan.increaseCollateral{value: 2 ether}(2 ether);

        vm.prank(owner);
        vm.expectRevert(LoanWrapper.LoanWrapper__WrapperNotUnlocked.selector);
        loan.increaseDebt(1000);
    }


    function testIncreaseDebtByOwner_ShouldRevertHFBreak() public {
        vm.prank(owner);
        vm.expectRevert(LoanWrapper.LoanWrapper__BreaksHealthFactor.selector);
        loan.increaseDebt(5 ether);
    }

    // -----------------decreaseDebt() tests----------------
    function testOnlyOwnerCanDecreaseDebt_ShouldRevert() public {
        vm.startPrank(investor);
        debtToken.mint(investor, 10 ether);
        debtToken.approve(address(loan), 10 ether);
        vm.stopPrank();
        vm.prank(investor);
        vm.expectRevert();
        loan.decreaseDebt(1 ether);
    }

    function testDecreaseDebtByOwnerWhenLocked_ShouldRevert() public {
        // Decrease HF first
        pool.simulateHFDrop(address(loan));
        vm.deal(investor, 2 ether);
        vm.prank(investor);
        loan.increaseCollateral{value: 2 ether}(2 ether);

        vm.startPrank(owner);
        debtToken.mint(owner, 10 ether);
        debtToken.approve(address(loan), 10 ether);
        vm.stopPrank();
        vm.prank(owner);
        vm.expectRevert(LoanWrapper.LoanWrapper__WrapperNotUnlocked.selector);
        loan.decreaseDebt(1 ether);
    }

    function testDecreaseDebtWithMoreAmountThanDebtIs_ShouldRevert() public {
        vm.startPrank(owner);
        debtToken.mint(owner, 10 ether);
        debtToken.approve(address(loan), 10 ether);
        vm.stopPrank();
        vm.prank(owner);
        vm.expectRevert(LoanWrapper.LoanWrapper__InvalidAmount.selector);
        loan.decreaseDebt(6 ether);
    }

    function testDecreaseDebtByOwner() public {
        vm.startPrank(owner);
        debtToken.mint(owner, 10 ether);
        debtToken.approve(address(loan), 10 ether);
        loan.decreaseDebt(1 ether);
        vm.stopPrank();

        assertEq(loan.getTotalDebtValue(), 4 ether);
        (, uint256 d, , , ,) = pool.getUserAccountData((address(loan)));
        assertEq(d, 4 ether);
    }


    function testRepayButNothingToBeRepaid() public {
        vm.startPrank(vault);
        (, uint256 d, , , ,) = pool.getUserAccountData(address(loan));
        debtToken.mint(vault, d);
        debtToken.approve(address(loan), d);
        loan.repayLoan();
        vm.expectRevert(LoanWrapper.LoanWrapper__NothingToRepay.selector);
        loan.repayLoan();
        vm.stopPrank();
    }
}

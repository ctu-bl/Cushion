// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import {IPool} from "@aave/core-v3/contracts/interfaces/IPool.sol";
import {IPoolAddressesProvider} from "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import {DataTypes} from "@aave/core-v3/contracts/protocol/libraries/types/DataTypes.sol";

interface IERC20Like {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface IMintableERC20 {
    function mint(address to, uint256 amount) external;
}

interface IMockEthOracle {
    function latestAnswer() external view returns (int256);
    function decimals() external view returns (uint8);
}

abstract contract MockPool is IPool {
    address public immutable usdc;
    address public immutable weth;
    address public immutable ethOracle;

    address public lastDepositAsset;
    uint256 public lastDepositAmount;
    address public lastDepositOnBehalfOf;

    address public lastBorrowAsset;
    uint256 public lastBorrowAmount;
    address public lastBorrowOnBehalfOf;
    uint256 public lastBorrowRateMode;

    mapping(address => uint256) public debtByUser;
    mapping(address => uint256) public collateralByUser;
    uint256 public userColl;

    constructor(address _usdc, address _weth, address _ethOracle) { 
        usdc = _usdc; 
        weth = _weth; 
        ethOracle = _ethOracle;
    }

    function deposit(address asset, uint256 amount, address onBehalfOf, uint16) external override {
        // move tokens into pool so UI can display real balances
        require(IERC20Like(asset).transferFrom(msg.sender, address(this), amount), "deposit transfer failed");
        lastDepositAsset = asset;
        lastDepositAmount = amount;
        userColl += amount;
        collateralByUser[onBehalfOf] += amount; // Track user-specific collateral
        lastDepositOnBehalfOf = onBehalfOf;
    }

    function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16, address onBehalfOf) external override {
        require(asset == usdc, "only USDC in mock");
        // check pool has enough liquidity
        require(IERC20Like(asset).balanceOf(address(this)) >= amount, "insufficient liquidity");
        // transfer USDC from pool to borrower
        require(IERC20Like(asset).transfer(msg.sender, amount), "borrow transfer failed");
        lastBorrowAsset = asset;
        lastBorrowAmount = amount;
        lastBorrowOnBehalfOf = onBehalfOf;
        lastBorrowRateMode = interestRateMode;
        debtByUser[onBehalfOf] += amount;
    }

    function getUserAccountData(address user) external view override returns (
        uint256 totalCollateralBase,
        uint256 totalDebtBase,
        uint256 availableBorrowsBase,
        uint256 currentLiquidationThreshold,
        uint256 ltv,
        uint256 healthFactor
    ) {
        uint256 debtUsdc_e6 = debtByUser[user]; // USDC 1e6
        uint256 collateralWeth_e18 = collateralByUser[user]; // WETH 1e18

        // Convert collateral to USDC units (1e6) using ETH price from oracle
        int256 ethPriceInt = IMockEthOracle(ethOracle).latestAnswer();
        uint8 ethPriceDecimals = IMockEthOracle(ethOracle).decimals();
        uint256 ethPrice = uint256(ethPriceInt);
        
        // Normalize ETH price to 1e6 (USDC decimals)
        // ethPrice is in ethPriceDecimals, we need it in 1e6
        uint256 ethPriceUsd_e6;
        if (ethPriceDecimals >= 6) {
            ethPriceUsd_e6 = ethPrice / (10 ** (ethPriceDecimals - 6));
        } else {
            ethPriceUsd_e6 = ethPrice * (10 ** (6 - ethPriceDecimals));
        }
        
        // collateralUsd_e6 = collateralWeth_e18 * ethPriceUsd_e6 / 1e18
        uint256 collateralUsd_e6 = (collateralWeth_e18 * ethPriceUsd_e6) / 1e18;

        // Expose totals (scaled to 1e18 to mimic Aave base format)
        totalDebtBase = debtUsdc_e6 * 1e12; // 1e6 → 1e18
        totalCollateralBase = collateralUsd_e6 * 1e12; // 1e6 → 1e18
        availableBorrowsBase = 1e27;
        currentLiquidationThreshold = 85e16; // 85%
        ltv = 8e17; // 80%

        // HF in 1e18
        healthFactor = debtUsdc_e6 == 0
            ? type(uint256).max
            : (collateralUsd_e6 * currentLiquidationThreshold) / debtUsdc_e6;
    }

    function simulateHFDrop(address user) external {
        debtByUser[user] += 4 ether;
    }

    function simulateHFRise(address user) external {
        if (debtByUser[user] >= 4 ether) debtByUser[user] -= 4 ether;
        else debtByUser[user] = 0;
    }

    function decreaseCollateral(address user, uint256 amount) external {
        require(collateralByUser[user] >= amount, "insufficient collateral");
        collateralByUser[user] -= amount;
        userColl -= amount;
    }

    function withdraw(address asset, uint256 amount, address to) external override returns (uint256) {
        require(asset == weth, "only WETH in mock");
        require(collateralByUser[to] >= amount, "insufficient collateral");
        
        // Update tracking
        collateralByUser[to] -= amount;
        userColl -= amount;
        
        // Transfer WETH back to caller
        require(IERC20Like(asset).transfer(to, amount), "withdraw transfer failed");
        
        return amount;
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

    function repay(address asset, uint256 amount, uint256, address onBehalfOf) external override returns (uint256) {
        require(asset == usdc, "only USDC in mock");
        
        uint256 repaid = amount;
        if (repaid == type(uint256).max) {
            (, repaid, , , , ) = this.getUserAccountData(onBehalfOf);
        }
        if (debtByUser[onBehalfOf] < repaid) repaid = debtByUser[onBehalfOf];
        
        if (repaid > 0) {
            // Transfer USDC from caller to pool (actual repayment)
            require(IERC20Like(asset).transferFrom(msg.sender, address(this), repaid), "repay transfer failed");
            debtByUser[onBehalfOf] -= repaid;
        }
        
        return repaid;
    }

    // Unused IPool functions stubbed
    function mintUnbacked(address, uint256, address, uint16) external pure override {}
    function backUnbacked(address, uint256, uint256) external pure override returns (uint256) { return 0; }
    function supply(address, uint256, address, uint16) external pure {}
    function supplyWithPermit(address, uint256, address, uint16, uint256, uint8, bytes32, bytes32) external pure {}
    // withdraw function implemented above
    function withdrawWithPermit(address, uint256, address, uint256, uint8, bytes32, bytes32) external pure returns (uint256) { return 0; }
    function setUserUseReserveAsCollateral(address, bool) external pure {}
    function repayWithPermit(address, uint256, uint256, address, uint256, uint8, bytes32, bytes32) external pure returns (uint256) { return 0; }
    function repayWithATokens(address, uint256, uint256) external pure returns (uint256) { return 0; }
    function swapBorrowRateMode(address, uint256) external pure {}
    function rebalanceStableBorrowRate(address, address) external pure {}
    function flashLoan(address, address[] calldata, uint256[] calldata, uint256[] calldata, address, bytes calldata, uint16) external pure {}
    function flashLoanSimple(address, address, uint256, bytes calldata, uint16) external pure {}
    function liquidationCall(address, address, address, uint256, bool) external pure {}
    function initReserve(address, address, address, address, address) external pure {}
    function dropReserve(address) external pure {}
    function getReservesList() external pure returns (address[] memory) { return new address[](0); }
    function getReserveNormalizedIncome(address) external pure returns (uint256) { return 1e27; }
    function getReserveNormalizedVariableDebt(address) external pure returns (uint256) { return 1e27; }
    function getReserveAddressById(uint16 /* id */) external pure returns (address) { return address(0); }
    function ADDRESSES_PROVIDER() external pure returns (IPoolAddressesProvider) { revert(); }
    function updateBridgeProtocolFee(uint256) external pure {}
    function updateFlashloanPremiums(uint128, uint128) external pure {}
    function configureEModeCategory(uint8, DataTypes.EModeCategory memory) external pure {}
    function getEModeCategoryData(uint8) external pure returns (DataTypes.EModeCategory memory) { revert(); }
    function setUserEMode(uint8) external pure {}
    function getUserEMode(address) external pure returns (uint256) { return 0; }
    function resetIsolationModeTotalDebt(address) external pure {}
    function MAX_STABLE_RATE_BORROW_SIZE_PERCENT() external pure returns (uint256) { return 0; }
    function FLASHLOAN_PREMIUM_TOTAL() external pure returns (uint128) { return 0; }
    function BRIDGE_PROTOCOL_FEE() external pure returns (uint256) { return 0; }
    function FLASHLOAN_PREMIUM_TO_PROTOCOL() external pure returns (uint128) { return 0; }
    function MAX_NUMBER_RESERVES() external pure returns (uint16) { return 0; }
    function mintToTreasury(address[] calldata) external pure {}
    function rescueTokens(address, address, uint256) external pure {}
    function finalizeTransfer(address, address, address, uint256, uint256, uint256) external pure {}
    function setConfiguration(address, DataTypes.ReserveConfigurationMap calldata) external pure {}
    function getConfiguration(address) external pure returns (DataTypes.ReserveConfigurationMap memory) { revert(); }
    function getUserConfiguration(address) external pure returns (DataTypes.UserConfigurationMap memory) { revert(); }
    function setReserveInterestRateStrategyAddress(address, address) external pure {}
}

contract MockPoolImpl is MockPool {
    constructor(address _usdc, address _weth, address _ethOracle) MockPool(_usdc, _weth, _ethOracle) {}
}
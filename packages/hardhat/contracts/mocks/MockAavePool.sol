// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import {DataTypes} from "@aave/core-v3/contracts/protocol/libraries/types/DataTypes.sol";

interface IERC20Like {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address who) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}

contract MockAavePool {
    mapping(address => mapping(address => uint256)) public debtOf; // user => asset => amount
    mapping(address => DataTypes.ReserveData) internal _reserves; // asset => data

    // deposit underlying from msg.sender into pool (this)
    function deposit(address asset, uint256 amount, address /*onBehalfOf*/, uint16 /*referral*/) external {
        require(IERC20Like(asset).transferFrom(msg.sender, address(this), amount), "deposit transfer failed");
    }

    // borrow underlying: debt position on `onBehalfOf`, funds sent to msg.sender (Aave v3 semantics)
    function borrow(address asset, uint256 amount, uint256 /*rateMode*/, uint16 /*referral*/, address onBehalfOf) external {
        require(IERC20Like(asset).balanceOf(address(this)) >= amount, "insufficient liquidity");
        debtOf[onBehalfOf][asset] += amount;
        require(IERC20Like(asset).transfer(msg.sender, amount), "borrow transfer failed");
    }

    function repay(address asset, uint256 amount, uint256 /*rateMode*/, address onBehalfOf) external returns (uint256) {
        uint256 toRepay = amount;
        if (toRepay > debtOf[onBehalfOf][asset]) toRepay = debtOf[onBehalfOf][asset];
        require(IERC20Like(asset).transferFrom(msg.sender, address(this), toRepay), "repay transfer failed");
        debtOf[onBehalfOf][asset] -= toRepay;
        return toRepay;
    }

    function getUserAccountData(address /*user*/) external pure returns (
        uint256 totalCollateralETH,
        uint256 totalDebtETH,
        uint256 availableBorrowsETH,
        uint256 currentLiquidationThreshold,
        uint256 ltv,
        uint256 healthFactor
    ) {
        return (0,0,0,0,0,1e18);
    }

    // Minimal reserve data plumbing used by LoanWrapper constructor via IPool.getReserveData
    function setReserveData(address asset, address aToken, address stableDebt, address variableDebt) external {
        DataTypes.ReserveData storage r = _reserves[asset];
        r.configuration.data = 0;
        r.liquidityIndex = 0;
        r.currentLiquidityRate = 0;
        r.variableBorrowIndex = 0;
        r.currentVariableBorrowRate = 0;
        r.currentStableBorrowRate = 0;
        r.lastUpdateTimestamp = uint40(block.timestamp);
        r.aTokenAddress = aToken;
        r.stableDebtTokenAddress = stableDebt;
        r.variableDebtTokenAddress = variableDebt;
        r.id = 0;
    }

    function getReserveData(address asset) external view returns (DataTypes.ReserveData memory) {
        return _reserves[asset];
    }
}

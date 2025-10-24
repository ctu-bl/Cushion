// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

interface IApproveDelegation {
    function approveDelegation(address delegatee, uint256 amount) external;
}

/**
 * @title MockVariableDebtToken
 * @author CTU Blockchain Lab
 * @notice Minimal surface exposing approveDelegation used by LoanWrapper constructor
 */
contract MockVariableDebtToken is IApproveDelegation {
    mapping(address => mapping(address => uint256)) public borrowAllowance;

    event BorrowAllowanceDelegated(address indexed fromUser, address indexed toUser, uint256 amount);

    function approveDelegation(address delegatee, uint256 amount) external override {
        borrowAllowance[msg.sender][delegatee] = amount;
        emit BorrowAllowanceDelegated(msg.sender, delegatee, amount);
    }
}



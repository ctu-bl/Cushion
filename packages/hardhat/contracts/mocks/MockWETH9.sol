// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import {LoanWrapper} from "../LoanWrapper.sol";

interface IWETH9Like {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract MockWETH9 is IWETH9Like {
    mapping(address => uint256) public balance;
    mapping(address => mapping(address => uint256)) public allowance;

    function deposit() external payable override {
        balance[msg.sender] += msg.value;
    }

    function withdraw(uint256 amount) external override {
        require(balance[msg.sender] >= amount, "Not enough balance");
        balance[msg.sender] -= amount;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) {
            revert LoanWrapper.LoanWrapper__InsufficientAllowance();
        }
    }

    function transfer(address to, uint256 amount) external override returns (bool) {
        require(balance[msg.sender] >= amount, "Not enough balance");
        balance[msg.sender] -= amount;
        balance[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external override returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        require(allowed >= amount, "insufficient allowance");
        require(balance[from] >= amount, "insufficient balance");
        if (allowed != type(uint256).max) {
            allowance[from][msg.sender] = allowed - amount;
        }
        balance[from] -= amount;
        balance[to] += amount;
        return true;
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

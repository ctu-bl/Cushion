// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MockERC20
 * @author CTU Blockchain Lab
 * @notice Mock providing all essential functions as ERC20
 */
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

    // Non-standard helper used by tests mimicking delegation behavior
    function approveDelegation(address to, uint256 amount) external {
        balanceOf[to] = amount;
    }
}

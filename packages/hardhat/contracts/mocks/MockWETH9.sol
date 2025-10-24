// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

import {LoanWrapper} from "../LoanWrapper.sol";
// import {console} from "hardhat/console.sol";

interface IWETH9Like {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/**
 * @title MockWETH9
 * @author CTU Blockchain Lab
 * @notice Mock for wrapped ETH. Behaves the same as ERC20
 */
contract MockWETH9 is IWETH9Like {
    string public name = "Mock Wrapped Ether";
    string public symbol = "WETH";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    
    mapping(address => uint256) public balance;
    mapping(address => mapping(address => uint256)) public allowance;

    function deposit() external payable override {
        balance[msg.sender] += msg.value;
        totalSupply += msg.value;
    }

    function withdraw(uint256 amount) external override {
        require(balance[msg.sender] >= amount, "Not enough balance");
        balance[msg.sender] -= amount;
        totalSupply -= amount;
        
        // Send the exact requested amount, not all available ETH
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        
        if (!success) {
            revert("WETH withdraw failed");
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

    function balanceOf(address account) external view returns (uint256) {
        return balance[account];
    }

    receive() external payable {}

    fallback() external payable {}

    // Mint function for testing
    function mint(address to, uint256 amount) external {
        balance[to] += amount;
        totalSupply += amount;
    }
}

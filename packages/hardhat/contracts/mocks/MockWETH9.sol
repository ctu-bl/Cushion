// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

import {LoanWrapper} from "../LoanWrapper.sol";
import "hardhat/console.sol";

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
        console.log("MockWETH9: deposit called by", msg.sender, "amount:", msg.value);
        balance[msg.sender] += msg.value;
        totalSupply += msg.value;
        console.log("MockWETH9: new balance for", msg.sender, ":", balance[msg.sender]);
        console.log("MockWETH9: new totalSupply:", totalSupply);
    }

    function withdraw(uint256 amount) external override {
        console.log("MockWETH9: withdraw called by", msg.sender, "amount:", amount);
        console.log("MockWETH9: balance of", msg.sender, ":", balance[msg.sender]);
        console.log("MockWETH9: contract ETH balance:", address(this).balance);
        console.log("MockWETH9: totalSupply:", totalSupply);
        
        require(balance[msg.sender] >= amount, "Not enough balance");
        balance[msg.sender] -= amount;
        totalSupply -= amount;
        
        console.log("MockWETH9: attempting to send ETH to", msg.sender, "amount:", amount);
        console.log("MockWETH9: available ETH balance:", address(this).balance);
        console.log("MockWETH9: required amount:", amount);
        console.log("MockWETH9: sufficient ETH?", address(this).balance >= amount);
        
        // Send the exact requested amount, not all available ETH
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        console.log("MockWETH9: ETH transfer success:", success);
        
        if (!success) {
            console.log("MockWETH9: WETH withdraw failed - ETH transfer failed");
            revert("WETH withdraw failed");
        }
        
        console.log("MockWETH9: withdraw completed successfully");
    }

    function transfer(address to, uint256 amount) external override returns (bool) {
        console.log("MockWETH9: transfer called from", msg.sender);
        console.log("MockWETH9: transfer to", to);
        console.log("MockWETH9: transfer amount:", amount);
        console.log("MockWETH9: balance of", msg.sender, ":", balance[msg.sender]);
        require(balance[msg.sender] >= amount, "Not enough balance");
        balance[msg.sender] -= amount;
        balance[to] += amount;
        console.log("MockWETH9: transfer completed. New balance of", to, ":", balance[to]);
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

    receive() external payable {
        console.log("MockWETH9: receive called with value:", msg.value);
        console.log("MockWETH9: sender:", msg.sender);
        // When ETH is sent directly to contract, it should be available for withdraw
        // We don't automatically mint WETH tokens - that's done via deposit()
        console.log("MockWETH9: ETH received, contract balance now:", address(this).balance);
    }

    fallback() external payable {}

    // Mint function for testing
    function mint(address to, uint256 amount) external {
        console.log("MockWETH9: mint called to", to, "amount:", amount);
        balance[to] += amount;
        totalSupply += amount;
        console.log("MockWETH9: mint completed. New balance of", to, ":", balance[to]);
        console.log("MockWETH9: new totalSupply:", totalSupply);
    }
}

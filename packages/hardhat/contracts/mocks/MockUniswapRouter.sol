// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

/**
 * @title MockUniswapRouter
 * @author CtuBlockhain Lab
 * @notice Mock implementation of Uniswap V3 router for testing
 */
contract MockUniswapRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }
    
    // Simple 1:1 swap for testing with actual token transfers
    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut) {
        console.log("MockUniswapRouter: exactInputSingle called");
        console.log("MockUniswapRouter: tokenIn:", params.tokenIn);
        console.log("MockUniswapRouter: tokenOut:", params.tokenOut);
        console.log("MockUniswapRouter: amountIn:", params.amountIn);
        console.log("MockUniswapRouter: recipient:", params.recipient);
        
        // For testing: return same amount (1:1 swap)
        amountOut = params.amountIn;
        console.log("MockUniswapRouter: amountOut:", amountOut);
        
        // Transfer input tokens from caller to this contract
        console.log("MockUniswapRouter: attempting transferFrom from");
        console.log(msg.sender);
        console.log("MockUniswapRouter: transferFrom to", address(this));
        console.log("MockUniswapRouter: transferFrom amount:", params.amountIn);
        IERC20(params.tokenIn).transferFrom(msg.sender, address(this), params.amountIn);
        console.log("MockUniswapRouter: transferFrom completed successfully");
        
        // For different token output, we need to mint the output tokens
        if (params.tokenOut != params.tokenIn) {
            console.log("MockUniswapRouter: different tokens, attempting to mint output tokens");
            
            // Check if it's WETH - if so, we need to send ETH to the WETH contract
            // We'll check if the token has a deposit function (WETH characteristic)
            (bool hasDeposit, ) = params.tokenOut.call(abi.encodeWithSignature("deposit()"));
            if (hasDeposit) {
                console.log("MockUniswapRouter: output is WETH, minting WETH tokens");
                console.log("MockUniswapRouter: available ETH balance:", address(this).balance);
                console.log("MockUniswapRouter: amount to mint:", amountOut);
                
                // For testing purposes, just mint WETH tokens without sending ETH
                // In real scenario, we would send ETH to WETH contract first
                (bool mintSuccess, ) = params.tokenOut.call(
                    abi.encodeWithSignature("mint(address,uint256)", params.recipient, amountOut)
                );
                console.log("MockUniswapRouter: WETH mint success:", mintSuccess);
                
                if (!mintSuccess) {
                    console.log("MockUniswapRouter: WETH mint failed, trying direct transfer");
                    // If minting fails, try direct transfer (for real tokens)
                    IERC20(params.tokenOut).transfer(params.recipient, amountOut);
                    console.log("MockUniswapRouter: direct transfer completed");
                }
            } else {
                // For other tokens, just mint them
                (bool mintSuccess, ) = params.tokenOut.call(
                    abi.encodeWithSignature("mint(address,uint256)", params.recipient, amountOut)
                );
                console.log("MockUniswapRouter: mint success:", mintSuccess);
                
                if (!mintSuccess) {
                    console.log("MockUniswapRouter: mint failed, attempting direct transfer");
                    // If minting fails, try direct transfer (for real tokens)
                    IERC20(params.tokenOut).transfer(params.recipient, amountOut);
                    console.log("MockUniswapRouter: direct transfer completed");
                } else {
                    console.log("MockUniswapRouter: mint completed successfully");
                }
            }
        } else {
            console.log("MockUniswapRouter: same token, transferring back");
            // Same token, just transfer back
            IERC20(params.tokenOut).transfer(params.recipient, amountOut);
            console.log("MockUniswapRouter: same token transfer completed");
        }
        
        console.log("MockUniswapRouter: exactInputSingle completed, returning:", amountOut);
        return amountOut;
    }
}

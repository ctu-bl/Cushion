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
        
        // Pricing: 1 WETH = 2000 PYUSD (PYUSD 6 decimals, WETH 18 decimals)
        // If output is WETH, convert PYUSD(1e6) -> WETH(1e18): amountOut = amountIn * 1e18 / (2000 * 1e6)
        // If output is PYUSD, convert WETH(1e18) -> PYUSD(1e6): amountOut = amountIn * (2000 * 1e6) / 1e18
        // Otherwise default 1:1
        amountOut = params.amountIn;
        
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
                // Convert PYUSD(1e6) -> WETH(1e18) using 1 WETH = 2000 PYUSD
                amountOut = (params.amountIn * 1e12) / 2000; // = amountIn * 1e18 / (2000 * 1e6)
                console.log("MockUniswapRouter: computed WETH amountOut:", amountOut);
                
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
                // If output is PYUSD, assume input is WETH and compute PYUSD amount
                // amountOut = amountIn * (2000 * 1e6) / 1e18 = amountIn * 2_000_000_000 / 1e18
                amountOut = (params.amountIn * 2_000_000_000) / 1e18;
                console.log("MockUniswapRouter: computed PYUSD amountOut:", amountOut);

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

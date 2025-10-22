// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

interface IMockEthOracle {
    function latestAnswer() external view returns (int256);
    function decimals() external view returns (uint8);
}

/**
 * @title MockUniswapRouter
 * @author CtuBlockhain Lab
 * @notice Mock implementation of Uniswap V3 router for testing
 */
contract MockUniswapRouter {
    address public immutable ethOracle;
    
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
    
    constructor(address _ethOracle) {
        ethOracle = _ethOracle;
    }
    
    // Simple 1:1 swap for testing with actual token transfers
    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut) {
        console.log("MockUniswapRouter: exactInputSingle called");
        console.log("MockUniswapRouter: tokenIn:", params.tokenIn);
        console.log("MockUniswapRouter: tokenOut:", params.tokenOut);
        console.log("MockUniswapRouter: amountIn:", params.amountIn);
        console.log("MockUniswapRouter: recipient:", params.recipient);
        
        // Get ETH price from oracle
        int256 ethPriceInt = IMockEthOracle(ethOracle).latestAnswer();
        uint8 ethPriceDecimals = IMockEthOracle(ethOracle).decimals();
        uint256 ethPrice = uint256(ethPriceInt);
        
        // Normalize ETH price to 1e6 (USDC/PYUSD decimals)
        uint256 ethPriceUsd_e6;
        if (ethPriceDecimals >= 6) {
            ethPriceUsd_e6 = ethPrice / (10 ** (ethPriceDecimals - 6));
        } else {
            ethPriceUsd_e6 = ethPrice * (10 ** (6 - ethPriceDecimals));
        }
        
        console.log("MockUniswapRouter: ETH price from oracle:", ethPriceUsd_e6);
        
        // Default 1:1 for same tokens
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
                // Convert PYUSD(1e6) -> WETH(1e18) using ETH price from oracle
                // amountOut = amountIn * 1e18 / ethPriceUsd_e6
                amountOut = (params.amountIn * 1e18) / ethPriceUsd_e6;
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
                // Check if it's PYUSD to USDC swap (both 1e6 decimals)
                if (params.tokenIn != params.tokenOut) {
                    console.log("MockUniswapRouter: PYUSD to USDC swap (1:1 ratio)");
                    // For PYUSD to USDC, use 1:1 ratio (both have 6 decimals)
                    amountOut = params.amountIn;
                    console.log("MockUniswapRouter: computed USDC amountOut:", amountOut);

                    (bool mintSuccess, ) = params.tokenOut.call(
                        abi.encodeWithSignature("mint(address,uint256)", params.recipient, amountOut)
                    );
                    console.log("MockUniswapRouter: USDC mint success:", mintSuccess);
                    
                    if (!mintSuccess) {
                        console.log("MockUniswapRouter: USDC mint failed, attempting direct transfer");
                        // If minting fails, try direct transfer (for real tokens)
                        IERC20(params.tokenOut).transfer(params.recipient, amountOut);
                        console.log("MockUniswapRouter: USDC direct transfer completed");
                    } else {
                        console.log("MockUniswapRouter: USDC mint completed successfully");
                    }
                } else {
                    // If output is PYUSD, assume input is WETH and compute PYUSD amount
                    // amountOut = amountIn * ethPriceUsd_e6 / 1e18
                    amountOut = (params.amountIn * ethPriceUsd_e6) / 1e18;
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
    
    // Simple function to convert PYUSD to USDC 1:1
    function swapPyUsdToUsdc(address pyusdToken, address usdcToken, uint256 amount) external returns (uint256) {
        console.log("MockUniswapRouter: swapPyUsdToUsdc called");
        console.log("MockUniswapRouter: PYUSD amount:", amount);
        
        // Transfer PYUSD from caller to this contract
        IERC20(pyusdToken).transferFrom(msg.sender, address(this), amount);
        console.log("MockUniswapRouter: PYUSD transferred to router");
        
        // Mint USDC 1:1
        (bool mintSuccess, ) = usdcToken.call(
            abi.encodeWithSignature("mint(address,uint256)", msg.sender, amount)
        );
        console.log("MockUniswapRouter: USDC mint success:", mintSuccess);
        
        if (!mintSuccess) {
            console.log("MockUniswapRouter: USDC mint failed, trying direct transfer");
            IERC20(usdcToken).transfer(msg.sender, amount);
            console.log("MockUniswapRouter: USDC direct transfer completed");
        }
        
        console.log("MockUniswapRouter: swapPyUsdToUsdc completed, returning:", amount);
        return amount;
    }
}

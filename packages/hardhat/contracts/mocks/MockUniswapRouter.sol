// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// import {console} from "hardhat/console.sol";

interface IMockEthOracle {
    function latestAnswer() external view returns (int256);
    function decimals() external view returns (uint8);
}

/**
 * @title MockUniswapRouter
 * @author CTU Blockchain Lab
 * @notice Mock implementation of Uniswap V3 router for testing
 */
contract MockUniswapRouter {
    address public immutable ethOracle;

    address private immutable PYUSD_TOKEN;
    address private immutable WETH_TOKEN;
    address private immutable USDC;
    
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
    
    constructor(address _ethOracle, address _pyusd, address _usdc) {
        ethOracle = _ethOracle;
        PYUSD_TOKEN = _pyusd;
        USDC = _usdc;
    }
    
    // Simple 1:1 swap for testing with actual token transfers
    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut) {
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
                
        // Default 1:1 for same tokens
        amountOut = params.amountIn;
        
        // Transfer input tokens from caller to this contract
        IERC20(params.tokenIn).transferFrom(msg.sender, address(this), params.amountIn);
        
        // For different token output, we need to mint the output tokens
        if (params.tokenOut != params.tokenIn) {
            
            // Check if it's WETH - if so, we need to send ETH to the WETH contract
            // We'll check if the token has a deposit function (WETH characteristic)
            (bool hasDeposit, ) = params.tokenOut.call(abi.encodeWithSignature("deposit()"));
            if (hasDeposit) {
                // Convert PYUSD(1e6) -> WETH(1e18) using ETH price from oracle
                // amountOut = amountIn * 1e18 / ethPriceUsd_e6
                amountOut = (params.amountIn * 1e18) / ethPriceUsd_e6;
                
                // For testing purposes, just mint WETH tokens without sending ETH
                // In real scenario, we would send ETH to WETH contract first
                (bool mintSuccess, ) = params.tokenOut.call(
                    abi.encodeWithSignature("mint(address,uint256)", params.recipient, amountOut)
                );
                
                if (!mintSuccess) {
                    // If minting fails, try direct transfer (for real tokens)
                    IERC20(params.tokenOut).transfer(params.recipient, amountOut);
                }
            } else {
                // Check if it's PYUSD to USDC swap (both 1e6 decimals)
                if (params.tokenIn == PYUSD_TOKEN && params.tokenOut == USDC) {
                    // For PYUSD to USDC, use 1:1 ratio (both have 6 decimals)
                    amountOut = params.amountIn;

                    (bool mintSuccess, ) = params.tokenOut.call(
                        abi.encodeWithSignature("mint(address,uint256)", params.recipient, amountOut)
                    );
                    
                    if (!mintSuccess) {
                        // If minting fails, try direct transfer (for real tokens)
                        IERC20(params.tokenOut).transfer(params.recipient, amountOut);
                    }
                } else {
                    // If output is PYUSD, assume input is WETH and compute PYUSD amount
                    // amountOut = amountIn * ethPriceUsd_e6 / 1e18
                    amountOut = (params.amountIn * ethPriceUsd_e6) / 1e18;

                    (bool mintSuccess, ) = params.tokenOut.call(
                        abi.encodeWithSignature("mint(address,uint256)", params.recipient, amountOut)
                    );
                    
                    if (!mintSuccess) {
                        // If minting fails, try direct transfer (for real tokens)
                        IERC20(params.tokenOut).transfer(params.recipient, amountOut);
                    }
                }
            }
        } else {
            // Same token, just transfer back
            IERC20(params.tokenOut).transfer(params.recipient, amountOut);
        }
        
        return amountOut;
    }
    
    // Simple function to convert PYUSD to USDC 1:1
    function swapPyUsdToUsdc(address pyusdToken, address usdcToken, uint256 amount) external returns (uint256) {        
        // Transfer PYUSD from caller to this contract
        IERC20(pyusdToken).transferFrom(msg.sender, address(this), amount);
        
        // Mint USDC 1:1
        (bool mintSuccess, ) = usdcToken.call(
            abi.encodeWithSignature("mint(address,uint256)", msg.sender, amount)
        );
        
        if (!mintSuccess) {
            IERC20(usdcToken).transfer(msg.sender, amount);
        }
        
        return amount;
    }
}

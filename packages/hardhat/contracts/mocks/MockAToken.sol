// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface IERC20Like {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address who) external view returns (uint256);
}

contract MockAToken {
    IERC20Like public immutable underlying;

    constructor(address _underlying) {
        underlying = IERC20Like(_underlying);
    }

    // For reserve liquidity check: available liquidity equals underlying.balanceOf(address(this))
}

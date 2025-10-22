// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

/**
 * @title MockChainlinkOracle
 * @author CtuBlockhain Lab
 * @notice Mock implementation of Chainlink price feed for testing
 */
contract MockChainlinkOracle {
    int256 public price;
    uint8 public decimals;
    
    constructor(int256 _price, uint8 _decimals) {
        price = _price;
        decimals = _decimals;
    }
    
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        return (
            1, // roundId
            price, // answer
            block.timestamp, // startedAt
            block.timestamp, // updatedAt
            1 // answeredInRound
        );
    }
    
    function setPrice(int256 _newPrice) external {
        price = _newPrice;
    }
}

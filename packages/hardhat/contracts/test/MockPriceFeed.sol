// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

/// @notice Minimalní Chainlink-like rozhraní: latestRoundData() vrací cenu s 8 dec.
contract MockPriceFeed {
    int256 public price; // 8 decimals

    constructor(int256 _price) { price = _price; }

    function setPrice(int256 _price) external { price = _price; }

    function latestRoundData()
        external
        view
        returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)
    {
        return (0, price, 0, 0, 0);
    }
}

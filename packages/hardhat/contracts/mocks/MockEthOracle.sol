// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MockEthOracle
 * @dev A mock oracle contract to simulate ETH price feeds, similar to Chainlink.
 *      Only the owner can update the price. Useful for testing.
 */
contract MockEthOracle {
    /// @notice Address of the contract owner
    address public owner;

    /// @notice Last reported price
    int256 private price;

    /// @notice Number of decimals the price uses (immutable)
    uint8 public immutable decimals;

    /**
     * @notice Emitted when the price is updated
     * @param newPrice The new price
     * @param timestamp The block timestamp when the price was updated
     * @param who The address that updated the price
     */
    event PriceUpdated(int256 indexed newPrice, uint256 timestamp, address indexed who);

    /**
     * @dev Modifier to allow only the owner to execute a function
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "MockEthOracle: not owner");
        _;
    }

    /**
     * @notice Constructor sets initial price, decimals, and owner
     * @param _initialPrice Initial price to set
     * @param _decimals Number of decimals the price uses
     */
    constructor(int256 _initialPrice, uint8 _decimals) {
        owner = msg.sender;
        price = _initialPrice;
        decimals = _decimals;
        emit PriceUpdated(_initialPrice, block.timestamp, msg.sender);
    }

    /**
     * @notice Sets a new price
     * @dev Only callable by the owner
     * @param _newPrice New price to set (e.g., for 3000 USD with decimals=8 => 3000 * 10**8)
     */
    function setPrice(int256 _newPrice) external onlyOwner {
        price = _newPrice;
        emit PriceUpdated(_newPrice, block.timestamp, msg.sender);
    }

    /**
     * @notice Returns the latest price and timestamp
     * @return int256 The last reported price
     * @return uint256 The timestamp of the last price update
     */
    function getLatestPrice() external view returns (int256, uint256) {
        return (price, block.timestamp);
    }

    /**
     * @notice Returns the last reported price
     * @return int256 The last reported price
     */
    function latestAnswer() external view returns (int256) {
        return price;
    }
    /**
     * @notice Returns the timestamp of the latest price
     * @return uint256 Current block timestamp
     */

    function latestTimestamp() external view returns (uint256) {
        return block.timestamp;
    }

    /**
     * @notice Transfers ownership of the contract to a new address
     * @dev Only callable by the current owner. Cannot transfer to zero address.
     * @param _newOwner The address of the new owner
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "MockEthOracle: zero address");
        owner = _newOwner;
    }
}

/**
 * @title PriceConsumer
 * @dev Example contract consuming the MockEthOracle
 */
contract PriceConsumer {
    /// @notice Reference to the MockEthOracle
    MockEthOracle public oracle;

    /**
     * @notice Constructor sets the oracle contract address
     * @param _oracle Address of the MockEthOracle contract
     */
    constructor(address _oracle) {
        oracle = MockEthOracle(_oracle);
    }

    /**
     * @notice Reads the price and decimals from the oracle
     * @return int256 The latest price
     * @return uint8 The decimals used by the price
     */
    function readPrice() external view returns (int256, uint8) {
        return (oracle.latestAnswer(), oracle.decimals());
    }

    /**
     * @notice Reads the price as a positive uint256
     * @dev Reverts if the price is negative
     * @return uint256 Latest price as unsigned integer
     */
    function readPriceAsUint() external view returns (uint256) {
        int256 p = oracle.latestAnswer();
        require(p >= 0, "PriceConsumer: negative price");
        return uint256(p);
    }
}

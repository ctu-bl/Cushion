// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import {IPoolAddressesProvider} from "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";

contract MockAddressesProvider is IPoolAddressesProvider {
    address public pool;
    constructor(address _pool) { pool = _pool; }
    function getPool() external view override returns (address) { return pool; }

    // Unused methods
    function getMarketId() external pure override returns (string memory) { return ""; }
    function setMarketId(string calldata) external pure override {}
    function getAddress(bytes32) external pure override returns (address) { return address(0); }
    function setAddressAsProxy(bytes32, address) external pure override {}
    function setAddress(bytes32, address) external pure override {}
    function setPoolImpl(address) external pure override {}
    function getPoolConfigurator() external pure override returns (address) { return address(0); }
    function setPoolConfiguratorImpl(address) external pure override {}
    function getPriceOracle() external pure override returns (address) { return address(0); }
    function setPriceOracle(address) external pure override {}
    function getACLManager() external pure override returns (address) { return address(0); }
    function setACLManager(address) external pure override {}
    function getACLAdmin() external pure override returns (address) { return address(0); }
    function setACLAdmin(address) external pure override {}
    function getPriceOracleSentinel() external pure override returns (address) { return address(0); }
    function setPriceOracleSentinel(address) external pure override {}
    function getPoolDataProvider() external pure override returns (address) { return address(0); }
    function setPoolDataProvider(address) external pure override {}
}

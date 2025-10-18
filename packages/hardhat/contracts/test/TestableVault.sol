// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import {Vault} from "../Vault.sol";
import {MockERC20} from "../mocks/MockERC20.sol";

/// @notice Testovací potomkem Vaultu: používá mock swap adapter místo dědění
contract TestableVault is Vault {
    uint256 public ethPer1e18Pyusd; // kurz: kolik wei za 1e18 PYUSD (např. 1e15 => 0.001 ETH)

    constructor(string memory _name, string memory _symbol) Vault(_name, _symbol) {}

    function setMockSwapRate(uint256 _ethPer1e18) external {
        ethPer1e18Pyusd = _ethPer1e18;
    }

    
}

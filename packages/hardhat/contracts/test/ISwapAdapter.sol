// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

interface ISwapAdapter {
    /// @notice Prohoď PYUSD -> ETH a vrať počet wei, které Vault získá.
    /// @dev Implementace adapteru pošle ETH přímo Vaultu (msg.sender) a vrátí stejné číslo.
    function swapPyUsdToEth(address pyusd, uint256 amountPyUsd) external returns (uint256 ethOut);
}

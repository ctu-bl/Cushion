// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

/// @notice Mock wrapper pro test injectToLoan.
/// Vrací USD metriky (8 dec) a umí přijmout ETH/WETH jako kolaterál.
contract MockLoanWrapperForInject {
    // USD values: 8 decimals
    uint256 public totalCollateralUsd;
    uint256 public totalDebtUsd;

    // Logging pro aserty
    uint256 public lastEthIn;        // přijaté ETH přes increaseCollateral
    uint256 public timesCalled;      // kolikrát se volalo increaseCollateral

    // ---- API očekávané Vaultem ----
    function getTotalCollateralValue() external view returns (uint256) {
        return totalCollateralUsd;
    }

    function getTotalDebtValue() external view returns (uint256) {
        return totalDebtUsd;
    }

    /// @notice Payable příjem kolaterálu v ETH. Vault posílá {value: amountEthOut}
    function increaseCollateral(uint256 /*amount*/) external payable {
        lastEthIn += msg.value;
        timesCalled += 1;
    }

    // ---- Helpers pro test ----
    function setValues(uint256 collateralUsd8, uint256 debtUsd8) external {
        totalCollateralUsd = collateralUsd8;
        totalDebtUsd = debtUsd8;
    }
}

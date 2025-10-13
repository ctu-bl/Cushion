// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title Vault
 * @author CtuBlockhain Lab
 * @dev Only one asset is supported as deposit token (e.g., pyUSD)
 * 
 * Responsibilities:
 * - Be able to make LP(liquidity provider) deposit/withdraw money
 * - Since we are using ERC4626 there is already deposit and withdraw function
 * - Track each LP money, and their yield
 * - Inject and withdraw collateral from LoanWrapped loans based on health factor
 * - Enable liquidation of unhealthy loans via falshloans
 */
contract Vault is ERC4626, Ownable {
    using Math for uint256;

    // ------------------ERRORS------------------
    error Vault__InsufficientLiquidity();
    error Vault__InvalidLoanAddress();
    error Vault__HealthFactorTooHigh();
    error Vault__HealthFactorTooLow();
    error Vault__NoInjectedAssets();
    error Vault__AlreadyInjected();
    error Vault__FlashloanFailed();
    error Vault__InvalidThresholds();
    // More errors maybe ???

    // ------------------CONSTANTS------------------
    address public constant PYUSD_TOKEN = 0x165834e1431551087342775167765C125860d5b1; // TODO: I think this is the correct address, need to fix it maybe

    // ---------------------STRUCTS----------------------

    /**
     * @notice Stores information about capital injected into a specific loan.
     * @param amount The principal amount of the asset token that was injected.
     * @param initialAccumulatedInterest The global interest index at the moment of injection.
     */
    struct InjectedCapital {
        uint256 amount; // Original injected amount
        uint256 initialAccumulatedInterest; // Acumulated interest with yield
    }

    /// @notice Mapping from a loan wrapper address to its injected capital data.
    mapping(address => InjectedCapital) public injectedAssets;

    /// @notice The annual interest rate charged on injected capital (1e18 precision).
   
    uint256 public interestRate == ????; // TODO: Decide to interestRate if we have decided to be 5% it should be 5 * 1e16 I think;

    /// @notice The global accumulated interest index, representing the growth of capital over time.
    uint256 public accumulatedInterest;

    /// @notice The timestamp of the last time the accumulated interest was updated.
    uint256 public lastInterestUpdate;

    /// @notice Health Factor threshold below which capital injection is permitted.
    uint256 public injectionThreshold == ??; // TODO: Decide the 

    /// @notice Health Factor threshold above which injected capital can be withdrawn.
    uint256 public withdrawalThreshold == ??; // TODO: Decide the threshold

    /// @notice The total principal amount of assets currently injected across all loans.
    uint256 public totalInjectedAssets;


    // --------------------EVENTS----------------------
    /// @notice Emitted when capital is successfully injected into a loanWrapper
    event CapitalInjected(address indexed loan, uint256 amount);
    
    /// @notice Emitted when capital is successfully withdrawn from a loanWrapper
    event CapitalWithdrawn(address indexed loan, uint256 amount);
    
    /// @notice Emitted when a loan is successfully liquidated
    event LoanLiquidated(address indexed loan, uint256 profit);
    
    /// @notice Emitted when the accumulated interest index is updated
    event InterestUpdated(uint256 newAccumulatedInterest, uint256 timestamp);
    
    /// @notice Emitted when the interest rate is set
    event InterestRateSet(uint256 newRate);
    
    /// @notice Emitted when the thresholds are set
    event ThresholdsSet(uint256 injection, uint256 withdrawal, uint256 liquidation);
    
    /// @notice Emitted when an amount is injected from Liquid Provider to Vault
    event CapitalInjectedFromLiquidProvider (address indexed loan, uint256 amount);
    
    /// @notice Emitted when an amount is withdrawn from Vault to Liquid Provider
    event CapitalWithdrawnFromLiquidProvider (address indexed loan, uint256 amount);
    
    // --------------------MODIFIERS----------------------------
    // Here is yet nothing, but maybe will add something

    
    // -------------------CONSTRUCTOR------------------------
    /**
     * @notice Initializes the Vault for a specific asset (pyUSD).
     * @param _name Name for the vault's ERC4626 share token.
     * @param _symbol Symbol for the vault's ERC20 share token.
     */
    constructor(
        string memory _name,
        string memory _symbol
    ) ERC4626(ERC20(PYUSD_TOKEN)) ERC20(_name, _symbol) {
        accumulatedInterest = 1e18; // Start with an index of 1.0
        lastInterestUpdate = block.timestamp;
    }

    // -------------------ADMIN FUNCTIONS-------------------
    // Having this admin function can help us monitor at what rate we can injust the interest

    /**
     * @notice Sets the annual interest rate for injected capital.
     * @param _newRate The new annual rate in 1e18 precision.
     */
    function setInterestRate(uint256 _newRate) external onlyOwner {
        // TODO: IMPLEMENT THIS
    }

    /**
     * @notice Sets the health factor thresholds for vault operations.
     */
    function setThresholds(
        uint256 _injection,
        uint256 _withdrawal,
        uint256 _liquidation
    ) external onlyOwner {
        // TODO: IMPLEMENT THIS
    }

    // ------------------EXTERNAL FUNCTIONS-----------------------
    /**
     * @notice Injects liquidity from the vault into a risky loan.
     * @param loan Address of the Cushion LoanWrapper.
     * @dev Can be called by anyone when a loan's HF is below the injection threshold.
     */
    function injectToLoan(address loan) external {
        // TODO: IMPLEMENT THIS
        
        // 1. Checks:
        //    - Need to get HF from LoanWrapper 
        //    - require (HF that is takne < injectionThreshold, "Still to high, will not inject");
        //    - require (ijectedAssets[loan].amount == 0, "The Loan is Already injected");
        //    - Calculate how much to deposit so the health factor will be good again
        //    - require (asset.balanceOf(address(this)) >= injectionAmount, "There is not enough liquidity to inject");
        //    
        // 2. Effects:
        //    - Update state: store the injection amount and current `accumulatedInterest`.
        //    - Update `totalInjectedAssets`.
        //
        // 3. Interactions:
        //    - Transfer the asset to the loan contract.
    }

    /**
     * @notice Withdraws previously injected capital from a recovered loan.
     * @param loan Address of the Cushion LoanWrapper.
     * @dev Can be called by anyone when a loan's HF is above the withdrawal threshold.
     */
    function withdrawFromLoan(address loan) external {
        // TODO: IMPLEMENT THIS;
        //
        // 1. Checks:
        //    - require(injectedAssets[loan].amount > 0, "NoInjectedAssets");
        //    - Possible only when capital has been injected
        //    - Get loan's Health Factor.
        //    - require(HF > withdrawalThreshold, "HealthFactorTooLow");
        //
        // 2. Effects:
        //    - Calculate how much to withdraw (principal + interest).
        //    - Update `totalInjectedAssets`.
        //    - Delete the entry from `injectedAssets`.
        //
        // 3. Interactions:
        //    - Call the LoanWrapper to pull the funds back to this vault.
    }

    /**
     * @notice Liquidates a loan to protect the vault's capital.
     * @param loan Address of the Cushion LoanWrapper.
     * @dev Can be called by anyone when a loan's HF is below the liquidation threshold.
     */
    function liquidate(address loan) external {
        // 1. Checks:
        //    - require(injectedAssets[loan].amount > 0, "NoInjectedAssets");
        //    - Possible only when capital has been injected
        //    - Get loan's Health Factor.
        //    - require(HF < liquidationThreshold, "HealthFactorTooLow");
        //
        // 2. Interactions:
        //    TODO: Ask how to actually implemnt this
        //      - This is what LLM has written me:
        //
        //    - This is the complex part   
        //    - Initiate a flashloan for the debt asset.
        //    - In the callback, liquidate the position via the LoanWrapper.
        //    - Swap the received collateral back to the debt asset.
        //    - Repay the flashloan.
        //    - Ensure the operation was profitable.
    }

    // -------------------VIEW AND HELPER FUNCTIONS-------------------

    /**
     * @notice Updates the `accumulatedInterest` index based on the `interestRate`.
     * @dev Should be called at the beginning of any function that relies on the current value.
     */
    function updateAccumulatedInterest() public {
        // TODO: IMPLEMENT THIS
    }

    /**
     * @notice Returns the total value of assets managed by the vault.
     * @dev Overrides the ERC4626 standard to include the value of injected capital.
     */
    function totalAssets() public view override returns (uint256) {
        // This function should return the assets, how much is actually in the vault 
        // plus the principal amount of capital that is currently deployed in loans. 
        return asset().balanceOf(address(this)) + totalInjectedAssets;
    }

    /**
     * @notice Calculates the current value of a specific injected loan, including interest.
     * @param loan Address of the wrapped loan.
     * @return The current value of the injected capital.
     */
    function currentLoanValue(address loan) public view returns (uint256) {
        // Implementation:
        // 1. Get the stored injected data for the loan.
        // 2. Calculate the interest accrued since injection:
        //    currentValue = ((sum_of_all_collateral - sum_of_all_debt) * (sum_of_all_debt / sum_of_all_collateral)) / 2;
        // 3. Return the result.
        return 0; // Placeholder
    }

    /**
     * Maybe more functions, will add it later
     */
}

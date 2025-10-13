// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.30;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";


/**
 * @title LoanWrapper
 * @author Ondřej Palouš
 * @notice ERC721 wrapper for loan taken on Over-Collateralized lending/borrowing protocol
 * @notice The owner of this contract is the user who took the loan
 * This contract acts as an "middle-man" between the owner (user that took the loan) and the protocol.
 * As the Health Factor goes under certain threshold, the owner loses the control over the loan and is managed by 3rd party or Vault
 * @notice When the Health Factor gets back to normal, user can request his permissions back
 
 * @dev Uses OpenZeppelin library for ERC721 and Ownable implementation
 */
contract LoanWrapper is ERC721, Ownable {
    // ------------------ERRORS------------------
    error LoanWrapper__BreaksHealthFactor();
    error LoanWrapper__WrapperNotUnlocked();
    error LoanWrapper__AccessDenied();
    error LoanWrapper__InsufficientAllowance();

    // ------------------CONSTANTS------------------
    uint8 private immutable LOCKING_THRESHOLD = 115;
    // Should the locking and unlocking threshold be the same?
    uint8 private immutable UNLOCKING_THRESHOLD = 120;

    address private WRAPPER_REGISTRY;

    // ------------------STATE VARIABLES------------------
    /// @notice Amount of tokens representing users collateral
    uint256 private s_initCollateral;

    /// @notice Amount of tokens that 3rd party provided to increase the collateral
    uint256 private s_investorCollateral;

    /// @notice Amount of tokens borrowed by the user
    uint256 private s_borrowedAmount;


    /// @notice Dddress of the 3rd party that increased the collateral
    address private s_investor;

    /// @notice Simple boolean value for giving/taking control to/from the owner
    bool private locked = false;

    // ------------------EVENTS------------------


    /// @notice Emitted when the collateral is increased by the user or 3rd party (or Vault)
    event CollateralIncreased(address indexed loanAddress, address indexed performedBy, uint256 indexed newAmount);
    
    /// @notice Emitted when the collateral is decreased by the user or 3rd party (or Vault)
    event CollateralDecreased(address indexed loanAddress, address indexed performedBy, uint256 indexed newAmount);
    
    /// @notice Emitted when the debt is increased by the user
    event DebtIncreased(address indexed loanAddress, uint256 newAmount);
    
    /// @notice Emitted when the debt is decreased by the user
    event DebtDecreased(address indexed loanAddress, uint256 newAmount);

    /// @notice Emitted when the user loses access to the wrapper
    event WrapperLocked(address indexed loanAddress);

    /// @notice Emitted when the user is granted access to the wrapper again
    event WrapperUnlocked(address indexed loanAddress);

    // ------------------CONSTRUCTOR------------------
    /**
     * @notice Constructs the wrapper as an ERC721 collection. The owner is the userthat took the loan
     */
    // I'm not sure this will work. Maybe there should be transferOwnership in constructor
    // and initial owner should be msg.sender -> Registry
    constructor(address owner, uint256 collateral, uint256 amount, address registry)
        ERC721("Wrapped Loan", "WL") Ownable(owner) {
            s_initCollateral = collateral;
            s_borrowedAmount = amount;
            WRAPPER_REGISTRY = registry;
        }

    // ------------------MODIFIERS------------------
    modifier wrapperUnlocked() {
        if (locked) {
            revert LoanWrapper__WrapperNotUnlocked();
        }
        _;
    }

    modifier onlyOwnerOrInvestor() {
        if (msg.sender != owner() && msg.sender != s_investor) {
            revert LoanWrapper__AccessDenied();
        }
        _;
    }

    // ------------------PUBLIC FUNCTIONS------------------
    

    // ------------------EXTERNAL AND VIEW FUNCTIONS------------------
    /**
     * @notice Increases the collateral associated with the loan. HF should increase
     * @param amount Amount of tokens of the asset that owner (or 3rd party, Vault)
     * wants to add
     * 
     * @dev Owner can execute this function only when the HF isn't below the threshold
     */
    function increaseCollateral(uint256 amount) external {
        // --Checks--
        if (msg.sender == owner() && locked) {
            revert LoanWrapper__WrapperNotUnlocked();
        }
        if (s_investor != address(0) || (msg.sender != onwer() && !locked)) {
            revert LoanWrapper__AccessDenied();
        }
        if (amount < 0) {
            revert LoanWrapper__InvalidAmount();
        }
        uint256 allowed = collateralToken.allowance(msg.sender, address(this));
        if (allowed < amount) { 
            revert LoanWrapper__InsufficientAllowance();
        }
        // --Effects--
        // SOMETHING?.transferFrom(msg.sender, address(this), amount);
        // SOMETHING is IERC20 collateralToken
        // there has to be called approve() before this
        s_investor = msg.sender;
        s_investorCollateral = amount;
        // --Interactions--
        emit CollateralIncreased(address(this), msg.sender, amount);
    }

    /**
     * @notice Decreases the collateral associated with the loan. HF should decrease and 
     * shouldn't go below the threshold 
     * @param amount Amount of tokens of the asset that owner (or 3rd party, Vault)
     * wants to retrieve
     * 
     * @dev Owner can execute this function only when the HF isn't below the threshold
     */
    function decreaseCollateral(uint256 amount) external onlyOwnerOrInvestor {
        // --Checks--
        if (msg.sender == owner() && locked) {
            revert LoanWrapper__WrapperNotUnlocked();
        }
        if (msg.sender != owner() && !locked) {
            revert LoanWrapper__AccessDenied();
        }
        // Conversions?
        if (amount < 0 || amount > s_initCollateral) {
            revert LoanWrapper__InvalidAmount();
        }
        // Should we restrict the investor to withdraw all of his supplies or only its part?
        // **********************NOTE****************** - no update of of s_investor
        // to zero when all collateral is withdrawn
        uint256 newCollateral = s_investorCollateral - amount;
        // Shouldn't be this logic rather in Registry?
        if (computeHealthFactor(newCollateral, s_borrowedAmount) < LOCKING_THRESHOLD) {
            revert LoanWrapper__BreaksHealthFactor();
        }
        // --Effects--
        // SOMETHING?.transfer(msg.sender, amount);
        // SOMETHING is IERC20 collateralToken
        s_investorCollateral -= newCollateral;
        // Return tokens back to the owner?
        // --Interactions--
        emit CollateralDecreased(address(this), msg.sender, newCollateral);
    }

    /**
     * @notice Increases the debt of the owner. HF should decrease and shouldn't
     * go below the threshold
     * @param amount Amount of tokens of the asset that owner wants to borrow
     * @notice This function can only be executed when the HF isn't too low (locked = false)
     * 
     * @dev Only owner of the loan can call this function
     */
    function increaseDebt(uint256 amount) external onlyOwner wrapperUnlocked {
        // --Checks--
        if (amount < 0) {
            revert LoanWrapper__InvalidAmount();
        }
        uint256 newDebt = s_borrowedAmount + amount;
        if (computeHealthFactor(s_initCollateral, newDebt) < LOCKING_THRESHOLD) {
            revert LoanWrapper__BreaksHealthFactor();
        }
        // --Effects--
        s_borrowedAmount = newDebt;
        // --Interactions--
        emit DebtIncreased(address(this), newAmount);
    }

    /**
     * @notice Decreases the debt of the owner. HF should increase
     * @param amount Amount of tokens of the asset that owner wants to retrieve
     * @notice This function can only be executed when the HF isn't too low (locked = false)
     * 
     * @dev Only owner of the loan can call this function
     */
    function decreaseDebt(uint256 amount) external onlyOwner wrapperUnlocked {
        // --Checks--
        // Conversions?
        if (amount < 0 || amount > s_borrowedAmount) {
            revert LoanWrapper__InvalidAmount();
        }

        // --Effects--
        s_borrowedAmount -= amount;
        // --Interactions--
        emit DebtDecreased(address(this), newAmount);
    }

    /// @notice Getter for state variable {locked}
    function isLocked() external view returns (bool) {
        return locked;
    }

    // Can be merged into one function... What is better approach?
    function lockWrapper() external {
        // --Checks--
        if (msg.sender != WRAPPER_REGISTRY) {
            revert LoanWrapper__AccessDenied();
        }
        // --Effects--
        locked = true;
        // --Interactions--
        emit WrapperLocked(address(this));
    }

    function unlockWrapper() external {
        // --Checks--
        if (msg.sender != WRAPPER_REGISTRY) {
            revert LoanWrapper__AccessDenied();
        }
        // --Effects--
        locked = false;
        // --Interactions--
        emit WrapperUnlocked(address(this));
    }
    
    // ------------------PRIVATE AND INTERNAL FUNCTIONS------------------
    function computeHealthFactor(uint256 _collateral, uint256 _debt) internal returns (uint256) {
        
    }
}
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

// import {console} from "hardhat/console.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IPoolAddressesProvider} from "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import {IPool} from "@aave/core-v3/contracts/interfaces/IPool.sol";
import {DataTypes} from "@aave/core-v3/contracts/protocol/libraries/types/DataTypes.sol";


interface IDelegationToken {
    function approveDelegation(address delegatee, uint256 amount) external;
}

interface IWETH9 {
    function deposit() external payable;
    function withdraw(uint256) external;
    function transfer(address, uint256) external;
}


/**
 * @title LoanWrapper
 * @author CTU Blockchain Lab
 * @notice Custom wrapper for loan taken on Over-Collateralized lending/borrowing protocol
 * @notice The owner of this contract is the user who took the loan
 * This contract acts as an "middle-man" between the owner (user that took the loan) and the protocol.
 * As the Health Factor drops below certain threshold, the owner loses the control over the loan and is managed by whitelisted 3rd party (Vault)
 * @notice When the Health Factor gets back to normal, user can request his permissions back
 
 * @dev Uses OpenZeppelin library for Ownable implementation
 */
contract LoanWrapper is Ownable {
    // ------------------ERRORS------------------
    error LoanWrapper__BreaksHealthFactor();
    error LoanWrapper__WrapperNotUnlocked();
    error LoanWrapper__AccessDenied();
    error LoanWrapper__InsufficientAllowance();
    error LoanWrapper__InvalidAmount();
    error LoanWrapper__NothingToRepay();
    error LoanWrapper__NotAccesibleForInvestor();
    error LoanWrapper__WithdrawFailed();

    // ------------------CONSTANTS------------------
    address private VAULT;
    address private REGISTRY;
    uint256 private immutable LOCKING_THRESHOLD = 115 * 1e16;
    uint256 private immutable UNLOCKING_THRESHOLD = 150 * 1e16;
    address private COL_TOKEN_ADDR;
    address private DEBT_TOKEN_ADDR;
    IPoolAddressesProvider private PROVIDER;

    // ------------------STATE VARIABLES------------------
    /// @notice Amount of tokens representing users collateral
    uint256 private s_initCollateral;

    /// @notice Amount of tokens that 3rd party provided to increase the collateral
    uint256 private s_investorCollateral = 0;

    /// @notice Amount of tokens borrowed by the user
    uint256 private s_borrowedAmount;

    /// @notice Address of the 3rd party that increased the collateral
    address private s_investor = address(0);

    /// @notice Simple boolean value for giving/taking control to/from the owner
    bool private locked = false;
    
    /// @notice Whether the wrapper is active
    bool private isActive = false;

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

    /// @notice Emitted when loan is repaid
    event LoanRepaid(address indexed loanAddress);

    // ------------------CONSTRUCTOR------------------
    /**
     * @notice Constructs the wrapper. The owner is the user that took the loan
    */
    constructor(address owner, uint256 collateral, uint256 amount, address vault,
    address colTokenAddr, address debtTokenAddr, address provider)
    Ownable(owner) {
            s_initCollateral = collateral;
            s_borrowedAmount = amount;
            VAULT = vault;
            COL_TOKEN_ADDR = colTokenAddr;
            DEBT_TOKEN_ADDR = debtTokenAddr;
            REGISTRY = msg.sender;
            PROVIDER = IPoolAddressesProvider(provider);

            IPool pool = IPool(PROVIDER.getPool());
            DataTypes.ReserveData memory r = pool.getReserveData(DEBT_TOKEN_ADDR);
            IDelegationToken(r.variableDebtTokenAddress).approveDelegation(
            msg.sender,
            amount
        );
        isActive = true;
        }

    // ------------------MODIFIERS------------------
    modifier wrapperUnlocked() {
        if (locked) {
            revert LoanWrapper__WrapperNotUnlocked();
        }
        _;
    }

    modifier onlyOwnerOrVault() {
        if (msg.sender != owner() && msg.sender != VAULT) {
            revert LoanWrapper__AccessDenied();
        }
        _;
    }

    modifier onlyOwnerOrInvestor() {
        if (msg.sender != owner() && msg.sender != s_investor) {
            revert LoanWrapper__AccessDenied();
        }
        _;
    }

    modifier allowOnThreshold() {
        IPool pool = IPool(PROVIDER.getPool());
        (, , , , , uint256 hf) = pool.getUserAccountData(address(this));
        if (s_investor != address(0) && s_investor != msg.sender) {
            revert LoanWrapper__AccessDenied();
        }
        if (msg.sender != owner() && msg.sender != VAULT && hf > LOCKING_THRESHOLD) {
            revert LoanWrapper__NotAccesibleForInvestor();
        }
        _;
    }

    modifier onlyRegistry() {
        if (msg.sender != REGISTRY) {
            revert LoanWrapper__AccessDenied();
        }
        _;
    }

    // ------------------EXTERNAL AND VIEW FUNCTIONS------------------
    /**
     * @notice Increases the collateral associated with the loan. HF should increase
     * @param amount Amount of tokens of the asset that owner (or 3rd party, Vault)
     * wants to add
     * 
     * @dev Owner can execute this function only when the HF isn't below the threshold
     */
    function increaseCollateral(uint256 amount) external payable allowOnThreshold {
        // --Checks--
        if (locked) {
            revert LoanWrapper__WrapperNotUnlocked();
        }
        if (amount <= 0) {
            revert LoanWrapper__InvalidAmount();
        }
        if (msg.value < amount) {
            revert LoanWrapper__InsufficientAllowance();
        }
        // --Effects--
        IPool pool = IPool(PROVIDER.getPool());
        if (msg.sender != owner()) {
            s_investor = msg.sender;
            s_investorCollateral = amount;
            lockWrapper();
        } else {
            s_initCollateral += amount;
        }

        // --Interactions--
        IWETH9(COL_TOKEN_ADDR).deposit{value: msg.value}();
        IERC20(COL_TOKEN_ADDR).approve(address(pool), msg.value);
        pool.deposit(COL_TOKEN_ADDR, amount, address(this), 0);
        
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
    function decreaseCollateral(uint256 amount) external payable onlyOwnerOrInvestor {
        // --Checks--
        if (msg.sender == owner() && locked) {
            revert LoanWrapper__WrapperNotUnlocked();
        }
        if (amount <= 0 || (amount > s_initCollateral) && msg.sender == owner()) {
            revert LoanWrapper__InvalidAmount();
        }
        if ((amount > s_investorCollateral)  && msg.sender == s_investor) {
            revert LoanWrapper__InvalidAmount();
        }
        
        int256 negativeCol = -int256(amount) * int256(2000);
        IPool pool = IPool(PROVIDER.getPool());
        (uint256 col, uint256 debt, , uint256 lt, ,) = pool.getUserAccountData(address(this));
        if (computeHF(col, debt, lt, negativeCol, 0) < UNLOCKING_THRESHOLD) {
            revert LoanWrapper__BreaksHealthFactor();
        }
        // ---- Interactions (withdraw WETH from Aave pool to this wrapper) ----
        uint256 withdrawn = pool.withdraw(COL_TOKEN_ADDR, amount, address(this));
        if (withdrawn != amount) revert LoanWrapper__WithdrawFailed();

        // ---- Effects (update local accounting) ----
        if (msg.sender == s_investor) {
            s_investorCollateral = s_investorCollateral - amount;
            s_investor = address(0);
            unlockWrapper();
        } else {
            s_initCollateral = s_initCollateral - amount;
        }

        // ---- Interactions (unwrap and payout) ----
        IWETH9(COL_TOKEN_ADDR).withdraw(amount);
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) {
            revert LoanWrapper__WithdrawFailed();
        }

        emit CollateralDecreased(address(this), msg.sender, amount);
    }

    /**
     * @notice Decreases collateral for Vault operations (withdraws specific amounts from both user and investor collateral)
     * @param investorAmount Amount of investor collateral to withdraw
     * @param userAmount Amount of user collateral to withdraw
     *
     * @dev Only callable by Vault
     */
    function decreaseCollateralForVault(uint256 investorAmount, uint256 userAmount) external onlyOwnerOrVault {
        // --Checks--
        uint256 totalAmount = investorAmount + userAmount;
        if (totalAmount <= 0) {
            revert LoanWrapper__InvalidAmount();
        }
        
        // Check if we have enough collateral
        if (investorAmount > s_investorCollateral) {
            revert LoanWrapper__InvalidAmount();
        }
        if (userAmount > s_initCollateral) {
            revert LoanWrapper__InvalidAmount();
        }
        
        // Check Health Factor
        IPool pool = IPool(PROVIDER.getPool());
        
        // ---- Interactions (withdraw WETH from Aave pool to this wrapper) ----
        uint256 withdrawn = pool.withdraw(COL_TOKEN_ADDR, totalAmount, address(this));
        if (withdrawn != totalAmount) revert LoanWrapper__WithdrawFailed();

        // ---- Effects (update local accounting) ----
        if (investorAmount > 0) {
            s_investorCollateral = s_investorCollateral - investorAmount;
            if (s_investorCollateral == 0) {
                s_investor = address(0);
                unlockWrapper();
            }
        }
        if (userAmount > 0) {
            s_initCollateral = s_initCollateral - userAmount;
        }

        // ---- Interactions (unwrap and payout) ----
        IWETH9(COL_TOKEN_ADDR).withdraw(totalAmount);
        (bool success, ) = payable(msg.sender).call{value: totalAmount}("");
        if (!success) revert LoanWrapper__WithdrawFailed();

        emit CollateralDecreased(address(this), msg.sender, totalAmount);
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
        if (amount <= 0) {
            revert LoanWrapper__InvalidAmount();
        }
        
        int256 positiveAmount = int256(amount) * int256(1e12);
        IPool pool = IPool(PROVIDER.getPool());
        (uint256 col, uint256 debt, , uint256 lt, ,) = pool.getUserAccountData(address(this));
        if (computeHF(col, debt, lt, 0, positiveAmount) < LOCKING_THRESHOLD) {
            revert LoanWrapper__BreaksHealthFactor();
        }

        // --Effects--
        s_borrowedAmount += amount;

        // --Interactions--
        pool.borrow(DEBT_TOKEN_ADDR, amount, 2, 0, address(this));
        IERC20(DEBT_TOKEN_ADDR).transfer(owner(), amount);
        
        emit DebtIncreased(address(this), s_borrowedAmount);
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
        if (amount <= 0 || amount > s_borrowedAmount) {
            revert LoanWrapper__InvalidAmount();
        }

        // --Effects--
        // --Interactions--
        IERC20(DEBT_TOKEN_ADDR).approve(address(PROVIDER.getPool()), amount);
        IERC20(DEBT_TOKEN_ADDR).transferFrom(msg.sender, address(this), amount);
        IPool pool = IPool(PROVIDER.getPool());
        pool.repay(DEBT_TOKEN_ADDR, amount, 2, address(this));
        // Effect happens after an interaction in this specific scenario
        s_borrowedAmount -= amount;

        
        emit DebtDecreased(address(this), s_borrowedAmount);
    }

    /**
     * @notice This function can be called ONLY AND ONLY if there is sufficient balance
     * in the Vault to repay the loan
     */ 
    function repayLoan() external payable onlyOwnerOrVault {        
        // --Checks--
        if (msg.sender == owner() && locked){
            revert LoanWrapper__WrapperNotUnlocked();
        }
        if (s_borrowedAmount <= 0) {
            revert LoanWrapper__NothingToRepay();
        }

        // --Effects--
        // Approve pool to spend USDC tokens for repayment
        IERC20(DEBT_TOKEN_ADDR).approve(address(PROVIDER.getPool()), s_borrowedAmount);
        
        if (msg.sender == owner()) {
            IERC20(DEBT_TOKEN_ADDR).transferFrom(msg.sender, address(this), s_borrowedAmount);
        }
        
        IPool pool = IPool(PROVIDER.getPool());
        pool.repay(DEBT_TOKEN_ADDR, type(uint256).max, 2, address(this));
        
        s_borrowedAmount = 0;
        
        isActive = false;
        uint256 coll = s_initCollateral + s_investorCollateral;
        
        s_initCollateral = 0;
        s_investorCollateral = 0;
        
        // --Interactions--
        uint256 withdrawn = pool.withdraw(COL_TOKEN_ADDR, coll, address(this));
        
        IWETH9(COL_TOKEN_ADDR).withdraw(withdrawn);
        
        (bool success, ) = payable(msg.sender).call{value: withdrawn}("");
        if (!success) {
            revert LoanWrapper__WithdrawFailed();
        }
        
        emit LoanRepaid(address(this));
    }

    /**
     * @notice Calculates current Health Factor for this wrapper using pool data.
     *
     * @dev Uses the same formula as computeHF with zero pending deltas.
     */
    function calculatedHF() external view returns (uint256) {
        IPool pool = IPool(PROVIDER.getPool());
        (uint256 col, uint256 debt, , uint256 lt, ,) = pool.getUserAccountData(address(this));
        return computeHF(col, debt, lt, 0, 0);
    }

    function setActive(uint256 col, uint256 debt) external onlyRegistry {
        isActive = true;
        s_initCollateral = col;
        s_borrowedAmount = debt;
    }

    function getIsActive() external view returns (bool) {
        return isActive;
    }

    function isLocked() external view returns (bool) {
        return locked;
    }

    function getTotalCollateralValue() external view returns (uint256) {
        return s_initCollateral + s_investorCollateral;
    }
    
    function getTotalDebtValue() external view returns (uint256) {
        return s_borrowedAmount;
    }

    function getOwnerCollateralValue() external view returns (uint256) {
        return s_initCollateral;
    }

    function getInvestorCollateralValue() external view returns (uint256) {
        return s_investorCollateral;
    }

    receive() external payable {}

    // ------------------PRIVATE AND INTERNAL FUNCTIONS------------------
    function lockWrapper() private {
        // --Checks--
        // No checks
        // --Effects--
        locked = true;
        // --Interactions--
        emit WrapperLocked(address(this));
    }

    function unlockWrapper() private {
        // --Checks--
        // No checks
        // --Effects--
        locked = false;
        // --Interactions--
        emit WrapperUnlocked(address(this));
    }

    /**
     * @notice Computes potential HF of the current wrapper by collateralChange or debtChange
     * @param totalCollateralBase Amount of tokens that user provided as collateral
     * @param totalDebtBase Amount of debt tokens that user already borrowed
     * @param currentLiquidationThreshold Maximum percentage of collateral value that
     * can be borrowed before liquidation risk begins
     * @param collateralChange Amount of collateral token to add/subtract from the current base
     * @param debtChange Amount of debt token to add/subtract from the current base
     */
    function computeHF(
        uint256 totalCollateralBase,
        uint256 totalDebtBase,
        uint256 currentLiquidationThreshold,
        int256 collateralChange,
        int256 debtChange
    ) private pure returns (uint256) {
        int256 newCollateral = int256(totalCollateralBase) + collateralChange;
        int256 newDebt = int256(totalDebtBase) + debtChange;
        if (newDebt <= 0) {
            return type(uint256).max;
        }
        if (newCollateral <= 0) {
            return 0;
        }
        uint256 hf = uint256(newCollateral) * currentLiquidationThreshold / uint256(newDebt);
        return hf;
    }

    /**
     * @notice Test function -> not used in this project
     */
    /*function testComputeHF(
        uint256 totalCollateralBase,
        uint256 totalDebtBase,
        uint256 currentLiquidationThreshold,
        int256 collateralChange,
        int256 debtChange
    ) public pure returns (uint256) {
        return computeHF(totalCollateralBase, totalDebtBase, currentLiquidationThreshold, collateralChange, debtChange);
    }*/
}
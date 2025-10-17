// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.30;

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
}


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
contract LoanWrapper is Ownable {
    // ------------------ERRORS------------------
    error LoanWrapper__BreaksHealthFactor();
    error LoanWrapper__WrapperNotUnlocked();
    error LoanWrapper__AccessDenied();
    error LoanWrapper__InsufficientAllowance();
    error LoanWrapper__InvalidAmount();
    error LoanWrapper__NothingToRepay();

    // ------------------CONSTANTS------------------
    address private VAULT;
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

    event LoanRepaid(address indexed loanAddress);

    // ------------------CONSTRUCTOR------------------
    /**
     * @notice Constructs the wrapper as an ERC721 collection. The owner is the userthat took the loan
     */
    // I'm not sure this will work. Maybe there should be transferOwnership in constructor
    // and initial owner should be msg.sender -> Registry
    constructor(address owner, uint256 collateral, uint256 amount, address vault,
    address colTokenAddr, address debtTokenAddr, address provider)
    Ownable(owner) {
            s_initCollateral = collateral;
            s_borrowedAmount = amount;
            VAULT = vault;
            COL_TOKEN_ADDR = colTokenAddr;
            DEBT_TOKEN_ADDR = debtTokenAddr;
            PROVIDER = IPoolAddressesProvider(provider);

            IPool pool = IPool(PROVIDER.getPool());
            DataTypes.ReserveData memory r = pool.getReserveData(DEBT_TOKEN_ADDR);
            IDelegationToken(r.variableDebtTokenAddress).approveDelegation(
            msg.sender,
            amount
        );
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
    function increaseCollateral(uint256 amount) external payable {
        // --Checks--
        if (msg.sender == owner() && locked) {
            revert LoanWrapper__WrapperNotUnlocked();
        }
        if (s_investor != address(0) || (msg.sender != owner() && !locked)) {
            revert LoanWrapper__AccessDenied();
        }
        if (amount < 0) {
            revert LoanWrapper__InvalidAmount();
        }
        if (msg.value < amount) {
            revert LoanWrapper__InsufficientAllowance();
        }
        // --Effects--
        IWETH9(COL_TOKEN_ADDR).deposit{value: msg.value}();
        s_investor = msg.sender;
        s_investorCollateral = amount;
        lockWrapper();
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
    function decreaseCollateral(uint256 amount) external payable onlyOwnerOrInvestor {
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
        int256 negativeCol = -int256(amount);
        IPool pool = IPool(PROVIDER.getPool());
        (uint256 col, uint256 debt, , uint256 lt, ,) = pool.getUserAccountData(address(this));
        if (computeHF(col, debt, lt, negativeCol, 0) < UNLOCKING_THRESHOLD) {
            revert LoanWrapper__BreaksHealthFactor();
        }
        // --Effects--
        IWETH9(COL_TOKEN_ADDR).withdraw(amount);
        s_investorCollateral -= amount;
        s_investor = address(0);
        unlockWrapper();
        // Return tokens back to the owner?
        // --Interactions--
        emit CollateralDecreased(address(this), msg.sender, amount);
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
        int256 positiveAmount = int256(amount);
        IPool pool = IPool(PROVIDER.getPool());
        (uint256 col, uint256 debt, , uint256 lt, ,) = pool.getUserAccountData(address(this));
        if (computeHF(col, debt, lt, 0, positiveAmount) < LOCKING_THRESHOLD) {
            revert LoanWrapper__BreaksHealthFactor();
        }
        // --Effects--
        
        pool.borrow(DEBT_TOKEN_ADDR, amount * 1e18, 2, 0, address(this));
        IERC20(DEBT_TOKEN_ADDR).transfer(owner(), amount * 1e18);
        s_borrowedAmount += amount;
        // --Interactions--
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
        // Conversions?
        if (amount < 0 || amount > s_borrowedAmount) {
            revert LoanWrapper__InvalidAmount();
        }

        // --Effects--
        IERC20(DEBT_TOKEN_ADDR).transferFrom(msg.sender, address(this), amount * 1e18);
        IPool pool = IPool(PROVIDER.getPool());
        pool.repay(DEBT_TOKEN_ADDR, amount * 1e18, 2, address(this));
        s_borrowedAmount -= amount;
        // --Interactions--
        emit DebtDecreased(address(this), s_borrowedAmount);
    }

    function repayLoan() external {
        // --Checks--
        if (s_borrowedAmount < 0) {
            revert LoanWrapper__NothingToRepay();
        }
        if (msg.sender != VAULT) {
            revert LoanWrapper__AccessDenied();
        }
        // --Effects--
        IERC20(DEBT_TOKEN_ADDR).transferFrom(msg.sender, address(this), s_borrowedAmount * 1e18);
        IPool pool = IPool(PROVIDER.getPool());
        pool.repay(DEBT_TOKEN_ADDR, s_borrowedAmount * 1e18, 2, address(this));
        // --Interactions--
        emit LoanRepaid(address(this));
    }

    /// @notice Getter for state variable {locked}
    function isLocked() external view returns (bool) {
        return locked;
    }

    function getTotalCollateralValue() external view returns (uint256) {
        return s_initCollateral + s_investorCollateral;
    }
    
    function getTotalDebtValue() external view returns (uint256) {
        return s_borrowedAmount;
    }

    // ------------------PRIVATE AND INTERNAL FUNCTIONS------------------
    // Can be merged into one function... What is better approach?
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

    
    function computeHF(
        uint256 totalCollateralBase,
        uint256 totalDebtBase,
        uint256 currentLiquidationThreshold,
        int256 collateralChange,
        int256 debtChange
    ) private pure returns (uint256) {
        int256 newCollateral = int256(totalCollateralBase) + collateralChange * 1e18;
        int256 newDebt = int256(totalDebtBase) + debtChange * 1e18;
        if (newDebt <= 0) {
            return type(uint256).max;
        }
        if (newCollateral <= 0) {
            return 0;
        }
        uint256 hf = uint256(newCollateral) * currentLiquidationThreshold / (uint256(newDebt) * 1e4);
        return hf;
    }
}
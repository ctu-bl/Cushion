// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;


/**
 * @title LoanWrapperRegistry
 * @author CtuBlockhain Lab
 * @notice Factory & registry for per-borrower LoanWrapper contracts (each acts as its own Aave user).
 * @dev Uses PoolAddressesProvider to resolve Aave Pool. Enforces 1:1 borrowerEOA → LoanWrapper.
 *
 * Responsibilities:
 * - Deploy a LoanWrapper for a borrower and emit WrapperCreated.
 * - Keep borrowerEOA → wrapper mapping + index of all wrappers.
 * - Provide light view helpers (e.g., read HF via Aave) and hold no funds.
 */

contract LoanWrapperRegistry {
    error LoanWrapperRegistry__Undercollateralized();
    IPoolAddressesProvider public immutable provider; // <AAVE_ADDRESSES_PROVIDER_SEPOLIA>
    address public immutable vault;

    // 
    mapping(address => address) public wrapperOf;     // borrowerEOA => LoanWrapper
    address[] public allWrappers;

    /// @notice Emitted when the loan is wrapped
    event LoanWrapped(address indexed owner, address indexed loanAddress, uint256 strike, address collateralToken);

    /// @notice Emitted when the loan is repaid
    event LoanRepaid(address indexed owner, address indexed loanAddress, uint256 strike, address collateralToken, address indexed performedBy);

    constructor(address _provider, address _vault) {
        provider = IPoolAddressesProvider(_provider);
        vault = _vault; // může být address(0), pokud nechceš řešit locky hned
    }

    
    /**
     * @notice Wrap an existing loan into a transferable ERC721
     * @param strike Strike or principal amount associated with the loan.
     * @param collateralToken Address of the collateral asset for the loan.
     *
     * @dev Mints an ERC721 representing the wrapped loan. Emits {Wrapped}.
     */
    function wrapLoan(uint256 strike, address collateralToken) public {
        (uint256 totalCollateralBase,
        uint256 totalDebtBase,
        uint256 availableBorrowsBase,
        uint256 currentLiquidationThreshold,
        uint256 ltv,
        uint256 healthFactor) = IPool(provider.getPool()).getUserAccountData(msg.sender);

        if(healthFactor < 1e18) {
            revert LoanWrapperRegistry__Undercollateralized();
        }

        
        // Token approval ???? - should be already done by the user before calling this function


        // Start flashloan from Aave
        // IPool.flashLoanSimple(this, debtAsset, repayAmt, params, 0)


        // Approve Pool to repay the borrower's loan
        // IERC20(debtAsset).approve(IPool, amount)

        // Repay borrower's loan
        // IPool.repay(debtAsset, amount, rateMode, borrowerEOA)

        // Tranfer collateral from borrower to wrapper
        // IERC721(collateralToken).transferFrom(borrowerEOA, wrapper, amountOfTokens)

        // Borrow collateral + fee to Aave Pool
        // IPool.borrow(debtAsset, amount + fee, rateMode, 0, Wrapper)

        // Approve Pool to pull the flashloan + fee -> IPool will through the callback function pay off the flashloan
        // IERC20(debtAsset).approve(IPool, amount + fee)

        // Mint ERC721 to borrowerEOA
        // _mint(borrowerEOA, newTokenId);





    }

    
    /**
     * @notice List all reserves in the Pool and the user's balances (aToken, stable debt, variable debt) for each
     * @param user Address of the user whose reserves are requested.
     * @return assets List of reserve asset addresses
     * @return aBal List of the user's aToken balances for each reserve
     * @return sdBal List of the user's stable debt balances for each reserve
     * @return vdBal List of the user's variable debt balances for each reserve
     */
    function listUserReserves(address user) external view returns (address[] memory assets, uint256[] memory aBal, uint256[] memory sdBal, uint256[] memory vdBal) {
        address[] memory reserves = IPool(<POOL>).getReservesList();
        assets = new address[](reserves.length);
        aBal   = new uint256[](reserves.length);
        sdBal  = new uint256[](reserves.length);
        vdBal  = new uint256[](reserves.length);

        for (uint i = 0; i < reserves.length; i++) {
            assets[i] = reserves[i];
            (address aToken, address sDebt, address vDebt) =
                IDataProvider(<DATA_PROVIDER>).getReserveTokensAddresses(assets[i]);

            aBal[i]  = aToken == address(0) ? 0 : IERC20(aToken).balanceOf(user);      // supply (kolaterál)
            sdBal[i] = sDebt  == address(0) ? 0 : IERC20(sDebt).balanceOf(user);       // stable debt
            vdBal[i] = vDebt  == address(0) ? 0 : IERC20(vDebt).balanceOf(user);       // variable debt
        }
    }

    // Možná bude lepší vzít bitmapu uživatele a filtrovat z ní použíté tokeny - pořeším zítra










    /**
     * @notice Repay a loan and burn its corresponding ERC721.
     * @param expiryTime Expiry timestamp of the loan being repaid.
     * @param strike Strike or principal amount of the loan.
     * @param collateralToken Address of the collateral token.
     * @notice Redeemed collateral receives whoever calls this function
     *
     * @dev Burns the ERC721 and updates state to reflect loan repayment. Emits {LoanRepaid}
     * @dev Owner can execute this function only when the HF isn't below the threshold
     */
    function repayLoan(uint64 expiryTime, uint256 strike, address collateralToken) public {
        // --Checks--
        // --Effects--
        // --Interactions--
    }

    /**
     * @notice Returns array of all LoanWrapper addresses created by this registry
     * @param borrowerEOA Address of the borrower whose wrapper is requested.
     */
    function getAllWrappers() external view returns (address[] memory) { return allWrappers; }

    /**
     * @notice Returns current Health Factor (HF) of a borrower's LoanWrapper in Aave
     * @param borrowerEOA Address of the borrower whose HF is requested.
     */
    function getHF(address borrowerEOA) external view returns (uint256 hf) {
        address w = wrapperOf[borrowerEOA];
        require(w!=address(0), "no wrapper");
        (,,,,,hf) = IPool(provider.getPool()).getUserAccountData(w);
    }
}
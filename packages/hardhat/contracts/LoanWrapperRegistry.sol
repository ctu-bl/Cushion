// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import {IPool} from "@aave/core-v3/contracts/interfaces/IPool.sol";
import {DataTypes} from "@aave/core-v3/contracts/protocol/libraries/types/DataTypes.sol";
import {IPoolAddressesProvider} from "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";


interface IERC20Permit {
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v, bytes32 r, bytes32 s
    ) external;
}

interface IERC20 {
    function balanceOf(address) external view returns (uint256);
    function allowance(address,address) external view returns (uint256);
    function approve(address,uint256) external returns (bool);
    function transferFrom(address,address,uint256) external returns (bool);
}

interface IDataProvider {
    function getReserveTokensAddresses(address asset)
        external view
        returns (address aToken, address stableDebt, address variableDebt);
}

// Aave V3 multi-asset flash loan receiver
interface IFlashLoanReceiver {
    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    ) external returns (bool);
}

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
    error LoanWrapperRegistry__TokensNotAllowed();

    IPoolAddressesProvider public immutable provider; // <AAVE_ADDRESSES_PROVIDER_SEPOLIA>
    address public immutable vault;
    IDataProvider public immutable dataProvider;


    // 
    mapping(address => address) public wrapperOf;     // borrowerEOA => LoanWrapper
    address[] public allWrappers;

    /// @notice Emitted when the loan is wrapped
    event LoanWrapped(address indexed owner, address indexed loanAddress, uint256 strike, address collateralToken);

    /// @notice Emitted when the loan is repaid
    event LoanRepaid(address indexed owner, address indexed loanAddress, uint256 strike, address collateralToken, address indexed performedBy);

    /// @notice Emitted when a borrower whitelists their aTokens for this registry via permit
    event ATokensAllowed(address indexed owner, address indexed aToken, uint256 value, address indexed spender);

    constructor(address _provider, address _vault, address _dataProvider) {
        provider = IPoolAddressesProvider(_provider);
        vault = _vault; // může být address(0), pokud nechceš řešit locky hned
        dataProvider = IDataProvider(_dataProvider);
    }


    // AI did this
    /**
     * @notice Borrower whitelistne pomocí EIP-2612 permitu své aTokény pro tento registr.
     * @dev Spender = address(this). V wrapLoan() pak můžeš dělat aToken.transferFrom(owner → wrapper).
     *      Pokud daný aToken NEpodporuje permit, musí uživatel udělat klasické approve na aTokenu ručně.
     */
    function allowTokens(
        address[] calldata aTokens,      // aToken adresy (např. aWETH, aWBTC, …)
        uint256[] calldata values,       // allowance hodnota (např. type(uint256).max)
        uint256[] calldata deadlines,    // permit deadline
        uint8[] calldata v, bytes32[] calldata r, bytes32[] calldata s // EIP-2612 podpisy
    ) external {
        uint256 n = aTokens.length;
        require(n == values.length && n == deadlines.length && n == v.length && n == r.length && n == s.length);

        for (uint256 i = 0; i < n; i++) {
            IERC20Permit(aTokens[i]).permit(
                msg.sender,       // owner = borrower
                address(this),    // spender = tahle registry (wrapLoan pak volá transferFrom)
                values[i],
                deadlines[i],
                v[i], r[i], s[i]
            );
            emit ATokensAllowed(msg.sender, aTokens[i], values[i], address(this));
        }
    }

    function checkAllowances(address owner, address wrapper, address[] calldata aTokens) external view returns (bool){
        for (uint i; i < aTokens.length; i++) {
            if (IERC20(aTokens[i]).allowance(owner, wrapper) < IERC20(aTokens[i]).balanceOf(owner)) {
                return false;
            }
        }
        return true;
    }

    


    /**
     * @notice Wrap an existing loan into a transferable ERC721
     * @param strike Strike or principal amount associated with the loan.
     * @param collateralToken Address of the collateral asset for the loan.
     *
     * @dev Mints an ERC721 representing the wrapped loan. Emits {Wrapped}.
     */
    function wrapLoan(uint256 strike, address collateralToken) public {
        IPool pool = IPool(provider.getPool());
        (uint256 totalCollateralBase,
        uint256 totalDebtBase,
        uint256 availableBorrowsBase,
        uint256 currentLiquidationThreshold,
        uint256 ltv,
        uint256 healthFactor) = pool.getUserAccountData(msg.sender);


        // OTHER CHECKS - TODO Later
        
        if(healthFactor < 1e18) {
            revert LoanWrapperRegistry__Undercollateralized();
        }

        address pool = provider.getPool();
        
        // Deploy new LoanWrapper for borrowerEOA if not already existing - TODO
        address wrapper = wrapperOf[msg.sender];


        // Token approval ???? - should be already done by the user before calling this function


        // Get all collateral and borrowing assets of the user
        (address[] memory collateralAssets, address[] memory borrowingAssets) = listUserCollateralAndBorrowing(msg.sender);

        // Token approval ???? - should be already done by the user before calling this function
        if(!checkAllowances(msg.sender, wrapper, collateralAssets)) {
            revert LoanWrapperRegistry__TokensNotAllowed();
        }

        // Build arrays of debts to be repaid -> for the flashloan input
        (address[] memory assets, uint256[] memory amounts, uint256[] memory sDebts, uint256[] memory vDebts) = _buildDebts(msg.sender, borrowingAssets);

        // Start flashloan from Aave
        // IPool.flashLoanSimple(this, debtAsset, repayAmt, params, 0) -> Wont work for multi-asset


        // 0 = clear flash (return in callback)
        uint256[] memory modes = new uint256[](assets.length);
        // předáme do callbacku borrowera a rozpad dluhů
        bytes memory params = abi.encode(msg.sender, sDebts, vDebts);

        // SPUŠTĚNÍ multi-asset flashloanu
        pool.flashLoan(
            address(this),   // receiver
            assets,
            amounts,
            modes,           // samé nuly
            address(this),   // onBehalfOf (neřešíme zde, je to čistý flash)
            params,
            0                // referralCode
        );
    

        // TODO:


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
     * @notice This function is called right after your contract has received the flash loaned amount
     * @param assets The addresses of the assets being flash-borrowed
     * @param amounts The amounts for each asset being flash-borrowed
     * @param premiums The fees to be paid for each asset
     * @param initiator The address that initiated the flash loan, should be this contract
     * @param params Arbitrary data structure, intended to contain user-defined parameters
     * @return True if the operation succeeded, false otherwise
     */
    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    ) external returns (bool) {
        // bezpečnostní kontroly
        require(msg.sender == provider.getPool(), "caller not pool");
        require(initiator == address(this), "bad initiator");

        (address borrowerEOA, uint256[] memory sDebts, uint256[] memory vDebts) =
            abi.decode(params, (address, uint256[], uint256[]));

        IPool pool = IPool(provider.getPool());

        // 1) pro každý asset schválíme Poolu spend a splatíme dluh ZA borrowera
        for (uint256 i = 0; i < assets.length; i++) {
            uint256 amt = amounts[i];
            if (amt == 0) continue;

            // flash prostředky -> approve Poolu
            IERC20(assets[i]).approve(address(pool), amt);

            // repay STABLE část (pokud existuje)
            if (sDebts[i] > 0) {
                pool.repay(assets[i], sDebts[i], 1, borrowerEOA); // 1 = STABLE
            }
            // repay VARIABLE část (pokud existuje)
            if (vDebts[i] > 0) {
                pool.repay(assets[i], vDebts[i], 2, borrowerEOA); // 2 = VARIABLE
            }
        }

        // 2) otevřeme stejný dluh na SOBĚ (tady na registru) a vrátíme flash + premium
        //    (později to přesměrujeme na konkrétní LoanWrapper)
        for (uint256 i = 0; i < assets.length; i++) {
            uint256 need = amounts[i] + premiums[i];
            if (need == 0) continue;

            pool.borrow(assets[i], need, 2, 0, address(this));   // 2 = VARIABLE
            IERC20(assets[i]).approve(address(pool), need);       // Pool si stáhne need
        }

        return true;
    }

    /**
     * @notice List all assets a user is using as collateral and all assets they are borrowing
     * @param user Address of the user whose collateral and borrowing assets are requested.
     * @return collateralAssets List of reserve asset addresses used as collateral by the user
     * @return borrowingAssets List of reserve asset addresses borrowed by the user
     */
    function listUserCollateralAndBorrowing(address user)
        internal
        view
        returns (address[] memory collateralAssets, address[] memory borrowingAssets)
    {
        IPool pool = IPool(provider.getPool());
        address[] memory reserves = pool.getReservesList();
        DataTypes.UserConfigurationMap memory cfg = pool.getUserConfiguration(user);
        uint256 data = cfg.data;

        uint256 c; uint256 b;
        for (uint256 i; i < reserves.length; i++) {
            if (_isCollateral(data,i)) c++;
            if (_isBorrowing(data,i)) b++;
        }

        collateralAssets = new address[](c);
        borrowingAssets  = new address[](b);

        uint256 ci; uint256 bi;
        for (uint256 i; i < reserves.length; i++) {
            if (_isCollateral(data,i)) collateralAssets[ci++] = reserves[i];
            if (_isBorrowing(data,i))  borrowingAssets[bi++]  = reserves[i];
        }
    }
    
    function _isCollateral(uint256 packed, uint256 i) private pure returns (bool) {
        return ((packed >> (i*2)) & 1) != 0;
    }
    function _isBorrowing(uint256 packed, uint256 i) private pure returns (bool) {
        return ((packed >> (i*2+1)) & 1) != 0;
    }



    // AI did this
    function _buildDebts(address borrower, address[] memory borrowingAssets) internal view returns (
        address[] memory assets,
        uint256[] memory amounts,
        uint256[] memory stableDebts,
        uint256[] memory variableDebts
    ){
        // spočti jen ty, kde je skutečný dluh
        uint256 n;
        for (uint256 i; i < borrowingAssets.length; i++) {
            (, address sDebt, address vDebt) = dataProvider.getReserveTokensAddresses(borrowingAssets[i]);
            uint256 sd = sDebt == address(0) ? 0 : IERC20(sDebt).balanceOf(borrower);
            uint256 vd = vDebt == address(0) ? 0 : IERC20(vDebt).balanceOf(borrower);
            if (sd + vd > 0) n++;
        }

        assets = new address[](n);
        amounts = new uint256[](n);
        stableDebts = new uint256[](n);
        variableDebts= new uint256[](n);

        uint256 j;
        for (uint256 i; i < borrowingAssets.length; i++) {
            (, address sDebt, address vDebt) = dataProvider.getReserveTokensAddresses(borrowingAssets[i]);
            uint256 sd = sDebt == address(0) ? 0 : IERC20(sDebt).balanceOf(borrower);
            uint256 vd = vDebt == address(0) ? 0 : IERC20(vDebt).balanceOf(borrower);
            if (sd + vd == 0) continue;

            assets[j] = borrowingAssets[i];
            stableDebts[j] = sd;
            variableDebts[j] = vd;
            amounts[j] = sd + vd;          // kolik flashnout pro tento asset
            j++;
        }
    }










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
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import {IPool} from "@aave/core-v3/contracts/interfaces/IPool.sol";
import {DataTypes} from "@aave/core-v3/contracts/protocol/libraries/types/DataTypes.sol";
import {IPoolAddressesProvider} from "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";


interface IWETH9 {
    function deposit() external payable;    // ETH -> WETH
    function withdraw(uint256) external;    // WETH -> ETH
}


interface IERC20 {
    function balanceOf(address) external view returns (uint256);
    function allowance(address,address) external view returns (uint256);
    function approve(address,uint256) external returns (bool);
    function transferFrom(address,address,uint256) external returns (bool);
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
    error LoanWrapperRegistry__InvalidWrapper();
    error LoanWrapperRegistry__AssetsNotSet();
    error LoanWrapperRegistry__NoETHSent();
    error LoanWrapperRegistry__TransferFailed();

    IPoolAddressesProvider public immutable provider; // <AAVE_ADDRESSES_PROVIDER_SEPOLIA>
    address public immutable vault;

    address public immutable WETH;         // underlying WETH
    address public immutable USDC;         // underlying USDC


    mapping(address => address) public wrapperOf;     // borrowerEOA => LoanWrapper
    address[] public allWrappers;

    /// @notice Emitted when the loan is wrapped
    event LoanWrapped(address indexed owner, address indexed loanAddress, uint256 strike, address collateralToken);

    /// @notice Emitted when the loan is repaid
    event LoanRepaid(address indexed owner, address indexed loanAddress, uint256 strike, address collateralToken, address indexed performedBy);


    constructor(address _provider, address _vault, address _weth, address _usdc) {
        provider = IPoolAddressesProvider(_provider);
        vault = _vault; // může být address(0), pokud nechceš řešit locky hned
        WETH = _weth;
        USDC = _usdc;
    }

    

    /**
     * @notice Wrap an existing loan into a transferable ERC721
     * @param collateralToken Address of the collateral asset for the loan.
     *
     * @dev Mints an ERC721 representing the wrapped loan. Emits {Wrapped}.
     */
    function wrapLoan(uint256 strike, address collateralToken) external payable {
        require(WETH!=address(0) && USDC!=address(0), LoanWrapperRegistry__AssetsNotSet());
        require(msg.value > 0, LoanWrapperRegistry__NoETHSent());

        IPool pool = IPool(provider.getPool());

        // 1) ETH -> WETH
        IWETH9(WETH).deposit{value: msg.value}();

        // 2) deposit WETH -> aWETH (kolaterál drží tento kontrakt)
        IERC20(WETH).approve(address(pool), msg.value);
        pool.deposit(WETH, msg.value, address(this), 0);

        // 3) borrow USDC (rateMode=2 = VARIABLE) a pošli uživateli
        pool.borrow(USDC, borrowUSDC, 2, 0, address(this));
        require(IERC20(USDC).transfer(receiver, borrowUSDC), LoanWrapperRegistry__TransferFailed());

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
    function getHF(address wrapper) external view returns (uint256 hf) {
        require(wrapper != address(0), LoanWrapperRegistry__InvalidWrapper());
        (,,,,,hf) = IPool(provider.getPool()).getUserAccountData(wrapper);
    }

    function checkHF(address wrapper) external view returns (bool isHealthy) {
        require(wrapper != address(0), LoanWrapperRegistry__InvalidWrapper());
        (,,,,,uint256 hf) = IPool(provider.getPool()).getUserAccountData(wrapper);
        return hf > 1e18; // 1.0
    }

    /**
     * // TODO - Wrapper locked/injected in LoanWrapper.sol 
     * @notice Returns array of all LoanWrapper addresses created by this registry + isInjected=false
     */
    function getAllWrappers() external view returns (address[] memory allWrappers, bool isInjected) { return (allWrappers, false); }
}
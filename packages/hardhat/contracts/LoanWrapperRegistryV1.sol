// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import {IPool} from "@aave/core-v3/contracts/interfaces/IPool.sol";
import {DataTypes} from "@aave/core-v3/contracts/protocol/libraries/types/DataTypes.sol";
import {IPoolAddressesProvider} from "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import {LoanWrapper} from "./LoanWrapper.sol";


interface IWETH9 {
    function deposit() external payable;    // ETH -> WETH
    function withdraw(uint256) external;    // WETH -> ETH
}


interface IERC20 {
    function balanceOf(address) external view returns (uint256);
    function allowance(address,address) external view returns (uint256);
    function approve(address,uint256) external returns (bool);
    function transferFrom(address,address,uint256) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
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
    // ------------------ERRORS------------------
    error LoanWrapperRegistry__Undercollateralized();
    error LoanWrapperRegistry__TokensNotAllowed();
    error LoanWrapperRegistry__InvalidWrapper();
    error LoanWrapperRegistry__AssetsNotSet();
    error LoanWrapperRegistry__NoETHSent();
    error LoanWrapperRegistry__TransferFailed();

    // ------------------CONSTANTS------------------
    IPoolAddressesProvider public immutable provider; // <AAVE_ADDRESSES_PROVIDER_SEPOLIA>
    address public immutable vault;
    address public immutable WETH;         // underlying WETH
    address public immutable USDC;         // underlying USDC

    // ------------------STATE VARIABLES------------------
    mapping(address => address) public wrapperOf;     // borrowerEOA => LoanWrapper
    address[] public allWrappers;

    // ------------------EVENTS------------------
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
     * @param borrower Address of the borrower taking the loan (EOA)
     * @param borrowedAmount Amount of USDC the borrower wants to borrow
     * @dev Deploys a LoanWrapper, deposits ETH collateral, borrows USDC from Aave
    */
    function wrapLoan(address borrower, uint256 borrowedAmount) external payable {
        require(WETH!=address(0) && USDC!=address(0), LoanWrapperRegistry__AssetsNotSet());
        require(msg.value > 0, LoanWrapperRegistry__NoETHSent());


        address wrapper = wrapperOf[borrower];
        if (wrapper == address(0)) {
            LoanWrapper wrapper = new LoanWrapper(borrower, msg.value, borrowedAmount, vault, WETH, USDC, provider);
            wrapperOf[borrower] = address(wrapper);
            allWrappers.push(address(wrapper));
        } else{
            LoanWrapper(wrapper).setActive();
        }
        emit LoanWrapped(borrower, wrapper, borrowedAmount, WETH);

        IPool pool = IPool(provider.getPool());

        // 2) ETH -> WETH (WETH se připíše registru, protože on posílá ETH)
        IWETH9(WETH).deposit{value: msg.value}();

        // 3) deposit WETH do Aave NA ÚČET WRAPPERU (onBehalfOf = wrapper)
        IERC20(WETH).approve(address(pool), msg.value);
        pool.deposit(WETH, msg.value, address(wrapper), 0);

        // 4) borrow USDC NA ÚČET WRAPPERU (onBehalfOf = wrapper)
        //    Pozor: underlying USDC se po borrowu pošle volajícímu (registru),
        //    proto ho hned přepošleme borrowerovi.
        pool.borrow(USDC, borrowedAmount, 2, 0, address(wrapper)); // 2 = VARIABLE

        require(IERC20(USDC).transfer(borrower, borrowedAmount), LoanWrapperRegistry__TransferFailed());
    }



    function getAllWrappers() external view returns (address[] memory) { return allWrappers; }

    function getHF(address wrapper) external view returns (uint256 hf) {
        require(wrapper != address(0), LoanWrapperRegistry__InvalidWrapper());
        (,,,,,hf) = IPool(provider.getPool()).getUserAccountData(wrapper);
    }

    function checkHF(address wrapper) external view returns (bool isHealthy) {
        require(wrapper != address(0), LoanWrapperRegistry__InvalidWrapper());
        (,,,uint256 currentLiquidationThreshold,,uint256 hf) = IPool(provider.getPool()).getUserAccountData(wrapper);
        return hf > currentLiquidationThreshold; // Check if HF is above the liquidation threshold
    }

}
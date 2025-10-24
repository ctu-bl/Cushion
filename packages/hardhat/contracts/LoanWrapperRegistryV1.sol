// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

import {IPool} from "@aave/core-v3/contracts/interfaces/IPool.sol";
import {DataTypes} from "@aave/core-v3/contracts/protocol/libraries/types/DataTypes.sol";
import {IPoolAddressesProvider} from "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import {LoanWrapper} from "./LoanWrapper.sol";
import {console} from "hardhat/console.sol";

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

interface IVault {
    function transferFee() external;
}

interface ILoanWrapper {
    function getIsActive() external view returns (bool);
}

/**
 * @title LoanWrapperRegistry
 * @author CTU Blockchain Lab
 * @notice Factory & registry for per-borrower LoanWrapper contracts 
 * (each acts as its own lending/borrowing protocol user).
 *
 * Responsibilities:
 * - Deploy a LoanWrapper for a borrower and emit WrapperCreated.
 * - Keep borrowerEOA → wrapper mapping + index of all wrappers.
 * - Provide light view helpers (e.g., read HF via lending/borrowing protocol) and hold no funds.
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
    IPoolAddressesProvider public immutable provider;
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
        vault = _vault;
        WETH = _weth;
        USDC = _usdc;
    }

    
    // --------------------EXTERNAL FUNCTIONS----------------------
    /**
     * @notice Wrap an existing loan into a custom wrapper
     * @param borrower Address of the borrower taking the loan (EOA)
     * @param borrowedAmount Amount of USDC the borrower wants to borrow
     * @dev Deploys a LoanWrapper, deposits ETH collateral, borrows USDC from lending/borrowing protocol
     */
    function wrapLoan(address borrower, uint256 borrowedAmount) external payable {
        require(WETH!=address(0) && USDC!=address(0), LoanWrapperRegistry__AssetsNotSet());
        require(msg.value > 0, LoanWrapperRegistry__NoETHSent());
        uint256 fee = msg.value * 3 / 100;
        address wrapper = wrapperOf[borrower];
        if (wrapper == address(0)) {
            LoanWrapper newWrapper = new LoanWrapper(borrower, msg.value - fee, borrowedAmount, vault, WETH, USDC, address(provider));
            wrapper = address(newWrapper);
            wrapperOf[borrower] = wrapper;
            allWrappers.push(wrapper);
        } else{
            LoanWrapper(payable(wrapper)).setActive(msg.value - fee, borrowedAmount);
        }
        emit LoanWrapped(borrower, wrapper, borrowedAmount, WETH);
        
        IPool pool = IPool(provider.getPool());

        // ETH -> WETH
        
        (bool success, ) = payable(vault).call{value: fee}("");
        if (!success) {
            revert LoanWrapperRegistry__TransferFailed();
        }
        IVault(vault).transferFee();
        IWETH9(WETH).deposit{value: msg.value - fee}();

        IERC20(WETH).approve(address(pool), msg.value - fee);
        pool.deposit(WETH, msg.value - fee, wrapper, 0);

        // borrow USDC on behalf of wrapper (onBehalfOf = wrapper)
        pool.borrow(USDC, borrowedAmount, 2, 0, wrapper); // 2 = VARIABLE

        require(IERC20(USDC).transfer(borrower, borrowedAmount), LoanWrapperRegistry__TransferFailed());
    }

    /**
     * @notice Returns all active wrappers
     *
     * @dev for loop is not ideal but for POC it's not a big deal
     */
    function getAllWrappers() external view returns (address[] memory) {
    uint256 activeCount = 0;
    for (uint256 i = 0; i < allWrappers.length; i++) {
        if (ILoanWrapper(allWrappers[i]).getIsActive()) {
            activeCount++;
        }
    }
    address[] memory allActiveWrappers = new address[](activeCount);
    uint256 index = 0;
    
    for (uint256 i = 0; i < allWrappers.length; i++) {
        if (ILoanWrapper(allWrappers[i]).getIsActive()) {
            allActiveWrappers[index] = allWrappers[i];
            index++;
        }
    }

    return allActiveWrappers;
}

    /**
     * @notice Returns HF of the certain loan
     * @param wrapper Address of the wrapper associated with the loan
     * @return hf HF of the loan
     */
    function getHF(address wrapper) external view returns (uint256 hf) {
        require(wrapper != address(0), LoanWrapperRegistry__InvalidWrapper());
        hf = LoanWrapper(payable(wrapper)).calculatedHF();
    }

    /**
     * @notice Checks if current HF of the loan is above the liquidation threshold
     * @param wrapper Address of the wrapper associated with the loan
     * @return isHealthy True if HF is above threshold, false otherwise
     */
    function checkHF(address wrapper) external view returns (bool isHealthy) {
        require(wrapper != address(0), LoanWrapperRegistry__InvalidWrapper());
        (,,,uint256 currentLiquidationThreshold,,uint256 hf) = IPool(provider.getPool()).getUserAccountData(wrapper);
        return hf > currentLiquidationThreshold; // Check if HF is above the liquidation threshold
    }
}
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
// import {console} from "hardhat/console.sol";
import {MockUniswapRouter} from "./mocks/MockUniswapRouter.sol";


// Loan wrapper
interface ILoanWrapper {
    function getTotalCollateralValue() external view returns (uint256);
    function getTotalDebtValue() external view returns (uint256);
    function increaseCollateral(uint256 amount) external payable;
    function decreaseCollateral(uint256 amount) external payable;
    function decreaseCollateralForVault(uint256 investorAmount, uint256 userAmount) external;
    function getOwnerCollateralValue() external view returns (uint256);
    function getInvestorCollateralValue() external view returns (uint256);
    function repayLoan() external;
} 

// Uniswap router for token swaping
interface ISwapRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }
    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut);
}

// WETH
interface IWETH is IERC20 {
    function deposit() external payable;
    function withdraw(uint256 wad) external;
}

// Chainlink Price Feed
interface IChainlinkAggregator {
    function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
}

/**
 * @title Vault
 * @author CTU Blockchain Lab
 * @notice PYUSD powered ERC4626 Vault with provisions for liquidity providers
 * @notice Vault also communicates with the keeper and executes its commands 
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
    error Vault__SwapFailed();
    error Vault__SwapAdapterNotSet();
    error Vault__PrincipalTooLow();

    // ------------------CONSTANTS------------------
    address public immutable PYUSD_TOKEN; // asset()
    address public immutable WETH_TOKEN;
    address public immutable DEBT_TOKEN_ADDR; // USDC address
    ISwapRouter public immutable SWAP_ROUTER;
    IChainlinkAggregator public immutable ETH_USD_FEED;
    IChainlinkAggregator public immutable PYUSD_USD_FEED;

    /// @notice annual interest rate for injected capital (1e18 precision)
    uint256 public interestRate = 5 * 1e16; // 5%
    uint256 public SECONDS_PER_YEAR = 31_556_926;

    // ---------------------STRUCTS----------------------
    struct InjectedCapital {
        uint256 amountPyUsd;
        uint256 amountEthSent;
        uint256 initialAccumulatedInterest;
    }

    /// loanAddr => injected capital
    mapping(address => InjectedCapital) public injectedAssets;

    /// Global interest
    uint256 public accumulatedInterest;
    uint256 public lastInterestUpdate;

    // ---------------------USER ACCOUNTING----------------------
    /// @notice User principal in PYUSD,associated with certain user
    mapping(address => uint256) public userPrincipal;

    /// @notice Sum of all user principal
    uint256 public totalPrincipal;

    // --------------------EVENTS----------------------
    /// @notice Emitted when vault injects to any loan
    event CapitalInjected(address indexed loan, uint256 amountEthSent);

    /// @notice Emitted when vault withdraws from any loan
    event CapitalWithdrawn(address indexed loan, uint256 amountEthReceived);

    /// @notice Emitted when vault liquidates a loan
    event LoanLiquidated(address indexed loan, uint256 profit);

    /// @notice Emitted when new interest rate is set
    event InterestUpdated(uint256 newAccumulatedInterest, uint256 timestamp);

    /// @notice Emmited when principal is deposited into vault
    event DepositedPrincipal(address indexed owner, address indexed receiver, uint256 assets, uint256 shares);
    
    /// @notice Emmited when LP withdraws his tokens back from vault
    event WithdrawnAmount(address indexed owner, address indexed receiver, uint256 assets, uint256 sharesBurned);

    // -------------------CONSTRUCTOR------------------------
    constructor(
        string memory _name,
        string memory _symbol,
        address _pyusdToken,
        address _wethToken,
        address _swapRouter,
        address _ethUsdFeed,
        address _pyusdUsdFeed,
        address _debtTokenAddr
    ) ERC4626(ERC20(_pyusdToken)) ERC20(_name, _symbol) Ownable(msg.sender) {
        PYUSD_TOKEN = _pyusdToken;
        WETH_TOKEN = _wethToken;
        DEBT_TOKEN_ADDR = _debtTokenAddr;
        SWAP_ROUTER = ISwapRouter(_swapRouter);
        ETH_USD_FEED = IChainlinkAggregator(_ethUsdFeed);
        PYUSD_USD_FEED = IChainlinkAggregator(_pyusdUsdFeed);
        accumulatedInterest = 1e18; // index = 1.0
        lastInterestUpdate = block.timestamp;
    }

    // ------------------EXTERNAL FUNCTIONS-----------------------

    /**
     * @notice Deposit assets into the vault and zároveň zvýší per-user principal
     * @param amount Amount of PYUSD (6 dec)
     * @param receiver Reeciver of shares + principal
     * 
     * @dev Caller requires previous approve on PYUSD -> address(this).
     */
    function depositFor(uint256 amount, address receiver) external returns (uint256 shares) {
        // Transfer PYUSD from msg.sender to vault
        IERC20(asset()).transferFrom(msg.sender, address(this), amount);
        
        // Calculate shares to mint (1:1 ratio for simplicity)
        shares = amount;
        
        // Mint shares to receiver
        _mint(receiver, shares);

        userPrincipal[receiver] += amount;
        totalPrincipal += amount;

        emit DepositedPrincipal(msg.sender, receiver, amount, shares);
    }

    /**
     * @notice Withdraws amount of PYUSD for LP msg.sender (sníží jeho principal)
     * @param amount PYUSD to withdraw (6 dec)
     * @param receiver Address that receives withdrawn PYUSD
     * @return sharesBurned Amount of bunrt shares
     *
     * @dev Interněally computes sharesNeeded (previewWithdraw) a calls ERC4626 withdraw.
     */
    function withdrawAmount(uint256 amount, address receiver) external returns (uint256 sharesBurned) {
        if (userPrincipal[msg.sender] < amount) revert Vault__PrincipalTooLow();
        if (totalAssets() < amount) revert Vault__InsufficientLiquidity();

        // Calculate shares needed (1:1 ratio for simplicity)
        uint256 sharesNeeded = amount;

        // Burn shares from msg.sender
        _burn(msg.sender, sharesNeeded);
        
        // Transfer PYUSD to receiver
        IERC20(asset()).transfer(receiver, amount);

        userPrincipal[msg.sender] -= amount;
        totalPrincipal -= amount;

        emit WithdrawnAmount(msg.sender, receiver, amount, sharesNeeded);
        return sharesNeeded;
    }

    /**
     * @notice Wrapper for basic redeem
     * @param shares Amount of tokens to withdraw
     * @param receiver Address that receive withdrawn tokens
     * @return assets Amount withdrawn
     */
    function withdrawFromVault(uint256 shares, address receiver) external returns (uint256 assets) {
        assets = redeem(shares, receiver, msg.sender);
    }

    function balanceOfVault(address account) external view returns (uint256) {
        return balanceOf(account);
    }

    /**
     * @notice Adds collateral to an existing loan with low HF to "heal it"
     * @param loan Address of the wrapper holding this loan
     */
    function injectToLoan(address loan) external {
        updateAccumulatedInterest();

        uint256 collateralValueUsd = ILoanWrapper(loan).getTotalCollateralValue();
        uint256 debtValueUsd = ILoanWrapper(loan).getTotalDebtValue();

        if (collateralValueUsd == 0) revert Vault__InvalidLoanAddress();

        uint256 injectionAmountUsd = (collateralValueUsd - debtValueUsd) * debtValueUsd / collateralValueUsd / 2;

        if (IERC20(asset()).balanceOf(address(this)) < injectionAmountUsd) revert Vault__InsufficientLiquidity();

        (, int256 pyusdPriceInt, , , ) = PYUSD_USD_FEED.latestRoundData();
        uint256 pyusdPrice = uint256(pyusdPriceInt);

        // USD -> PYUSD (PYUSD has 6 dec; feed typically 8)
        uint256 injectionAmountPyUsd = (injectionAmountUsd * 1e18) / (pyusdPrice * 1e10);

        uint256 amountEthOut = _swapPyUsdToEth(injectionAmountPyUsd);

        ILoanWrapper(loan).increaseCollateral{value: amountEthOut}(amountEthOut);

        injectedAssets[loan] = InjectedCapital({
            amountPyUsd: injectionAmountPyUsd,
            amountEthSent: amountEthOut,
            initialAccumulatedInterest: accumulatedInterest
        });

        emit CapitalInjected(loan, amountEthOut);
    }

    /**
     * @notice Withdraws additional collateral from loan after HF recovers
     * @param loan Address of the wrapper holding this loan
     */
    function withdrawFromLoan(address loan) external {
        updateAccumulatedInterest();
        
        InjectedCapital memory injected = injectedAssets[loan];
        if (injected.amountPyUsd == 0) revert Vault__NoInjectedAssets();
        
        uint256 investorCollateral = ILoanWrapper(loan).getInvestorCollateralValue();

        // We also take 3% provision for injection from the initial collateral from the user
        uint256 userCollateralToWithdraw = (investorCollateral * 3) / 100;

        ILoanWrapper(loan).decreaseCollateralForVault(investorCollateral, userCollateralToWithdraw);

        uint256 totalEthToWithdraw = investorCollateral + userCollateralToWithdraw;

        uint256 pyusdReceived = _swapEthToPyUsd(totalEthToWithdraw);

        delete injectedAssets[loan];

        emit CapitalWithdrawn(loan, totalEthToWithdraw);
        pyusdReceived;
    }

    /**
     * @notice Liquidates the loan when HF drops below the threshold. Injection 
     * must be executed before liquidation
     * @param loan Address of the wrapper holding this loan
     */
    function liquidate(address loan) external {
        updateAccumulatedInterest();

        InjectedCapital memory injected = injectedAssets[loan];
        
        if (injected.amountPyUsd == 0) {
            revert Vault__NoInjectedAssets();
        }
        uint256 collateralValueEth = ILoanWrapper(loan).getTotalCollateralValue();
        uint256 debtValue = ILoanWrapper(loan).getTotalDebtValue();

        if (collateralValueEth == 0) {
            revert Vault__InvalidLoanAddress();
        }

        // Convert ETH collateral value to PYUSD
        uint256 amountToLiquidatePyUsd = _getPyusdAmountForUsdc(debtValue);

        uint256 vaultBalance = IERC20(asset()).balanceOf(address(this));
        
        if (vaultBalance < amountToLiquidatePyUsd) {
            revert Vault__InsufficientLiquidity();
        }

        // Get the actual USDC amount needed for repayment
        uint256 usdcAmountNeeded = ILoanWrapper(loan).getTotalDebtValue();
        
        // For liquidation, we need USDC but Vault has PYUSD
        // Convert 1:1 PYUSD to USDC (simplified for liquidation)
        uint256 pyusdAmountNeeded = usdcAmountNeeded; // 1:1 conversion
        
        // Check if we have enough PYUSD for the conversion
        if (IERC20(asset()).balanceOf(address(this)) < pyusdAmountNeeded) {
            revert Vault__InsufficientLiquidity();
        }
        
        // For liquidation, swap PYUSD to USDC using simple 1:1 conversion
        IERC20(asset()).approve(address(SWAP_ROUTER), pyusdAmountNeeded);
        uint256 usdcReceived = MockUniswapRouter(address(SWAP_ROUTER)).swapPyUsdToUsdc(asset(), DEBT_TOKEN_ADDR, pyusdAmountNeeded);
        
        // Transfer USDC to loan wrapper for repayment
        IERC20(DEBT_TOKEN_ADDR).transfer(loan, usdcReceived);
        
        ILoanWrapper(loan).repayLoan();
                
        delete injectedAssets[loan];

        _swapEthToPyUsd(address(this).balance);

        emit LoanLiquidated(loan, amountToLiquidatePyUsd);        
    }

    function transferFee() external {
        _swapEthToPyUsd(address(this).balance);
    }

    function principalOf(address user) external view returns (uint256) {
        return userPrincipal[user];
    }

    function availableAssets() external view returns (uint256) {
        return totalAssets();
    }

    // -------------------INTERNAL AND PRIVATE FUNCTIONS-------------------
    /**
     * @notice Swaps PYUSD to WETH (wrapped ETH) with current conversion rate
     * @param amountIn Amount of PYUSD to swap
     */
    function _swapPyUsdToEth(uint256 amountIn) internal virtual returns (uint256) {
        IERC20(PYUSD_TOKEN).approve(address(SWAP_ROUTER), amountIn);

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: PYUSD_TOKEN,
            tokenOut: WETH_TOKEN,
            fee: 3000,
            recipient: address(this),
            deadline: block.timestamp,
            amountIn: amountIn,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        });

        uint256 amountWethOut = SWAP_ROUTER.exactInputSingle(params);
        if (amountWethOut == 0) revert Vault__SwapFailed();

        IWETH(WETH_TOKEN).withdraw(amountWethOut);
        return amountWethOut;
    }

    /**
     * @notice Swaps WETH (wrapped ETH) to PYUSD in current conversion rate
     * @param amountIn Amount of WETH to swap
     */
    function _swapEthToPyUsd(uint256 amountIn) internal virtual returns (uint256) {
        IWETH(WETH_TOKEN).deposit{value: amountIn}();
        IWETH(WETH_TOKEN).approve(address(SWAP_ROUTER), amountIn);

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: WETH_TOKEN,
            tokenOut: PYUSD_TOKEN,
            fee: 3000,
            recipient: address(this),
            deadline: block.timestamp,
            amountIn: amountIn,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        });

        uint256 amountPyUsdOut = SWAP_ROUTER.exactInputSingle(params);
        if (amountPyUsdOut == 0) revert Vault__SwapFailed();
        return amountPyUsdOut;
    }

    /**
     * @notice NOT USED IN THIS PROJECT
     * @notice Should swap PYUSD to USDC in ratio ~1:1
     * @param amountIn Amount of PYUSD to swap
     */
    function _swapPyUsdToUsdc(uint256 amountIn) internal virtual returns (uint256) {
        IERC20(PYUSD_TOKEN).approve(address(SWAP_ROUTER), amountIn);

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: PYUSD_TOKEN,
            tokenOut: DEBT_TOKEN_ADDR, // USDC
            fee: 3000,
            recipient: address(this),
            deadline: block.timestamp,
            amountIn: amountIn,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        });

        uint256 amountOut = SWAP_ROUTER.exactInputSingle(params);
        if (amountOut == 0) revert Vault__SwapFailed();

        return amountOut;
    }

    /**
     * @notice Dummy swap USDC -> PYUSD
     * @param usdcAmount amount of USDC tokens to swap
     */
    function _getPyusdAmountForUsdc(uint256 usdcAmount) internal pure returns (uint256) {
        // For mock purposes, assume 1:1 conversion PYUSD to USDC
        // In real scenario, you would use price feeds to calculate the conversion
        return usdcAmount;
    }

    // -------------------PUBLIC FUNCTIONS-------------------
    /**
     * @notice Sets new interest for LPs
     */
    function updateAccumulatedInterest() public {
        if (block.timestamp > lastInterestUpdate) {
            uint256 timeDelta = block.timestamp - lastInterestUpdate;
            uint256 interestPerSecond = interestRate / SECONDS_PER_YEAR;
            uint256 interestAccrued = interestPerSecond * timeDelta;
            accumulatedInterest = accumulatedInterest.mulDiv(1e18 + interestAccrued, 1e18);
            lastInterestUpdate = block.timestamp;
            emit InterestUpdated(accumulatedInterest, lastInterestUpdate);
        }
    }

    /// @notice ERC4626 accounting – jen skutečný PYUSD ve vaultu
    function totalAssets() public view override returns (uint256) {
        return IERC20(asset()).balanceOf(address(this));
    }

    /// @notice Shares decimals of ERC4626 token (PYUSD)
    function decimals()
        public
        view
        override(ERC4626)
        returns (uint8)
    {
        return ERC4626.decimals();
    }

    /**
     * @notice Returns amount in PYUSD that is injected to the loan
     * @param loan Address of the loan we want to observe
     */
    function currentLoanValue(address loan) public view returns (uint256) {
        InjectedCapital memory injected = injectedAssets[loan];
        if (injected.amountPyUsd == 0) return 0;

        uint256 currentAccInterest = accumulatedInterest;
        if (block.timestamp > lastInterestUpdate) {
            uint256 timeDelta = block.timestamp - lastInterestUpdate;
            uint256 interestPerSecond = interestRate / SECONDS_PER_YEAR;
            uint256 interestAccrued = interestPerSecond * timeDelta;
            currentAccInterest = accumulatedInterest.mulDiv(1e18 + interestAccrued, 1e18);
        }
        
        return injected.amountPyUsd.mulDiv(currentAccInterest, injected.initialAccumulatedInterest);
    }

    receive() external payable {}
}

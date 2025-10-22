// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import "hardhat/console.sol";


interface ISwapAdapter {
    function swapPyUsdToEth(address pyusd, uint256 amountPyUsd) external returns (uint256 ethOut);
}



interface ILoanWrapper {
    function getTotalCollateralValue() external view returns (uint256);
    function getTotalDebtValue() external view returns (uint256);
    function increaseCollateral(uint256 amount) external payable;
    function decreaseCollateral(uint256 amount) external payable;
    function decreaseCollateralForVault(uint256 investorAmount, uint256 userAmount) external payable;
    function getOwnerCollateralValue() external view returns (uint256);
    function getInvestorCollateralValue() external view returns (uint256);
    function repayLoan() external;
} 

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

// Interface pro WETH
interface IWETH is IERC20 {
    function deposit() external payable;
    function withdraw(uint256 wad) external;
}

// Interface for Chainlink Price Feed
interface IChainlinkAggregator {
    function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
}

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
    error Vault__SwapFailed();
    // More errors maybe ???
    error Vault__SwapAdapterNotSet();



        //address public constant PYUSD_TOKEN = 0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9;
    //address public immutable PYUSD_TOKEN; // PYUSD token address
    //address public constant WETH_TOKEN = 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14; // WETH na Sepolia
    //ISwapRouter public constant SWAP_ROUTER = ISwapRouter(0x3bFA4769Fb09E13F390230Aad1E1645803B2a936); // Uniswap V3 Router na Sepolia
    //IChainlinkAggregator public constant ETH_USD_FEED = IChainlinkAggregator(0x694AA1769357215DE4FAC081bf1f309aDC325306); // Chainlink ETH/USD on Sepolia
    //IChainlinkAggregator public constant PYUSD_USD_FEED = IChainlinkAggregator(0x2306915A27A3a236592274A4589942A49B49742C); 
    // ------------------CONSTANTS------------------
    address public immutable PYUSD_TOKEN; 
    // PYUSD token address
    address public immutable WETH_TOKEN; // WETH token address
    ISwapRouter public immutable SWAP_ROUTER; // Uniswap V3 Router
    IChainlinkAggregator public immutable ETH_USD_FEED; // Chainlink ETH/USD
    IChainlinkAggregator public immutable PYUSD_USD_FEED; // Chainlink PYUSD/USD

    /// @notice The annual interest rate charged on injected capital (1e18 precision).
    uint256 public interestRate = 5* 1e16; // TODO: Decide to interestRate if we have decided to be 5% it should be 5 * 1e16 I think;
    uint256 public SECONDS_PER_YEAR = 31_556_926; 

    // ---------------------STRUCTS----------------------

    /**
     * @notice Stores information about capital injected into a specific loan.
     * @param amount The principal amount of the asset token that was injected.
     * @param initialAccumulatedInterest The global interest index at the moment of injection.
     */
    struct InjectedCapital {
        uint256 amountPyUsd;
        uint256 amountEthSent;
        uint256 initialAccumulatedInterest;
    }

    /// @notice Mapping from a loan wrapper address to its injected capital data.
    mapping(address => InjectedCapital) public injectedAssets;
    
   
    
    /// @notice The global accumulated interest index, representing the growth of capital over time.
    uint256 public accumulatedInterest;

    /// @notice The timestamp of the last time the accumulated interest was updated.
    uint256 public lastInterestUpdate;

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
     * @param _pyusdToken Address of the PYUSD token.
     * @param _wethToken Address of the WETH token.
     * @param _swapRouter Address of the Uniswap router.
     * @param _ethUsdFeed Address of the ETH/USD price feed.
     * @param _pyusdUsdFeed Address of the PYUSD/USD price feed.
     */
    constructor(
        string memory _name,
        string memory _symbol,
        address _pyusdToken,
        address _wethToken,
        address _swapRouter,
        address _ethUsdFeed,
        address _pyusdUsdFeed
    ) ERC4626(ERC20(_pyusdToken)) ERC20(_name, _symbol) Ownable(msg.sender) {
        PYUSD_TOKEN = _pyusdToken;
        WETH_TOKEN = _wethToken;
        SWAP_ROUTER = ISwapRouter(_swapRouter);
        ETH_USD_FEED = IChainlinkAggregator(_ethUsdFeed);
        PYUSD_USD_FEED = IChainlinkAggregator(_pyusdUsdFeed);
        accumulatedInterest = 1e18; // Start with an index of 1.0
        lastInterestUpdate = block.timestamp;
    }
    

    // ------------------EXTERNAL FUNCTIONS-----------------------
    /**
     * @notice Injects liquidity from the vault into a risky loan.
     * @param loan Address of the Cushion LoanWrapper.
     * @dev Can be called just with bot. Checking of HF is deleated
     */
    function injectToLoan(address loan) external {
        
        updateAccumulatedInterest();

        uint256 collateralValueUsd = ILoanWrapper(loan).getTotalCollateralValue();
        uint256 debtValueUsd = ILoanWrapper(loan).getTotalDebtValue();
        console.log("Vault: collateralValueUsd:", collateralValueUsd);
        console.log("Vault: debtValueUsd:", debtValueUsd);
        if (collateralValueUsd == 0) revert Vault__InvalidLoanAddress();
        uint256 injectionAmountUsd = (collateralValueUsd - debtValueUsd) * debtValueUsd / collateralValueUsd / 2;
        console.log("Vault: injectionAmountUsd:", injectionAmountUsd);
        
        if (IERC20(asset()).balanceOf(address(this)) < injectionAmountUsd) revert Vault__InsufficientLiquidity();

    
        // calculate Eth -> PyUsd
        (, int256 pyusdPriceInt, , , ) = PYUSD_USD_FEED.latestRoundData();
        uint256 pyusdPrice = uint256(pyusdPriceInt); 
        console.log("Vault: pyusdPrice:", pyusdPrice);
    
        // Převod USD na PYUSD
        uint256 injectionAmountPyUsd = (injectionAmountUsd * 1e18) / (pyusdPrice * 1e10);
        console.log("Vault: injectionAmountPyUsd:", injectionAmountPyUsd);

        // swap pyUSD -> Eth
        uint256 amountEthOut = _swapPyUsdToEth(injectionAmountPyUsd);
        
        // send Eth to LoanWrapper
        ILoanWrapper(loan).increaseCollateral{value: amountEthOut}(amountEthOut);

        // --- Efekty ---
        injectedAssets[loan] = InjectedCapital({
            amountPyUsd: injectionAmountPyUsd,
            amountEthSent: amountEthOut,
            initialAccumulatedInterest: accumulatedInterest
        });
    
        totalInjectedAssets += injectionAmountPyUsd;

        // Odečíst PYUSD z Vaultu - transfer do dead address
        console.log("Vault: burning PYUSD from vault, amount:", injectionAmountPyUsd);
        console.log("Vault: PYUSD balance before burn:", IERC20(asset()).balanceOf(address(this)));
        
        // Transfer PYUSD do dead address (burn)
        IERC20(asset()).transfer(address(0x000000000000000000000000000000000000dEaD), injectionAmountPyUsd);
        console.log("Vault: PYUSD burned successfully");

        emit CapitalInjected(loan, amountEthOut);
    }

    /**
     * @notice Withdraws previously injected capital from a recovered loan.
     * @param loan Address of the Cushion LoanWrapper.
     * @dev Can be called by anyone when a loan's HF is above the withdrawal threshold.
     * @dev Withdraws: 100% investor collateral + 3% of user collateral
     * @dev Converts withdrawn ETH to PYUSD and deposits to Vault
     */
    function withdrawFromLoan(address loan) external {
        updateAccumulatedInterest();
        
        InjectedCapital memory injected = injectedAssets[loan];
        if (injected.amountPyUsd == 0) revert Vault__NoInjectedAssets();
        
        // Get collateral amounts
        uint256 investorCollateral = ILoanWrapper(loan).getInvestorCollateralValue();
        uint256 userCollateral = ILoanWrapper(loan).getOwnerCollateralValue();
        
        console.log("Vault: withdrawFromLoan - investorCollateral:", investorCollateral);
        console.log("Vault: withdrawFromLoan - userCollateral:", userCollateral);
        
        // Calculate withdrawal: 100% investor + 3% user collateral
        uint256 userCollateralToWithdraw = (investorCollateral * 3) / 100; // 3% of user collateral
        
        console.log("Vault: withdrawFromLoan - userCollateralToWithdraw (3%):", userCollateralToWithdraw);
        console.log("Vault: withdrawFromLoan - investorCollateral to withdraw:", investorCollateral);
        
        // Withdraw both investor and user collateral in one call
        console.log("Vault: withdrawFromLoan - calling decreaseCollateralForVault");
        console.log("Vault: withdrawFromLoan - investorAmount:", investorCollateral);
        console.log("Vault: withdrawFromLoan - userAmount:", userCollateralToWithdraw);
        
        ILoanWrapper(loan).decreaseCollateralForVault(investorCollateral, userCollateralToWithdraw);


        uint256 totalEthToWithdraw = investorCollateral + userCollateralToWithdraw;
        
        // Convert received ETH to PYUSD and deposit to Vault
        uint256 pyusdReceived = _swapEthToPyUsd(totalEthToWithdraw);
        console.log("Vault: withdrawFromLoan - pyusdReceived:", pyusdReceived);
        
        // Update accounting
        totalInjectedAssets -= injected.amountPyUsd;
        delete injectedAssets[loan];
        
        emit CapitalWithdrawn(loan, totalEthToWithdraw);
        console.log("Vault: withdrawFromLoan completed successfully");
        console.log("Vault: PYUSD deposited to Vault:", pyusdReceived);
    }

    /**
     * @notice Liquidates a loan to protect the vault's capital.
     * @param loan Address of the Cushion LoanWrapper.
     * @dev Can be called by anyone when a loan's HF is below the liquidation threshold.
     */
    function liquidate(address loan) external {

        updateAccumulatedInterest();
        InjectedCapital memory injected = injectedAssets[loan];
        if (injected.amountPyUsd == 0) revert Vault__NoInjectedAssets();

        uint256 amountToLiquidate = ILoanWrapper(loan).getTotalCollateralValue();
        if (amountToLiquidate == 0) revert Vault__InvalidLoanAddress();

        if (IERC20(asset()).balanceOf(address(this)) < amountToLiquidate) {
            revert Vault__InsufficientLiquidity();
        }

        
        IERC20(asset()).approve(loan, amountToLiquidate);
        ILoanWrapper(loan).repayLoan();

        if (totalInjectedAssets >= injected.amountEthSent) {
        totalInjectedAssets -= injected.amountEthSent;
        } else {
            totalInjectedAssets = 0;
        }
        delete injectedAssets[loan];
        

        emit LoanLiquidated(loan, amountToLiquidate);
    }

    

    function _swapPyUsdToEth(uint256 amountIn) internal virtual returns (uint256) {
        console.log("Vault: _swapPyUsdToEth called with amountIn:", amountIn);
        console.log("Vault: PYUSD_TOKEN:", PYUSD_TOKEN);
        console.log("Vault: WETH_TOKEN:", WETH_TOKEN);
        console.log("Vault: SWAP_ROUTER:", address(SWAP_ROUTER));
        console.log("Vault: contract ETH balance before swap:", address(this).balance);
        
        // Approve PYUSD tokens for the swap router
        console.log("Vault: approving PYUSD tokens for swap router");
        IERC20(PYUSD_TOKEN).approve(address(SWAP_ROUTER), amountIn);
        console.log("Vault: PYUSD approval completed");

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: PYUSD_TOKEN,
            tokenOut: WETH_TOKEN,
            fee: 3000,
            recipient: address(this),
            deadline: block.timestamp,
            amountIn: amountIn,
            amountOutMinimum: 0,           // POC: 0; v produkci nastav slippage
            sqrtPriceLimitX96: 0
        });

        console.log("Vault: calling SWAP_ROUTER.exactInputSingle");
        uint256 amountWethOut = SWAP_ROUTER.exactInputSingle(params);
        console.log("Vault: exactInputSingle returned amountWethOut:", amountWethOut);
        
        if (amountWethOut == 0) revert Vault__SwapFailed();

        // převod WETH -> ETH pro increaseCollateral{value: ...}
        console.log("Vault: calling WETH withdraw with amount:", amountWethOut);
        console.log("Vault: WETH balance before withdraw:", IERC20(WETH_TOKEN).balanceOf(address(this)));
        IWETH(WETH_TOKEN).withdraw(amountWethOut);
        console.log("Vault: WETH withdraw completed");
        console.log("Vault: contract ETH balance after withdraw:", address(this).balance);
        
        return amountWethOut; // v wei (ETH)
    }



    function _swapEthToPyUsd(uint256 amountIn) internal virtual returns (uint256) {
        console.log("Vault: _swapEthToPyUsd called with amountIn:", amountIn);
        console.log("Vault: depositing ETH to WETH");
        IWETH(WETH_TOKEN).deposit{value: amountIn}();
        console.log("Vault: WETH deposit completed");
        
        console.log("Vault: approving WETH for swap router");
        IWETH(WETH_TOKEN).approve(address(SWAP_ROUTER), amountIn);
        console.log("Vault: WETH approval completed");
        
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
        
        console.log("Vault: calling SWAP_ROUTER.exactInputSingle for ETH->PYUSD");
        uint256 amountPyUsdOut = SWAP_ROUTER.exactInputSingle(params);
        console.log("Vault: exactInputSingle returned amountPyUsdOut:", amountPyUsdOut);
        
        if (amountPyUsdOut == 0) revert Vault__SwapFailed();
        return amountPyUsdOut;
    }

    // -------------------VIEW AND HELPER FUNCTIONS-------------------

    /**
     * @notice Updates the `accumulatedInterest` index based on the `interestRate`.
     * @dev Should be called at the beginning of any function that relies on the current value.
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

    /**
     * @notice Returns the total value of assets managed by the vault.
     * @dev Overrides the ERC4626 standard to include the value of injected capital.
     */
    function totalAssets() public view override returns (uint256) {
        // This function should return the assets, how much is actually in the vault 
        // plus the principal amount of capital that is currently deployed in loans. 
        return IERC20(asset()).balanceOf(address(this)) + totalInjectedAssets;
    }

    /**
     * @notice Calculates the current value of a specific injected loan, including interest.
     * @param loan Address of the wrapped loan.
     * @return The current value of the injected capital.
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

    receive() external payable {
        console.log("Vault: received ETH:", msg.value);
        console.log("Vault: total ETH balance now:", address(this).balance);
        // Don't automatically convert ETH to PYUSD - keep it for collateral operations
        // ETH will be used for increaseCollateral{value: ...} calls
    }

    

    /**
     * Maybe more functions, will add it later
     */
}
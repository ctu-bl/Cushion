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
    function decreaseCollateralForVault(uint256 investorAmount, uint256 userAmount) external;
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
 * @author CtuBlockchain Lab
 * @notice ERC4626 vault nad PYUSD s extra per-user účetnictvím principalu v PYUSD.
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

    /// @notice roční sazba pro injected kapitál (1e18 precision).
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

    /// globální úrokový index
    uint256 public accumulatedInterest;
    uint256 public lastInterestUpdate;

    /// pro jednoduchost – celkový injected principal (v PYUSD ekv.)
    uint256 public totalInjectedAssets;

    // ---------------------USER ACCOUNTING (NEW)----------------------
    /// @notice čistý principal v PYUSD, který patří konkrétnímu uživateli (nezahrnuje výnosy mimo Vault)
    mapping(address => uint256) public userPrincipal;

    /// @notice součet všech userPrincipal
    uint256 public totalPrincipal;

    // --------------------EVENTS----------------------
    event CapitalInjected(address indexed loan, uint256 amountEthSent);
    event CapitalWithdrawn(address indexed loan, uint256 amountEthReceived);
    event LoanLiquidated(address indexed loan, uint256 profit);
    event InterestUpdated(uint256 newAccumulatedInterest, uint256 timestamp);
    event InterestRateSet(uint256 newRate);
    event ThresholdsSet(uint256 injection, uint256 withdrawal, uint256 liquidation);

    event DepositedPrincipal(address indexed owner, address indexed receiver, uint256 assets, uint256 shares);
    event WithdrawnAmount(address indexed owner, address indexed receiver, uint256 assets, uint256 sharesBurned);

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

    // ------------------EXTERNAL: USER FLOW-----------------------

    /**
     * @notice Deposit assets into the vault and zároveň zvýší per-user principal.
     * @dev Caller musí mít approve na PYUSD -> address(this).
     * @param amount PYUSD (6 dec)
     * @param receiver komu se připíší shares + principal
     */
    function depositFor(uint256 amount, address receiver) external returns (uint256 shares) {
        console.log("Vault.depositFor amount:", amount, "receiver:", receiver);
        console.log("Vault.depositFor msg.sender:", msg.sender);
        console.log("Vault.depositFor user shares before:", balanceOf(receiver));
        console.log("Vault.depositFor totalSupply before:", totalSupply());

        // Transfer PYUSD from msg.sender to vault
        IERC20(asset()).transferFrom(msg.sender, address(this), amount);
        console.log("Vault.depositFor PYUSD transferred successfully");
        
        // Calculate shares to mint (1:1 ratio for simplicity)
        shares = amount;
        console.log("Vault.depositFor shares to mint:", shares);
        
        // Mint shares to receiver
        _mint(receiver, shares);
        console.log("Vault.depositFor shares minted:", shares);

        // Účetnictví principalu
        userPrincipal[receiver] += amount;
        totalPrincipal += amount;

        emit DepositedPrincipal(msg.sender, receiver, amount, shares);

        console.log("Vault: userPrincipal[receiver]:", userPrincipal[receiver]);
        console.log("Vault: user shares after:", balanceOf(receiver));
        console.log("Vault: totalAssets:", totalAssets(), " totalSupply:", totalSupply());
    }

    /**
     * @notice Vybere přesné množství PYUSD pro msg.sender (sníží jeho principal).
     * @dev Interně spočítá sharesNeeded (previewWithdraw) a zavolá ERC4626 withdraw.
     * @param amount PYUSD k výběru (6 dec)
     * @param receiver adresa, která obdrží PYUSD
     * @return sharesBurned kolik shares se spálilo
     */
    function withdrawAmount(uint256 amount, address receiver) external returns (uint256 sharesBurned) {
        console.log("Vault.withdrawAmount amount:", amount, "receiver:", receiver);
        console.log("Vault.withdrawAmount msg.sender:", msg.sender);
        console.log("Vault.withdrawAmount userPrincipal[msg.sender]:", userPrincipal[msg.sender]);
        console.log("Vault.withdrawAmount userPrincipal[receiver]:", userPrincipal[receiver]);

        if (userPrincipal[msg.sender] < amount) revert Vault__PrincipalTooLow();
        if (totalAssets() < amount) revert Vault__InsufficientLiquidity(); // chrání pro případ, že je část kapitálu zainvestovaná

        // Calculate shares needed (1:1 ratio for simplicity)
        uint256 sharesNeeded = amount;
        console.log("Vault.withdrawAmount sharesNeeded:", sharesNeeded);
        console.log("Vault.withdrawAmount user shares:", balanceOf(msg.sender));

        // Burn shares from msg.sender
        _burn(msg.sender, sharesNeeded);
        console.log("Vault.withdrawAmount shares burned:", sharesNeeded);
        
        // Transfer PYUSD to receiver
        IERC20(asset()).transfer(receiver, amount);
        console.log("Vault.withdrawAmount PYUSD transferred to receiver:", amount);

        // Účetnictví principalu
        userPrincipal[msg.sender] -= amount;
        totalPrincipal -= amount;

        emit WithdrawnAmount(msg.sender, receiver, amount, sharesNeeded);
        return sharesNeeded;
    }

    /**
     * @notice Pohodlná obálka pro "klasický" redeem (na shares).
     */
    function withdrawFromVault(uint256 shares, address receiver) external returns (uint256 assets) {
        assets = redeem(shares, receiver, msg.sender);
        // POZOR: redeem na shares **nemění** userPrincipal – to držíme konzistentní jen přes withdrawAmount().
        // Pokud chceš synchronizovat i tenhle path, můžeš zde odečíst min(assets, userPrincipal[msg.sender]).
    }

    function balanceOfVault(address account) external view returns (uint256) {
        return balanceOf(account);
    }

    // ------------------ LOAN FLOW (původní logika) -----------------------

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

        (, int256 pyusdPriceInt, , , ) = PYUSD_USD_FEED.latestRoundData();
        uint256 pyusdPrice = uint256(pyusdPriceInt); 
        console.log("Vault: pyusdPrice:", pyusdPrice);
    
        // Převod USD na PYUSD
        uint256 injectionAmountPyUsd = (injectionAmountUsd * 1e18) / (pyusdPrice * 1e10);
        console.log("Vault: injectionAmountPyUsd:", injectionAmountPyUsd);

        uint256 amountEthOut = _swapPyUsdToEth(injectionAmountPyUsd);

        ILoanWrapper(loan).increaseCollateral{value: amountEthOut}(amountEthOut);

        injectedAssets[loan] = InjectedCapital({
            amountPyUsd: injectionAmountPyUsd,
            amountEthSent: amountEthOut,
            initialAccumulatedInterest: accumulatedInterest
        });
    
        totalInjectedAssets += injectionAmountPyUsd;

        //_burn(address(this), injectionAmountPyUsd);

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

    function liquidate(address loan) external {
        updateAccumulatedInterest();

        InjectedCapital memory injected = injectedAssets[loan];
        if (injected.amountPyUsd == 0) revert Vault__NoInjectedAssets();

        uint256 amountToLiquidate = ILoanWrapper(loan).getTotalCollateralValue();
        if (amountToLiquidate == 0) revert Vault__InvalidLoanAddress();

        if (IERC20(asset()).balanceOf(address(this)) < amountToLiquidate) revert Vault__InsufficientLiquidity();

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

    // ------------------- SWAPS -------------------

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

    // ------------------- VIEW / HELPERS -------------------

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

    /// ERC4626 accounting – jen skutečný PYUSD ve vaultu
    function totalAssets() public view override returns (uint256) {
        return IERC20(asset()).balanceOf(address(this));
    }

    /// Shares decimals = asset decimals (správné dědění)
    function decimals()
        public
        view
        override(ERC4626)
        returns (uint8)
    {
        return ERC4626.decimals();
    }

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

    function _getTotalLoanValue() internal view returns (uint256) {
        return totalInjectedAssets;
    }

    // --------- Convenience views ---------
    function principalOf(address user) external view returns (uint256) {
        return userPrincipal[user];
    }

    function availableAssets() external view returns (uint256) {
        return totalAssets();
    }

    receive() external payable {
        // držíme ETH pro collateral operace; neswapujeme automaticky
    }
}

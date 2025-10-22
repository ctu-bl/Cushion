// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import "hardhat/console.sol";
import "./mocks/MockUniswapRouter.sol";

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

    // ------------------CONSTANTS------------------
    address public immutable PYUSD_TOKEN; // asset()
    address public immutable WETH_TOKEN;
    address public immutable DEBT_TOKEN_ADDR; // USDC address
    ISwapRouter public immutable SWAP_ROUTER;
    IChainlinkAggregator public immutable ETH_USD_FEED;
    IChainlinkAggregator public immutable PYUSD_USD_FEED;

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

        if (collateralValueUsd == 0) revert Vault__InvalidLoanAddress();

        uint256 injectionAmountUsd = (collateralValueUsd - debtValueUsd) * debtValueUsd / collateralValueUsd / 2;

        if (IERC20(asset()).balanceOf(address(this)) < injectionAmountUsd) revert Vault__InsufficientLiquidity();

        (, int256 pyusdPriceInt, , , ) = PYUSD_USD_FEED.latestRoundData();
        uint256 pyusdPrice = uint256(pyusdPriceInt);

        // USD -> PYUSD (PYUSD má 6 dec; feed typicky 8)
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

    function withdrawFromLoan(address loan) external {
        updateAccumulatedInterest();
        
        InjectedCapital memory injected = injectedAssets[loan];
        if (injected.amountPyUsd == 0) revert Vault__NoInjectedAssets();
        
        uint256 investorCollateral = ILoanWrapper(loan).getInvestorCollateralValue();
        uint256 userCollateral = ILoanWrapper(loan).getOwnerCollateralValue();

        // 3 % z user collateral (jak máš v poznámce) – tady bylo trochu nejasné,
        // nechávám tvůj původní výpočet (3 % z investorCollateral), případně uprav:
        uint256 userCollateralToWithdraw = (investorCollateral * 3) / 100;

        ILoanWrapper(loan).decreaseCollateralForVault(investorCollateral, userCollateralToWithdraw);

        uint256 totalEthToWithdraw = investorCollateral + userCollateralToWithdraw;

        uint256 pyusdReceived = _swapEthToPyUsd(totalEthToWithdraw);
        // PYUSD zůstává ve vaultu → totalAssets se zvedne

        delete injectedAssets[loan];

        emit CapitalWithdrawn(loan, totalEthToWithdraw);
        pyusdReceived; // silence warning
    }

    function liquidate(address loan) external {
        console.log("=== LIQUIDATE FUNCTION START ===");
        console.log("Liquidating loan:", loan);
        console.log("Vault PYUSD balance:", IERC20(asset()).balanceOf(address(this)));

        updateAccumulatedInterest();

        InjectedCapital memory injected = injectedAssets[loan];
        console.log("Injected amountPyUsd:", injected.amountPyUsd);
        console.log("Injected amountEthSent:", injected.amountEthSent);
        console.log("Injected initialAccumulatedInterest:", injected.initialAccumulatedInterest);
        
        if (injected.amountPyUsd == 0) {
            console.log("ERROR: No injected assets found for this loan");
            revert Vault__NoInjectedAssets();
        }

        uint256 collateralValueEth = ILoanWrapper(loan).getTotalCollateralValue();
        console.log("Collateral value in ETH:", collateralValueEth);
        
        if (collateralValueEth == 0) {
            console.log("ERROR: Invalid loan address - no collateral value");
            revert Vault__InvalidLoanAddress();
        }

        // Convert ETH collateral value to PYUSD
        uint256 amountToLiquidatePyUsd = _getEthValueInPyusd(collateralValueEth);
        console.log("Amount to liquidate in PYUSD:", amountToLiquidatePyUsd);

        uint256 vaultBalance = IERC20(asset()).balanceOf(address(this));
        console.log("Vault PYUSD balance:", vaultBalance);
        console.log("Required amount in PYUSD:", amountToLiquidatePyUsd);
        
        if (vaultBalance < amountToLiquidatePyUsd) {
            console.log("ERROR: Insufficient liquidity in vault");
            revert Vault__InsufficientLiquidity();
        }

        // Get the actual USDC amount needed for repayment
        uint256 usdcAmountNeeded = ILoanWrapper(loan).getTotalDebtValue();
        console.log("USDC amount needed for repayment:", usdcAmountNeeded);
        
        // For liquidation, we need USDC but Vault has PYUSD
        // Convert 1:1 PYUSD to USDC (simplified for liquidation)
        console.log("Converting PYUSD to USDC for repayment (1:1 ratio)");
        uint256 pyusdAmountNeeded = usdcAmountNeeded; // 1:1 conversion
        
        // Check if we have enough PYUSD for the conversion
        if (IERC20(asset()).balanceOf(address(this)) < pyusdAmountNeeded) {
            console.log("ERROR: Insufficient PYUSD for USDC conversion");
            revert Vault__InsufficientLiquidity();
        }
        
        // For liquidation, swap PYUSD to USDC using simple 1:1 conversion
        console.log("Swapping PYUSD to USDC for liquidation (1:1)");
        console.log("PYUSD amount for swap:", pyusdAmountNeeded);
        IERC20(asset()).approve(address(SWAP_ROUTER), pyusdAmountNeeded);
        uint256 usdcReceived = MockUniswapRouter(address(SWAP_ROUTER)).swapPyUsdToUsdc(asset(), DEBT_TOKEN_ADDR, pyusdAmountNeeded);
        console.log("USDC received from swap:", usdcReceived);
        
        // Transfer USDC to loan wrapper for repayment
        console.log("Transferring USDC to loan wrapper for repayment");
        IERC20(DEBT_TOKEN_ADDR).transfer(loan, usdcReceived);
        console.log("USDC transferred to loan:", usdcReceived);
        
        console.log("Calling repayLoan on loan wrapper");
        ILoanWrapper(loan).repayLoan();

        // After repaying the loan, withdraw all collateral
        uint256 investorCollateral = ILoanWrapper(loan).getInvestorCollateralValue();
        uint256 userCollateral = ILoanWrapper(loan).getOwnerCollateralValue();
        console.log("Investor collateral to withdraw:", investorCollateral);
        console.log("User collateral to withdraw:", userCollateral);
        
        if (investorCollateral > 0 || userCollateral > 0) {
            console.log("Withdrawing all collateral from loan wrapper");
            ILoanWrapper(loan).decreaseCollateralForVault(investorCollateral, userCollateral);
            
            uint256 totalEthReceived = investorCollateral + userCollateral;
            console.log("Total ETH received from collateral:", totalEthReceived);
            
            // Convert ETH back to PYUSD and keep it in vault
            uint256 pyusdFromCollateral = _swapEthToPyUsd(totalEthReceived);
            console.log("PYUSD received from collateral swap:", pyusdFromCollateral);
        }

        console.log("Updating totalInjectedAssets");
        console.log("Current totalInjectedAssets:", totalInjectedAssets);
        console.log("Injected amountEthSent:", injected.amountEthSent);
        
        if (totalInjectedAssets >= injected.amountEthSent) {
            totalInjectedAssets -= injected.amountEthSent;
        } else {
            totalInjectedAssets = 0;
        }
        
        console.log("New totalInjectedAssets:", totalInjectedAssets);
        
        console.log("Deleting injected assets for loan");
        delete injectedAssets[loan];

        console.log("Emitting LoanLiquidated event");
        emit LoanLiquidated(loan, amountToLiquidatePyUsd);
        
        console.log("=== LIQUIDATE FUNCTION END ===");
    }

    // ------------------- SWAPS -------------------

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
        return amountWethOut; // ETH
    }

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

    function _getPyusdAmountForUsdc(uint256 usdcAmount) internal view returns (uint256) {
        // For mock purposes, assume 1:1 conversion PYUSD to USDC
        // In real scenario, you would use price feeds to calculate the conversion
        return usdcAmount;
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

    function _getEthValueInPyusd(uint256 ethAmount) internal view returns (uint256) {
        if (ethAmount == 0) return 0;
        (, int256 ethPriceInt, , , ) = ETH_USD_FEED.latestRoundData();
        (, int256 pyusdPriceInt, , , ) = PYUSD_USD_FEED.latestRoundData();
        uint256 ethPrice = uint256(ethPriceInt);
        uint256 pyusdPrice = uint256(pyusdPriceInt);

        uint256 ethValueUsd = (ethAmount * ethPrice) / 1e18;
        uint256 pyusdValue = (ethValueUsd * 1e6) / pyusdPrice; // PYUSD 6 dec
        return pyusdValue;
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

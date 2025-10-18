// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

interface ILoanWrapper {
    function getTotalCollateralValue() external view returns (uint256);
    function getTotalDebtValue() external view returns (uint256);
    function increaseCollateral(uint256 amount) external payable;
    function decreaseCollateral(uint256 amount) external;
}

interface ISwapAdapter {
    function swapPyUsdToEth(address pyusd, uint256 amountPyUsd) external returns (uint256 ethOut);
}

interface IChainlinkAggregator {
    function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
}

/// @notice Testovatelná verze Vault kontraktu s konfigurovatelnými adresami
contract TestableVaultNew is ERC4626, Ownable {
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

    // ------------------CONSTANTS------------------
    address public immutable PYUSD_TOKEN;
    IChainlinkAggregator public immutable PYUSD_USD_FEED;
    ISwapAdapter public swapAdapter;

    /// @notice The annual interest rate charged on injected capital (1e18 precision).
    uint256 public interestRate = 5* 1e16; // 5%
    uint256 public SECONDS_PER_YEAR = 31_556_926; 

    // ---------------------STRUCTS----------------------
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
    event CapitalInjected(address indexed loan, uint256 amount);
    event CapitalWithdrawn(address indexed loan, uint256 amount);
    event InterestUpdated(uint256 newAccumulatedInterest, uint256 timestamp);

    // -------------------CONSTRUCTOR------------------------
    constructor(
        string memory _name,
        string memory _symbol,
        address _pyusdToken,
        address _pyusdUsdFeed
    ) ERC4626(ERC20(_pyusdToken)) ERC20(_name, _symbol) Ownable(msg.sender) {
        PYUSD_TOKEN = _pyusdToken;
        PYUSD_USD_FEED = IChainlinkAggregator(_pyusdUsdFeed);
        accumulatedInterest = 1e18; // Start with an index of 1.0
        lastInterestUpdate = block.timestamp;
    }
    
    // ------------------EXTERNAL FUNCTIONS-----------------------
    function injectToLoan(address loan) external {
        updateAccumulatedInterest();

        uint256 collateralValueUsd = ILoanWrapper(loan).getTotalCollateralValue();
        uint256 debtValueUsd = ILoanWrapper(loan).getTotalDebtValue();
        if (collateralValueUsd == 0) revert Vault__InvalidLoanAddress();
        uint256 injectionAmountUsd = ((collateralValueUsd - debtValueUsd) * debtValueUsd) / collateralValueUsd / 2;

        if (IERC20(asset()).balanceOf(address(this)) < injectionAmountUsd) revert Vault__InsufficientLiquidity();

        // calculate Eth -> PyUsd
        (, int256 pyusdPriceInt, , , ) = PYUSD_USD_FEED.latestRoundData();
        uint256 pyusdPrice = uint256(pyusdPriceInt); // Cena má 8 des. míst
        // Převod USD na PYUSD
        uint256 injectionAmountPyUsd = (injectionAmountUsd * 1e18) / (pyusdPrice * 1e10);

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

        totalInjectedAssets += amountEthOut;  

        emit CapitalInjected(loan, amountEthOut);
    }

    function _swapPyUsdToEth(uint256 amountIn) private returns (uint256) {
        if (address(swapAdapter) == address(0)) revert Vault__SwapAdapterNotSet();
        return swapAdapter.swapPyUsdToEth(PYUSD_TOKEN, amountIn);
    }

    function setSwapAdapter(address a) external {
        swapAdapter = ISwapAdapter(a);
    }

    // -------------------VIEW AND HELPER FUNCTIONS-------------------
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

    function totalAssets() public view override returns (uint256) {
        return IERC20(asset()).balanceOf(address(this)) + totalInjectedAssets;
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

    receive() external payable {}
}

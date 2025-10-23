"use client";

import { useState } from "react";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useWriteContract } from "wagmi";
import { LOAN_WRAPPER_ABI } from "../_constants/abis";

export const useSimulationActions = (address?: string, mockUSDCInfo?: any, mockPoolInfo?: any) => {
  const [borrowerAddress, setBorrowerAddress] = useState("");
  const [borrowAmount, setBorrowAmount] = useState("");
  const [collateralAmount, setCollateralAmount] = useState("");
  const [createdWrapperAddress, setCreatedWrapperAddress] = useState("");
  const [debtAmount, setDebtAmount] = useState("");
  const [collateralManageAmount, setCollateralManageAmount] = useState("");

  // Write contract functions
  const { writeContractAsync: writeRegistry } = useScaffoldWriteContract({
    contractName: "LoanWrapperRegistry",
  });

  const { writeContractAsync: writeMockUSDC } = useScaffoldWriteContract({
    contractName: "MockUSDC",
  });

  const { writeContractAsync: writeMockPYUSD } = useScaffoldWriteContract({
    contractName: "MockPYUSD",
  });

  const { writeContractAsync: writeMockWETH } = useScaffoldWriteContract({
    contractName: "MockWETH",
  });

  const { writeContractAsync: writeMockPool } = useScaffoldWriteContract({
    contractName: "MockPool",
  });

  const { writeContractAsync: writeVault } = useScaffoldWriteContract({
    contractName: "Vault",
  });

  // Write contract for wrapper management - using useWriteContract for dynamic contracts
  const { writeContractAsync: writeWrapper } = useWriteContract();

  // Actions
  const handleWrapLoan = async () => {
    if (!address || !borrowAmount || !collateralAmount) {
      alert("Please fill all fields and ensure you're connected");
      return;
    }

    try {
      const borrowAmountWei = BigInt(Math.floor(parseFloat(borrowAmount) * 1e6));
      const collateralAmountWei = BigInt(Math.floor(parseFloat(collateralAmount) * 1e18));
      
      const tx = await writeRegistry({
        functionName: "wrapLoan",
        args: [address, borrowAmountWei],
        value: collateralAmountWei, // Only collateral, no fee
      });
      
      // Get wrapper address after transaction
      setTimeout(() => {
        setCreatedWrapperAddress("");
      }, 2000);
    } catch (error) {
      alert("Transaction failed: " + (error as Error).message);
    }
  };

  const handleMintUSDC = async () => {
    try {
      await writeMockUSDC({
        functionName: "mint",
        args: [address, BigInt(1000000 * 1e6)], // 1M USDC
      });
    } catch (error) {
      // Error minting USDC
    }
  };

  const handleMintPYUSD = async () => {
    try {
      await writeMockPYUSD({
        functionName: "mint",
        args: [address, BigInt(1000000 * 1e6)], // 1M PYUSD
      });
    } catch (error) {
      // Error minting PYUSD
    }
  };

  const handleMintWETH = async () => {
    try {
      await writeMockWETH({
        functionName: "deposit",
        value: BigInt(Math.floor(parseFloat(collateralAmount || "0") * 1e18)),
      });
    } catch (error) {
      // Error minting WETH
    }
  };

  const handleDepositToPool = async () => {
    try {
      // First approve USDC spending
      await writeMockUSDC({
        functionName: "approve", 
        args: mockPoolInfo?.address ? [mockPoolInfo.address, BigInt(500000 * 1e6)] : undefined,
      });
      
      // Then deposit USDC to pool
      await writeMockPool({
        functionName: "deposit",
        args: mockUSDCInfo?.address && address ? [mockUSDCInfo.address, BigInt(500000 * 1e6), address, 0] : undefined,
      });
    } catch (error) {
      // Error depositing to pool
    }
  };

  const handleIncreaseCollateral = async (userWrapperAddress: string) => {
    if (!collateralManageAmount || !userWrapperAddress) {
      alert("Please enter collateral amount and ensure you have a wrapper");
      return;
    }

    try {
      const amount = BigInt(Math.floor(parseFloat(collateralManageAmount) * 1e18));
      await writeWrapper({
        address: userWrapperAddress as `0x${string}`,
        abi: LOAN_WRAPPER_ABI,
        functionName: "increaseCollateral",
        args: [amount],
        value: amount, // Send ETH as collateral
      });
      setCollateralManageAmount("");
    } catch (error) {
      alert("Increase collateral failed: " + (error as Error).message);
    }
  };

  const handleDecreaseCollateral = async (userWrapperAddress: string, isLocked: boolean, ownerCollateral?: bigint, totalCollateral?: bigint) => {
    if (!collateralManageAmount || !userWrapperAddress) {
      alert("Please enter collateral amount and ensure you have a wrapper");
      return;
    }

    try {
      const amount = BigInt(Math.floor(parseFloat(collateralManageAmount) * 1e18));

      // Validation checks
      if (isLocked) {
        alert("Wrapper is locked. Cannot decrease collateral.");
        return;
      }

      if (ownerCollateral && amount > ownerCollateral) {
        alert(`Cannot decrease more than your collateral. You have ${(Number(ownerCollateral) / 1e18).toFixed(4)} ETH collateral.`);
        return;
      }

      if (amount <= 0n) {
        alert("Amount must be greater than 0");
        return;
      }

      // Check if we have any collateral at all
      if (!totalCollateral || totalCollateral === 0n) {
        alert("No collateral available to decrease.");
        return;
      }

      await writeWrapper({
        address: userWrapperAddress as `0x${string}`,
        abi: LOAN_WRAPPER_ABI,
        functionName: "decreaseCollateral",
        args: [amount],
        value: 0n, // No ETH sent for decrease
      });
      setCollateralManageAmount("");
    } catch (error) {
      // Parse specific error messages
      const errorMessage = (error as Error).message;
      if (errorMessage.includes("LoanWrapper__InvalidAmount")) {
        alert("Invalid amount: Cannot decrease more collateral than you have.");
      } else if (errorMessage.includes("LoanWrapper__BreaksHealthFactor")) {
        alert("Health Factor too low: Decreasing collateral would make the position unsafe.");
      } else if (errorMessage.includes("LoanWrapper__WrapperNotUnlocked")) {
        alert("Wrapper is locked: Cannot decrease collateral when locked.");
      } else if (errorMessage.includes("LoanWrapper__WithdrawFailed")) {
        alert("Withdraw failed: Could not send ETH back to you.");
      } else {
        alert("Decrease collateral failed: " + errorMessage);
      }
    }
  };

  const handleIncreaseDebt = async (userWrapperAddress: string) => {
    if (!debtAmount || !userWrapperAddress) {
      alert("Please enter debt amount and ensure you have a wrapper");
      return;
    }

    try {
      const amount = BigInt(Math.floor(parseFloat(debtAmount) * 1e6));
      await writeWrapper({
        address: userWrapperAddress as `0x${string}`,
        abi: LOAN_WRAPPER_ABI,
        functionName: "increaseDebt",
        args: [amount]
      });
      setDebtAmount("");
    } catch (error) {
      alert("Increase debt failed: " + (error as Error).message);
    }
  };

  const handleDecreaseDebt = async (userWrapperAddress: string) => {
    if (!debtAmount || debtAmount.trim() === "" || !userWrapperAddress) {
      alert("Please enter debt amount and ensure you have a wrapper");
      return;
    }

    const parsedAmount = parseFloat(debtAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Please enter a valid debt amount greater than 0");
      return;
    }

    try {
      const amount = BigInt(Math.floor(parsedAmount * 1e6));
      
      // First approve USDC spending for the wrapper
      await writeMockUSDC({
        functionName: "approve",
        args: [userWrapperAddress, amount],
      });
      
      await writeWrapper({
        address: userWrapperAddress as `0x${string}`,
        abi: LOAN_WRAPPER_ABI,
        functionName: "decreaseDebt",
        args: [amount]
      });
      setDebtAmount("");
    } catch (error) {
      alert("Decrease debt failed: " + (error as Error).message);
    }
  };

  const handleRepayAllDebt = async (userWrapperAddress: string, totalDebt?: bigint, isLocked?: boolean) => {
    if (!userWrapperAddress) {
      alert("Please ensure you have a wrapper");
      return;
    }

    if (!totalDebt || totalDebt === 0n) {
      alert("No debt to repay.");
      return;
    }

    if (isLocked) {
      alert("Wrapper is locked. Cannot repay debt.");
      return;
    }

    try {
      // First approve USDC spending for the wrapper
      await writeMockUSDC({
        functionName: "approve",
        args: [userWrapperAddress, totalDebt],
      });
      
      await writeWrapper({
        address: userWrapperAddress as `0x${string}`,
        abi: LOAN_WRAPPER_ABI,
        functionName: "repayLoan",
        args: []
      });
    } catch (error) {
      // Parse specific error messages
      const errorMessage = (error as Error).message;
      if (errorMessage.includes("LoanWrapper__AccessDenied")) {
        alert("Access denied: Only Vault can call repayLoan(). Use regular repay instead.");
      } else if (errorMessage.includes("LoanWrapper__NothingToRepay")) {
        alert("Nothing to repay: No debt available.");
      } else {
        alert("Repay all debt failed: " + errorMessage);
      }
    }
  };

  const handleVaultAction = async (action: "injectToLoan" | "withdrawFromLoan" | "liquidate", wrapper: string) => {
    try {
      await writeVault({ functionName: action, args: [wrapper] });
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return {
    // State
    borrowerAddress,
    setBorrowerAddress,
    borrowAmount,
    setBorrowAmount,
    collateralAmount,
    setCollateralAmount,
    createdWrapperAddress,
    debtAmount,
    setDebtAmount,
    collateralManageAmount,
    setCollateralManageAmount,
    
    // Actions
    handleWrapLoan,
    handleMintUSDC,
    handleMintPYUSD,
    handleMintWETH,
    handleDepositToPool,
    handleIncreaseCollateral,
    handleDecreaseCollateral,
    handleIncreaseDebt,
    handleDecreaseDebt,
    handleRepayAllDebt,
    handleVaultAction,
  };
};

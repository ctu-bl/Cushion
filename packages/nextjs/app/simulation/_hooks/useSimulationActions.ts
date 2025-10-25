"use client";

import { useState } from "react";
import type { Address } from "viem";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useWriteContract } from "wagmi";
import { LOAN_WRAPPER_ABI } from "../_constants/abis";

type CtxInfo = { address?: Address } | undefined;

export const useSimulationActions = (
  address?: Address,
  mockUSDCInfo?: CtxInfo,
  mockPoolInfo?: CtxInfo,
) => {
  const [borrowerAddress, setBorrowerAddress] = useState("");
  const [borrowAmount, setBorrowAmount] = useState("");
  const [collateralAmount, setCollateralAmount] = useState("");
  const [createdWrapperAddress, setCreatedWrapperAddress] = useState<Address | "">("");
  const [debtAmount, setDebtAmount] = useState("");
  const [collateralManageAmount, setCollateralManageAmount] = useState("");

  // Scaffold writers
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

  // Dynamic writer for wrapper
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

      await writeRegistry({
        functionName: "wrapLoan",
        args: [address, borrowAmountWei] as const,
        value: collateralAmountWei,
      });

      // refresh placeholder
      setTimeout(() => setCreatedWrapperAddress(""), 2000);
    } catch (error) {
      alert("Transaction failed: " + (error as Error).message);
    }
  };

  const handleMintUSDC = async () => {
    if (!address) {
      alert("Connect wallet first");
      return;
    }
    try {
      await writeMockUSDC({
        functionName: "mint",
        args: [address, BigInt(1000000 * 1e6)] as const, // 1M USDC
      });
    } catch {}
  };

  const handleMintPYUSD = async () => {
    if (!address) {
      alert("Connect wallet first");
      return;
    }
    try {
      await writeMockPYUSD({
        functionName: "mint",
        args: [address, BigInt(1000000 * 1e6)] as const, // 1M PYUSD
      });
    } catch {}
  };

  const handleMintWETH = async () => {
    try {
      await writeMockWETH({
        functionName: "deposit",
        // deposit() bez args, pouze value
        args: undefined,
        value: BigInt(Math.floor(parseFloat(collateralAmount || "0") * 1e18)),
      });
    } catch {}
  };

  const handleDepositToPool = async () => {
    if (!address || !mockPoolInfo?.address || !mockUSDCInfo?.address) {
      alert("Missing addresses (wallet/USDC/Pool).");
      return;
    }
    try {
      // approve USDC for pool
      await writeMockUSDC({
        functionName: "approve",
        // tuple s možnými undefined NIKDY NEPŘEDÁVEJ jako undefined celé args
        args: [mockPoolInfo.address, BigInt(500000 * 1e6)] as const,
      });

      // deposit(asset, amount, onBehalfOf, referralCode)
      await writeMockPool({
        functionName: "deposit",
        args: [mockUSDCInfo.address, BigInt(500000 * 1e6), address, 0] as const,
      });
    } catch {}
  };

  const handleIncreaseCollateral = async (userWrapperAddress: Address, amount?: string) => {
    const ca = amount ?? collateralManageAmount;
    if (!ca || !userWrapperAddress) {
      alert("Please enter collateral amount and ensure you have a wrapper");
      return;
    }
    try {
      const amountBigInt = BigInt(Math.floor(parseFloat(ca) * 1e18));
      await writeWrapper({
        address: userWrapperAddress,
        abi: LOAN_WRAPPER_ABI,
        functionName: "increaseCollateral",
        args: [amountBigInt] as const,
        value: amountBigInt, // send ETH
      });
      setCollateralManageAmount("");
    } catch (error) {
      alert("Increase collateral failed: " + (error as Error).message);
    }
  };

  const handleDecreaseCollateral = async (
    userWrapperAddress: Address,
    isLocked: boolean,
    ownerCollateral?: bigint,
    totalCollateral?: bigint,
    amount?: string,
  ) => {
    const ca = amount ?? collateralManageAmount;
    if (!ca || !userWrapperAddress) {
      alert("Please enter collateral amount and ensure you have a wrapper");
      return;
    }

    try {
      const amt = BigInt(Math.floor(parseFloat(ca) * 1e18));

      if (isLocked) {
        alert("Wrapper is locked. Cannot decrease collateral.");
        return;
      }
      if (ownerCollateral && amt > ownerCollateral) {
        alert(`Cannot decrease more than your collateral. You have ${(Number(ownerCollateral) / 1e18).toFixed(4)} ETH.`);
        return;
      }
      if (amt <= 0n) {
        alert("Amount must be greater than 0");
        return;
      }
      if (!totalCollateral || totalCollateral === 0n) {
        alert("No collateral available to decrease.");
        return;
      }

      await writeWrapper({
        address: userWrapperAddress,
        abi: LOAN_WRAPPER_ABI,
        functionName: "decreaseCollateral",
        args: [amt] as const,
        value: 0n,
      });
      setCollateralManageAmount("");
    } catch (error) {
      const m = (error as Error).message;
      if (m.includes("LoanWrapper__InvalidAmount")) {
        alert("Invalid amount: Cannot decrease more collateral than you have.");
      } else if (m.includes("LoanWrapper__BreaksHealthFactor")) {
        alert("Health Factor too low: Decreasing collateral would make the position unsafe.");
      } else if (m.includes("LoanWrapper__WrapperNotUnlocked")) {
        alert("Wrapper is locked: Cannot decrease collateral when locked.");
      } else if (m.includes("LoanWrapper__WithdrawFailed")) {
        alert("Withdraw failed: Could not send ETH back to you.");
      } else {
        alert("Decrease collateral failed: " + m);
      }
    }
  };

  const handleIncreaseDebt = async (userWrapperAddress: Address, amount?: string) => {
    const value = amount ?? debtAmount;
    if (!value || !userWrapperAddress) {
      alert("Please enter debt amount and ensure you have a wrapper");
      return;
    }
    try {
      const amountBigInt = BigInt(Math.floor(parseFloat(value) * 1e6));
      await writeWrapper({
        address: userWrapperAddress,
        abi: LOAN_WRAPPER_ABI,
        functionName: "increaseDebt",
        args: [amountBigInt] as const,
      });
      setDebtAmount("");
    } catch (error) {
      alert("Increase debt failed: " + (error as Error).message);
    }
  };

  const handleDecreaseDebt = async (userWrapperAddress: Address, amount?: string) => {
    const value = amount ?? debtAmount;
    if (!value?.trim() || !userWrapperAddress) {
      alert("Please enter debt amount and ensure you have a wrapper");
      return;
    }

    const parsed = parseFloat(value);
    if (isNaN(parsed) || parsed <= 0) {
      alert("Please enter a valid debt amount greater than 0");
      return;
    }

    try {
      const amountBigInt = BigInt(Math.floor(parsed * 1e6));

      // approve USDC for wrapper (args vždy tuple)
      await writeMockUSDC({
        functionName: "approve",
        args: [userWrapperAddress, amountBigInt] as const,
      });

      await writeWrapper({
        address: userWrapperAddress,
        abi: LOAN_WRAPPER_ABI,
        functionName: "decreaseDebt",
        args: [amountBigInt] as const,
      });
      setDebtAmount("");
    } catch (error) {
      alert("Decrease debt failed: " + (error as Error).message);
    }
  };

  const handleRepayAllDebt = async (userWrapperAddress: Address, totalDebt?: bigint, isLocked?: boolean) => {
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
      await writeMockUSDC({
        functionName: "approve",
        args: [userWrapperAddress, totalDebt] as const,
      });

      await writeWrapper({
        address: userWrapperAddress,
        abi: LOAN_WRAPPER_ABI,
        functionName: "repayLoan",
        args: [] as const,
      });
    } catch (error) {
      const m = (error as Error).message;
      if (m.includes("LoanWrapper__AccessDenied")) {
        alert("Access denied: Only Vault can call repayLoan(). Use regular repay instead.");
      } else if (m.includes("LoanWrapper__NothingToRepay")) {
        alert("Nothing to repay: No debt available.");
      } else {
        alert("Repay all debt failed: " + m);
      }
    }
  };

  const handleVaultAction = async (
    action: "injectToLoan" | "withdrawFromLoan" | "liquidate",
    wrapper: Address,
  ) => {
    try {
      await writeVault({ functionName: action, args: [wrapper] as const });
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

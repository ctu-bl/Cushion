"use client";

import { useState } from "react";
import { useWriteContract } from "wagmi";

export const useVaultActions = (
  PYUSD_ADDRESS?: string,
  VAULT_ADDRESS?: string,
  mockPYUSDInfo?: any,
  vaultInfo?: any,
  address?: string
) => {
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [approveAmount, setApproveAmount] = useState("1");

  const { writeContractAsync } = useWriteContract();

  const handleDeposit = async () => {
    if (!VAULT_ADDRESS || !vaultInfo?.abi || !address) {
      throw new Error("Missing required contract information or user address");
    }
    
    try {
      const amount = parseFloat(depositAmount) * 1000000; // Convert to 6 decimals
      const hash = await writeContractAsync({
        address: VAULT_ADDRESS as `0x${string}`,
        abi: vaultInfo.abi,
        functionName: "deposit",
        args: [BigInt(amount), address as `0x${string}`],
      });
      return hash;
    } catch (error) {
      throw error;
    }
  };

  const handleWithdraw = async () => {
    if (!VAULT_ADDRESS || !vaultInfo?.abi || !address) {
      throw new Error("Missing required contract information or user address");
    }
    
    try {
      const amount = parseFloat(withdrawAmount) * 1000000; // Convert to 6 decimals
      
      // Use withdrawAmount function from Vault contract
      const hash = await writeContractAsync({
        address: VAULT_ADDRESS as `0x${string}`,
        abi: vaultInfo.abi,
        functionName: "withdraw",
        args: [BigInt(amount), address as `0x${string}`, address as `0x${string}`],
      });
      return hash;
    } catch (error) {
      throw error;
    }
  };

  const handleApprove = async () => {
    if (!PYUSD_ADDRESS || !mockPYUSDInfo?.abi || !VAULT_ADDRESS) {
      throw new Error("Missing required contract information");
    }
    
    try {
      const amount = parseFloat(approveAmount) * 1000000; // Convert to 6 decimals
      const hash = await writeContractAsync({
        address: PYUSD_ADDRESS as `0x${string}`,
        abi: mockPYUSDInfo.abi,
        functionName: "approve",
        args: [VAULT_ADDRESS as `0x${string}`, BigInt(amount)],
      });
      return hash;
    } catch (error) {
      throw error;
    }
  };

  return {
    // State
    depositAmount,
    setDepositAmount,
    withdrawAmount,
    setWithdrawAmount,
    approveAmount,
    setApproveAmount,
    
    // Actions
    handleDeposit,
    handleWithdraw,
    handleApprove,
  };
};

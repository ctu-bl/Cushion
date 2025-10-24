"use client";

import { useReadContract } from "wagmi";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { useAccount } from "wagmi";

export const useVaultData = () => {
  const { address } = useAccount();

  // Get deployed contract addresses
  const { data: mockPYUSDInfo } = useDeployedContractInfo("MockPYUSD");
  const { data: vaultInfo } = useDeployedContractInfo("Vault");
  
  const PYUSD_ADDRESS = mockPYUSDInfo?.address;
  const VAULT_ADDRESS = vaultInfo?.address;

  // Read PYUSD balance
  const { data: pyusdBalance, refetch: refetchPyusdBalance } = useReadContract({
    address: PYUSD_ADDRESS,
    abi: mockPYUSDInfo?.abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!PYUSD_ADDRESS,
    },
  });

  // Read Vault total assets
  const { data: vaultTotalAssets, refetch: refetchVaultTotalAssets } = useReadContract({
    address: VAULT_ADDRESS,
    abi: vaultInfo?.abi,
    functionName: "totalAssets",
    query: {
      enabled: !!VAULT_ADDRESS,
    },
  });

  // Read user's Vault shares
  const { data: userVaultShares, refetch: refetchUserVaultShares } = useReadContract({
    address: VAULT_ADDRESS,
    abi: vaultInfo?.abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!VAULT_ADDRESS,
    },
  });

  // Convert user's shares to assets
  const { data: userVaultAssets, refetch: refetchUserVaultAssets } = useReadContract({
    address: VAULT_ADDRESS,
    abi: vaultInfo?.abi,
    functionName: "convertToAssets",
    args: userVaultShares ? [userVaultShares] : undefined,
    query: {
      enabled: !!userVaultShares && !!VAULT_ADDRESS,
    },
  });

  // Format PYUSD balance (6 decimals)
  const formatPyusdBalance = (balance: bigint | undefined) => {
    if (!balance) return "0.00";
    const formatted = Number(balance) / 1000000; // Convert from 6 decimals
    return formatted.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const userBalance = formatPyusdBalance(pyusdBalance as bigint | undefined);
  const totalVaultAmount = formatPyusdBalance(vaultTotalAssets as bigint | undefined);
  const userVaultBalance = formatPyusdBalance(userVaultAssets as bigint | undefined);

  // Function to refresh all balances
  const refreshAllBalances = async () => {
    await Promise.all([
      refetchPyusdBalance(),
      refetchVaultTotalAssets(),
      refetchUserVaultShares(),
      refetchUserVaultAssets(),
    ]);
  };

  return {
    address,
    PYUSD_ADDRESS,
    VAULT_ADDRESS,
    mockPYUSDInfo,
    vaultInfo,
    userBalance,
    totalVaultAmount,
    userVaultBalance,
    refreshAllBalances,
  };
};

"use client";

import { useScaffoldReadContract, useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { useAccount } from "wagmi";
import type { Address } from "viem";

export const useSimulationData = () => {
  const { address, isConnected } = useAccount();

  // Load deployed mock addresses dynamically
  const { data: mockUSDCInfo } = useDeployedContractInfo("MockUSDC");
  const { data: mockPYUSDInfo } = useDeployedContractInfo("MockPYUSD");
  const { data: mockWETHInfo } = useDeployedContractInfo("MockWETH");
  const { data: mockPoolInfo } = useDeployedContractInfo("MockPool");

  // Registry data
  const { data: registryAddress } = useScaffoldReadContract({
    contractName: "LoanWrapperRegistry",
    functionName: "provider",
  });

  const { data: allWrappers } = useScaffoldReadContract({
    contractName: "LoanWrapperRegistry",
    functionName: "getAllWrappers",
  });

  // User balances — vždy tuple; případně řídit enabled, pokud hook podporuje
  const { data: mockUSDCBalance } = useScaffoldReadContract({
    contractName: "MockUSDC",
    functionName: "balanceOf",
    args: [address as Address | undefined] as const,
    // query: { enabled: isConnected }, // odkomentuj, pokud useScaffoldReadContract podporuje
  });

  const { data: mockPYUSDBalance } = useScaffoldReadContract({
    contractName: "MockPYUSD",
    functionName: "balanceOf",
    args: [address as Address | undefined] as const,
    // query: { enabled: isConnected },
  });

  const { data: mockWETHBalance } = useScaffoldReadContract({
    contractName: "MockWETH",
    functionName: "balance", // nebo "balanceOf" podle tvého ABI
    args: [address as Address | undefined] as const,
    // query: { enabled: isConnected },
  });

  // Pool asset balances — opět vždy tuple
  const { data: poolUSDCBalance } = useScaffoldReadContract({
    contractName: "MockUSDC",
    functionName: "balanceOf",
    args: [mockPoolInfo?.address as Address | undefined] as const,
  });

  const { data: poolWETHBalance } = useScaffoldReadContract({
    contractName: "MockWETH",
    functionName: "balance",
    args: [mockPoolInfo?.address as Address | undefined] as const,
  });

  // Get wrapper for current user
  const { data: userWrapperAddress } = useScaffoldReadContract({
    contractName: "LoanWrapperRegistry",
    functionName: "wrapperOf",
    args: [address as Address | undefined] as const,
    // query: { enabled: isConnected },
  });

  return {
    address,
    mockUSDCInfo,
    mockPYUSDInfo,
    mockWETHInfo,
    mockPoolInfo,
    registryAddress,
    allWrappers,
    mockUSDCBalance,
    mockPYUSDBalance,
    mockWETHBalance,
    poolUSDCBalance,
    poolWETHBalance,
    userWrapperAddress,
  };
};

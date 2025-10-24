"use client";

import { useScaffoldReadContract, useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { useAccount } from "wagmi";

export const useSimulationData = () => {
  const { address } = useAccount();

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

  // User balances
  const { data: mockUSDCBalance } = useScaffoldReadContract({
    contractName: "MockUSDC",
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  const { data: mockPYUSDBalance } = useScaffoldReadContract({
    contractName: "MockPYUSD",
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  const { data: mockWETHBalance } = useScaffoldReadContract({
    contractName: "MockWETH",
    functionName: "balance", 
    args: address ? [address] : undefined,
  });

  // Pool asset balances
  const { data: poolUSDCBalance } = useScaffoldReadContract({
    contractName: "MockUSDC",
    functionName: "balanceOf",
    args: mockPoolInfo?.address ? [mockPoolInfo.address] : undefined,
  });

  const { data: poolWETHBalance } = useScaffoldReadContract({
    contractName: "MockWETH",
    functionName: "balance",
    args: mockPoolInfo?.address ? [mockPoolInfo.address] : undefined,
  });

  // Get wrapper for current user
  const { data: userWrapperAddress } = useScaffoldReadContract({
    contractName: "LoanWrapperRegistry",
    functionName: "wrapperOf",
    args: address ? [address] : undefined,
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

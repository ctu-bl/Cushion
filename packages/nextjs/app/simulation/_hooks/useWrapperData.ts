"use client";

import { useReadContract } from "wagmi";
import LoanWrapperArtifact from "../../../../hardhat/artifacts/contracts/LoanWrapper.sol/LoanWrapper.json";

export const useWrapperData = (userWrapperAddress?: string) => {
  // Get wrapper details - using dynamic contract calls
  const { data: totalCollateral } = useReadContract({
    functionName: "getTotalCollateralValue",
    address: userWrapperAddress as `0x${string}`,
    abi: LoanWrapperArtifact.abi,
    args: [],
  });

  const { data: totalDebt } = useReadContract({
    functionName: "getTotalDebtValue",
    address: userWrapperAddress as `0x${string}`,
    abi: LoanWrapperArtifact.abi,
    args: [],
  });

  const { data: ownerCollateral } = useReadContract({
    functionName: "getOwnerCollateralValue",
    address: userWrapperAddress as `0x${string}`,
    abi: LoanWrapperArtifact.abi,
    args: [],
  });

  const { data: investorCollateral } = useReadContract({
    functionName: "getInvestorCollateralValue",
    address: userWrapperAddress as `0x${string}`,
    abi: LoanWrapperArtifact.abi,
    args: [],
  });

  const { data: isLocked } = useReadContract({
    functionName: "isLocked",
    address: userWrapperAddress as `0x${string}`,
    abi: LoanWrapperArtifact.abi,
    args: [],
  });

  // Health Factor (from Registry helper) - using deployedContracts for Registry
  const { data: healthFactor } = useReadContract({
    functionName: "getHF",
    address: "0x0E801D84Fa97b50751Dbf25036d067dCf18858bF" as `0x${string}`, // Registry address
    abi: LoanWrapperArtifact.abi, // Using same ABI for now
    args: userWrapperAddress ? [userWrapperAddress] : undefined,
  });

  return {
    totalCollateral,
    totalDebt,
    ownerCollateral,
    investorCollateral,
    isLocked,
    healthFactor,
  };
};

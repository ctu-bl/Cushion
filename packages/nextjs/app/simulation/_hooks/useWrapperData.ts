"use client";

import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { LOAN_WRAPPER_ABI } from "../_constants/abis";

export const useWrapperData = (userWrapperAddress?: string) => {
  // Get wrapper details - using dynamic contract calls
  const { data: totalCollateral } = useScaffoldReadContract({
    contractName: "LoanWrapper",
    functionName: "getTotalCollateralValue",
    address: userWrapperAddress as `0x${string}`,
    abi: LOAN_WRAPPER_ABI,
    args: [],
  });

  const { data: totalDebt } = useScaffoldReadContract({
    contractName: "LoanWrapper", 
    functionName: "getTotalDebtValue",
    address: userWrapperAddress as `0x${string}`,
    abi: LOAN_WRAPPER_ABI,
    args: [],
  });

  const { data: ownerCollateral } = useScaffoldReadContract({
    contractName: "LoanWrapper",
    functionName: "getOwnerCollateralValue",
    address: userWrapperAddress as `0x${string}`,
    abi: LOAN_WRAPPER_ABI,
    args: [],
  });

  const { data: investorCollateral } = useScaffoldReadContract({
    contractName: "LoanWrapper",
    functionName: "getInvestorCollateralValue",
    address: userWrapperAddress as `0x${string}`,
    abi: LOAN_WRAPPER_ABI,
    args: [],
  });

  const { data: isLocked } = useScaffoldReadContract({
    contractName: "LoanWrapper",
    functionName: "isLocked",
    address: userWrapperAddress as `0x${string}`,
    abi: LOAN_WRAPPER_ABI,
    args: [],
  });

  // Health Factor (from Registry helper)
  const { data: healthFactor } = useScaffoldReadContract({
    contractName: "LoanWrapperRegistry",
    functionName: "getHF",
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

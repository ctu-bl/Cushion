"use client";

import { useReadContract } from "wagmi";
import type { Address } from "viem";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { LOAN_WRAPPER_ABI } from "../_constants/abis";

const LOAN_WRAPPER_REGISTRY_NAME = "LoanWrapperRegistry" as const;

export const useWrapperData = (userWrapperAddress?: Address) => {
  const enabled = Boolean(userWrapperAddress);

  const { data: totalCollateral } = useReadContract({
    address: userWrapperAddress,
    abi: LOAN_WRAPPER_ABI,
    functionName: "getTotalCollateralValue",
    args: [],
    query: { enabled },
  });

  const { data: totalDebt } = useReadContract({
    address: userWrapperAddress,
    abi: LOAN_WRAPPER_ABI,
    functionName: "getTotalDebtValue",
    args: [],
    query: { enabled },
  });

  const { data: ownerCollateral } = useReadContract({
    address: userWrapperAddress,
    abi: LOAN_WRAPPER_ABI,
    functionName: "getOwnerCollateralValue",
    args: [],
    query: { enabled },
  });

  const { data: investorCollateral } = useReadContract({
    address: userWrapperAddress,
    abi: LOAN_WRAPPER_ABI,
    functionName: "getInvestorCollateralValue",
    args: [],
    query: { enabled },
  });

  const { data: isLocked } = useReadContract({
    address: userWrapperAddress,
    abi: LOAN_WRAPPER_ABI,
    functionName: "isLocked",
    args: [],
    query: { enabled },
  });

  // ---- Health Factor z registry (tohle necháme na scaffold hooku) ----
  const { data: healthFactor } = useScaffoldReadContract({
    contractName: LOAN_WRAPPER_REGISTRY_NAME,
    functionName: "getHF",
    // vždy tuple, ne undefined pro celé args:
    args: [userWrapperAddress ?? undefined] as const,
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

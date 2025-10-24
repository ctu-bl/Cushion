"use client";

import { useState, useEffect } from "react";
import { useWaitForTransactionReceipt } from "wagmi";

export const useVaultModals = (refreshAllBalances: () => Promise<void>) => {
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  
  const [approveTxHash, setApproveTxHash] = useState<string | undefined>();
  const [approveError, setApproveError] = useState<string | undefined>();
  const [depositTxHash, setDepositTxHash] = useState<string | undefined>();
  const [depositError, setDepositError] = useState<string | undefined>();
  const [withdrawTxHash, setWithdrawTxHash] = useState<string | undefined>();
  const [withdrawError, setWithdrawError] = useState<string | undefined>();

  // Wait for transactions
  const { isLoading: isApproveLoading, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveTxHash as `0x${string}`,
  });

  const { isLoading: isDepositLoading, isSuccess: isDepositSuccess } = useWaitForTransactionReceipt({
    hash: depositTxHash as `0x${string}`,
  });

  const { isLoading: isWithdrawLoading, isSuccess: isWithdrawSuccess } = useWaitForTransactionReceipt({
    hash: withdrawTxHash as `0x${string}`,
  });

  // Auto-hide success message after 3 seconds and refresh balances
  useEffect(() => {
    if (isApproveSuccess) {
      refreshAllBalances();
      const timer = setTimeout(() => {
        setApproveTxHash(undefined);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isApproveSuccess, refreshAllBalances]);

  // Auto-hide error message after 3 seconds
  useEffect(() => {
    if (approveError) {
      const timer = setTimeout(() => {
        setApproveError(undefined);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [approveError]);

  // Auto-hide deposit success message after 3 seconds and refresh balances
  useEffect(() => {
    if (isDepositSuccess) {
      // Immediate refresh
      refreshAllBalances();
      // Additional refresh after 1 second to ensure data is updated
      setTimeout(() => refreshAllBalances(), 1000);
      const timer = setTimeout(() => {
        setDepositTxHash(undefined);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isDepositSuccess, refreshAllBalances]);

  // Auto-hide deposit error message after 3 seconds
  useEffect(() => {
    if (depositError) {
      const timer = setTimeout(() => {
        setDepositError(undefined);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [depositError]);

  // Auto-hide withdraw success message after 3 seconds and refresh balances
  useEffect(() => {
    if (isWithdrawSuccess) {
      // Immediate refresh
      refreshAllBalances();
      // Additional refresh after 1 second to ensure data is updated
      setTimeout(() => refreshAllBalances(), 1000);
      const timer = setTimeout(() => {
        setWithdrawTxHash(undefined);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isWithdrawSuccess, refreshAllBalances]);

  // Auto-hide withdraw error message after 3 seconds
  useEffect(() => {
    if (withdrawError) {
      const timer = setTimeout(() => {
        setWithdrawError(undefined);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [withdrawError]);

  return {
    // Modal states
    showDepositModal,
    setShowDepositModal,
    showWithdrawModal,
    setShowWithdrawModal,
    showApproveModal,
    setShowApproveModal,
    
    // Transaction states
    approveTxHash,
    setApproveTxHash,
    approveError,
    setApproveError,
    depositTxHash,
    setDepositTxHash,
    depositError,
    setDepositError,
    withdrawTxHash,
    setWithdrawTxHash,
    withdrawError,
    setWithdrawError,
    
    // Loading states
    isApproveLoading,
    isApproveSuccess,
    isDepositLoading,
    isDepositSuccess,
    isWithdrawLoading,
    isWithdrawSuccess,
  };
};

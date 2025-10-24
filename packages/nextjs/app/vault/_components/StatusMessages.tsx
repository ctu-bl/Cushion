"use client";

import React from "react";
import { GlobalSuccessBar } from "../../_components/GlobalSuccessBar";

type StatusMessagesProps = {
  isApproveSuccess: boolean;
  approveAmount: string;
  onApproveClose: () => void;
  approveError?: string;
  onApproveErrorClose: () => void;
  isDepositSuccess: boolean;
  depositAmount: string;
  onDepositClose: () => void;
  depositError?: string;
  onDepositErrorClose: () => void;
  isWithdrawSuccess: boolean;
  withdrawAmount: string;
  onWithdrawClose: () => void;
  withdrawError?: string;
  onWithdrawErrorClose: () => void;
};

export const StatusMessages: React.FC<StatusMessagesProps> = ({
  isApproveSuccess,
  approveAmount,
  onApproveClose,
  approveError,
  onApproveErrorClose,
  isDepositSuccess,
  depositAmount,
  onDepositClose,
  depositError,
  onDepositErrorClose,
  isWithdrawSuccess,
  withdrawAmount,
  onWithdrawClose,
  withdrawError,
  onWithdrawErrorClose,
}) => {
  return (
    <>
      <GlobalSuccessBar
        message={`Successfully approved ${approveAmount} PYUSD!`}
        isVisible={isApproveSuccess}
        onClose={onApproveClose}
      />

      {approveError && (
        <div className="bg-red-500 text-white p-4 text-center mb-6 rounded-lg">
          <div className="flex items-center justify-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Error: {approveError}</span>
            <button onClick={onApproveErrorClose} className="ml-4 text-white hover:text-gray-200">
              ✕
            </button>
          </div>
        </div>
      )}

      <GlobalSuccessBar
        message={`Successfully deposited ${depositAmount} PYUSD!`}
        isVisible={isDepositSuccess}
        onClose={onDepositClose}
      />

      {depositError && (
        <div className="bg-red-500 text-white p-4 text-center mb-6 rounded-lg">
          <div className="flex items-center justify-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Error: {depositError}</span>
            <button onClick={onDepositErrorClose} className="ml-4 text-white hover:text-gray-200">
              ✕
            </button>
          </div>
        </div>
      )}

      <GlobalSuccessBar
        message={`Successfully withdrew ${withdrawAmount} PYUSD!`}
        isVisible={isWithdrawSuccess}
        onClose={onWithdrawClose}
      />

      {withdrawError && (
        <div className="bg-red-500 text-white p-4 text-center mb-6 rounded-lg">
          <div className="flex items-center justify-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Error: {withdrawError}</span>
            <button onClick={onWithdrawErrorClose} className="ml-4 text-white hover:text-gray-200">
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default StatusMessages;

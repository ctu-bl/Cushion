"use client";

import React from "react";

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
      {isApproveSuccess && (
        <div className="bg-green-500 text-white p-4 text-center mb-6 rounded-lg">
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Successfully approved {approveAmount} PYUSD!</span>
            <button
              onClick={onApproveClose}
              className="ml-4 text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}

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

      {isDepositSuccess && (
        <div className="bg-green-500 text-white p-4 text-center mb-6 rounded-lg">
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Successfully deposited {depositAmount} PYUSD!</span>
            <button
              onClick={onDepositClose}
              className="ml-4 text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}

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

      {isWithdrawSuccess && (
        <div className="bg-green-500 text-white p-4 text-center mb-6 rounded-lg">
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Successfully withdrew {withdrawAmount} PYUSD!</span>
            <button
              onClick={onWithdrawClose}
              className="ml-4 text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}

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

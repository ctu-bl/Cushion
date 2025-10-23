"use client";

import React from "react";

type BalanceCardsProps = {
  totalVaultAmount: string;
  userBalance: string;
  userVaultBalance: string;
  isConnected: boolean;
  onApprove: () => void;
  onDeposit: () => void;
  onWithdraw: () => void;
};

export const BalanceCards: React.FC<BalanceCardsProps> = ({
  totalVaultAmount,
  userBalance,
  userVaultBalance,
  isConnected,
  onApprove,
  onDeposit,
  onWithdraw,
}) => {
  return (
    <>
      <div className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-xl p-8 mb-8 min-h-[200px] flex items-center justify-center hover:shadow-2xl transition-all duration-300">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4 text-base-content/70">Total Vault Balance</h2>
          <div className="text-6xl font-bold text-base-content mb-2">{totalVaultAmount}</div>
          <div className="text-xl text-base-content/60 mb-4">pyUSD</div>
          <div className="flex items-center justify-center gap-2 text-sm text-success">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span>Growing with 5% APY</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4 text-base-content">Your PYUSD Balance</h3>
            <div className="text-4xl font-bold text-white mb-2">{userBalance}</div>
            <div className="text-lg text-base-content/60 mb-4">pyUSD</div>
            <div className="badge badge-primary badge-lg gap-1 px-4 py-2">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                  clipRule="evenodd"
                />
              </svg>
              Wallet
            </div>
          </div>
        </div>

        <div className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4 text-base-content">Your Vault Balance</h3>
            <div className="text-4xl font-bold text-secondary mb-2">{userVaultBalance}</div>
            <div className="text-lg text-base-content/60 mb-4">pyUSD</div>
            <div className="badge badge-secondary badge-lg gap-1 px-4 py-2">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              15% APY
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-6 mb-8">
        <button
          className="btn btn-secondary btn-lg px-8 gap-2 hover:scale-105 transition-all duration-200"
          onClick={onApprove}
          disabled={!isConnected}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Approve
        </button>

        <button
          className="btn btn-primary btn-lg px-8 gap-2 hover:scale-105 transition-all duration-200"
          onClick={onDeposit}
          disabled={!isConnected}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Deposit
        </button>

        <button
          className="btn btn-outline border-base-content/20 hover:bg-base-100 text-base-content btn-lg px-8 gap-2 hover:scale-105 transition-all duration-200"
          onClick={onWithdraw}
          disabled={!isConnected}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4m16 0l-4-4m4 4l-4 4" />
          </svg>
          Withdraw
        </button>
      </div>

      {!isConnected && (
        <div className="alert alert-warning mt-6 max-w-md mx-auto">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <span>Please connect your wallet to interact with the vault</span>
        </div>
      )}
    </>
  );
};

export default BalanceCards;

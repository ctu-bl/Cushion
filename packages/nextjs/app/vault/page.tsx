"use client";

import { useState } from "react";
import { useAccount } from "wagmi";

export default function VaultPage() {
  const { isConnected } = useAccount();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const totalVaultAmount = "1,234,567.89";
  const userBalance = "5,000.00";
  const interestRate = 15;

  const handleDeposit = () => {
    console.log("Depositing:", depositAmount);
    setShowDepositModal(false);
    setDepositAmount("");
  };

  const handleWithdraw = () => {
    console.log("Withdrawing:", withdrawAmount);
    setShowWithdrawModal(false);
    setWithdrawAmount("");
  };

  return (
    <main className="container mx-auto py-12 px-4 md:px-8">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4">Vault</h1>
        <p className="text-lg text-base-content/70">Manage your pyUSD deposits and earn interest</p>
      </div>

      <div className="card bg-base-100 rounded-2xl border border-base-300/60 shadow-sm p-8 mb-8 min-h-[200px] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4 text-base-content/70">Total Vault Balance</h2>
          <div className="text-6xl font-bold text-primary mb-2">{totalVaultAmount}</div>
          <div className="text-xl text-base-content/60">pyUSD</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card bg-base-100 rounded-2xl border border-base-300/60 shadow-sm p-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4">Your Balance</h3>
            <div className="text-4xl font-bold text-primary mb-2">{userBalance}</div>
            <div className="text-lg text-base-content/60 mb-4">pyUSD</div>
            <div className="badge badge-primary badge-lg">{interestRate}% APY</div>
          </div>
        </div>

        <div className="card bg-base-100 rounded-2xl border border-base-300/60 shadow-sm p-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4">Additional Info</h3>
            <div className="text-base-content/70">
              <p>text</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-6">
        <button
          className="btn btn-primary btn-lg px-8"
          onClick={() => setShowDepositModal(true)}
          disabled={!isConnected}
        >
          Deposit
        </button>

        <button
          className="btn btn-outline btn-lg px-8"
          onClick={() => setShowWithdrawModal(true)}
          disabled={!isConnected}
        >
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

      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="card bg-base-100 rounded-2xl border border-base-300/60 shadow-xl w-full max-w-md p-6">
            <h3 className="text-2xl font-bold mb-4">Deposit pyUSD</h3>
            <p className="text-base-content/70 mb-6">Enter the amount you want to deposit into the vault</p>

            <label className="form-control w-full mb-6">
              <span className="label-text mb-2 text-lg font-semibold">Amount (pyUSD)</span>
              <input
                type="number"
                value={depositAmount}
                onChange={e => setDepositAmount(e.target.value)}
                placeholder="0.00"
                className="input input-bordered w-full text-lg"
                step="0.01"
                min="0"
              />
            </label>

            <div className="flex justify-end gap-3">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowDepositModal(false);
                  setDepositAmount("");
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleDeposit}
                disabled={!depositAmount || parseFloat(depositAmount) <= 0}
              >
                Deposit
              </button>
            </div>
          </div>
        </div>
      )}

      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="card bg-base-100 rounded-2xl border border-base-300/60 shadow-xl w-full max-w-md p-6">
            <h3 className="text-2xl font-bold mb-4">Withdraw pyUSD</h3>
            <p className="text-base-content/70 mb-6">Enter the amount you want to withdraw from the vault</p>

            <label className="form-control w-full mb-6">
              <span className="label-text mb-2 text-lg font-semibold">Amount (pyUSD)</span>
              <input
                type="number"
                value={withdrawAmount}
                onChange={e => setWithdrawAmount(e.target.value)}
                placeholder="0.00"
                className="input input-bordered w-full text-lg"
                step="0.01"
                min="0"
                max={userBalance.replace(/,/g, "")}
              />
            </label>

            <div className="text-sm text-base-content/60 mb-4">Available: {userBalance} pyUSD</div>

            <div className="flex justify-end gap-3">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowWithdrawModal(false);
                  setWithdrawAmount("");
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-outline"
                onClick={handleWithdraw}
                disabled={
                  !withdrawAmount ||
                  parseFloat(withdrawAmount) <= 0 ||
                  parseFloat(withdrawAmount) > parseFloat(userBalance.replace(/,/g, ""))
                }
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

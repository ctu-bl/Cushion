"use client";

import React from "react";

type DepositModalProps = {
  isOpen: boolean;
  onClose: () => void;
  depositAmount: string;
  setDepositAmount: (value: string) => void;
  onDeposit: () => void;
  isLoading: boolean;
  userBalance: string;
  userVaultBalance: string;
};

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  depositAmount,
  setDepositAmount,
  onDeposit,
  isLoading,
  userBalance,
  userVaultBalance,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-xl w-full max-w-md p-6">
        <h3 className="text-2xl font-bold mb-4 text-base-content">Deposit pyUSD</h3>
        <p className="text-base-content/70 mb-6">Enter the amount you want to deposit into the vault</p>

        <label className="form-control w-full mb-6">
          <span className="label-text mb-2 text-lg font-semibold text-base-content">Amount (pyUSD)</span>
          <input
            type="number"
            value={depositAmount}
            onChange={e => setDepositAmount(e.target.value)}
            placeholder="0.00"
            className="input input-bordered w-full text-lg bg-base-200 text-base-content"
            step="0.01"
            min="0"
          />
        </label>

        <div className="text-sm text-base-content/60 mb-4">
          <div>Available: {userVaultBalance} pyUSD</div>
          <div>In Wallet: {userBalance} pyUSD</div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            className="btn btn-ghost text-white"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={onDeposit}
            disabled={!depositAmount || parseFloat(depositAmount) <= 0 || isLoading}
          >
            {isLoading ? "Depositing..." : "Deposit"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DepositModal;

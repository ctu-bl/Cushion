"use client";

import React from "react";

type TakeInsuranceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onTakeInsurance: () => void;
  aaveLoanAddress: string;
  setAaveLoanAddress: (value: string) => void;
};

export const TakeInsuranceModal: React.FC<TakeInsuranceModalProps> = ({
  isOpen,
  onClose,
  onTakeInsurance,
  aaveLoanAddress,
  setAaveLoanAddress,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold mb-2 text-base-content">Take insurance</h3>
        <p className="text-base-content/70 mb-4">Enter your Aave loan address and confirm payment.</p>
        <label className="form-control w-full mb-4">
          <span className="label-text mb-1 text-base-content">Aave loan address</span>
          <input
            type="text"
            value={aaveLoanAddress}
            onChange={e => setAaveLoanAddress(e.target.value)}
            placeholder="0x..."
            className="input input-bordered w-full bg-base-200 text-base-content"
          />
        </label>
        <div className="flex justify-end gap-3">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={onTakeInsurance}
          >
            Pay
          </button>
        </div>
      </div>
    </div>
  );
};

export default TakeInsuranceModal;

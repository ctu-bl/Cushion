"use client";

import React, { useRef, useEffect } from "react";

type ApproveModalProps = {
  isOpen: boolean;
  onClose: () => void;
  approveAmount: string;
  setApproveAmount: (value: string) => void;
  onApprove: () => void;
  isLoading: boolean;
  isSuccess: boolean;
};

export const ApproveModal: React.FC<ApproveModalProps> = ({
  isOpen,
  onClose,
  approveAmount,
  setApproveAmount,
  onApprove,
  isLoading,
  isSuccess,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div ref={modalRef} className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-xl w-full max-w-md p-6">
        <h3 className="text-2xl font-bold mb-4 text-base-content">Approve pyUSD</h3>
        <p className="text-base-content/70 mb-6">Allow the vault to spend your pyUSD tokens</p>

        <label className="form-control w-full mb-6">
          <span className="label-text mb-2 text-lg font-semibold text-base-content">Amount (pyUSD)</span>
          <input
            type="number"
            value={approveAmount}
            onChange={e => setApproveAmount(e.target.value)}
            placeholder="1.00"
            className="input input-bordered w-full text-lg bg-base-200 text-base-content"
            step="0.01"
            min="0"
          />
        </label>

        <div className="text-sm text-base-content/60 mb-4">
          This will approve the vault to spend {approveAmount} pyUSD on your behalf
        </div>

        <div className="flex justify-end gap-3">
          <button
            className="btn btn-ghost text-white"
            onClick={onClose}
          >
            {isSuccess ? "Close" : "Cancel"}
          </button>
          <button
            className="btn btn-primary"
            onClick={onApprove}
            disabled={!approveAmount || parseFloat(approveAmount) <= 0 || isLoading}
          >
            {isLoading ? "Approving..." : "Approve"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApproveModal;

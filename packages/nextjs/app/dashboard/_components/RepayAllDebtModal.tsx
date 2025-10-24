import React, { useRef, useEffect } from "react";

interface RepayAllDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRepayAllDebt: () => void;
  isLoading?: boolean;
  totalDebt?: string;
}

export const RepayAllDebtModal: React.FC<RepayAllDebtModalProps> = ({
  isOpen,
  onClose,
  onRepayAllDebt,
  isLoading = false,
  totalDebt = "0"
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

  const handleSubmit = () => {
    onRepayAllDebt();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div ref={modalRef} className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Repay All Debt</h2>
          <button 
            onClick={onClose}
            className="btn btn-ghost btn-sm text-white hover:bg-base-200"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-warning" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold text-warning">Warning</span>
            </div>
            <p className="text-sm text-white/80">
              This will repay all outstanding debt. This action cannot be undone.
            </p>
          </div>

          <div className="bg-base-200/50 rounded-lg p-4">
            <div className="text-sm text-white/80 mb-2">
              <span className="font-semibold">Total Debt:</span> {totalDebt} USDC
            </div>
            <div className="text-sm text-white/80">
              <span className="font-semibold">Available Balance:</span> {totalDebt} USDC
            </div>
          </div>

          <div className="flex gap-3">
            <button
              className="btn btn-ghost flex-1 text-white"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="btn btn-success flex-1"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? "Repaying All..." : "Repay All Debt"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useRef, useEffect } from "react";

interface LoanDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  loanData?: {
    healthFactor?: string;
    totalCollateral?: string;
    totalDebt?: string;
    ownerCollateral?: string;
    investorCollateral?: string;
    isLocked?: boolean;
  };
}

export const LoanDetailsModal: React.FC<LoanDetailsModalProps> = ({
  isOpen,
  onClose,
  loanData
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
      <div ref={modalRef} className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-xl w-full max-w-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Loan Details</h2>
          <button 
            onClick={onClose}
            className="btn btn-ghost btn-sm text-white hover:bg-base-200"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Health Factor */}
          <div className="bg-base-200/50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-lg font-semibold text-white">Health Factor</span>
              <span className={`text-2xl font-bold ${
                parseFloat(loanData?.healthFactor || "0") > 1.5 
                  ? "text-success" 
                  : parseFloat(loanData?.healthFactor || "0") > 1.0 
                    ? "text-warning" 
                    : "text-error"
              }`}>
                {loanData?.healthFactor || "0.00"}
              </span>
            </div>
            <div className="text-sm text-white/70">
              {parseFloat(loanData?.healthFactor || "0") > 1.5 
                ? "Healthy - Safe position" 
                : parseFloat(loanData?.healthFactor || "0") > 1.0 
                  ? "Warning - Consider adding collateral" 
                  : "Danger - Risk of liquidation"}
            </div>
          </div>

          {/* Collateral Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-base-200/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Collateral</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-white/70">Total Collateral:</span>
                  <span className="text-white font-mono">{loanData?.totalCollateral || "0.00"} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Your Collateral:</span>
                  <span className="text-white font-mono">{loanData?.ownerCollateral || "0.00"} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Investor Collateral:</span>
                  <span className="text-white font-mono">{loanData?.investorCollateral || "0.00"} ETH</span>
                </div>
              </div>
            </div>

            <div className="bg-base-200/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Debt</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-white/70">Total Debt:</span>
                  <span className="text-white font-mono">{loanData?.totalDebt || "0.00"} USDC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Status:</span>
                  <span className={`badge ${
                    loanData?.isLocked ? "badge-error" : "badge-success"
                  }`}>
                    {loanData?.isLocked ? "Locked" : "Active"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="bg-base-200/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Risk Assessment</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-white/70">Liquidation Risk:</span>
                <span className={`font-semibold ${
                  parseFloat(loanData?.healthFactor || "0") > 1.5 
                    ? "text-success" 
                    : parseFloat(loanData?.healthFactor || "0") > 1.0 
                      ? "text-warning" 
                      : "text-error"
                }`}>
                  {parseFloat(loanData?.healthFactor || "0") > 1.5 
                    ? "Low" 
                    : parseFloat(loanData?.healthFactor || "0") > 1.0 
                      ? "Medium" 
                      : "High"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Recommendation:</span>
                <span className="text-white/70 text-sm">
                  {parseFloat(loanData?.healthFactor || "0") > 1.5 
                    ? "Position is healthy" 
                    : parseFloat(loanData?.healthFactor || "0") > 1.0 
                      ? "Consider adding collateral" 
                      : "Add collateral immediately"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              className="btn btn-primary text-white"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

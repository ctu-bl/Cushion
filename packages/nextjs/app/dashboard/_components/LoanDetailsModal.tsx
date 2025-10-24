import React, { useRef, useEffect } from "react";

interface LoanDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  loanData?: {
    wrapperAddress?: string;
    owner?: string;
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
          {/* Wrapper Address */}
          <div className="bg-base-200/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-white">Wrapper Address</span>
              <div className="flex items-center gap-2">
                <span className="text-white font-mono text-sm">{loanData?.wrapperAddress || "0x..."}</span>
                <span className="text-success">✓</span>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-base-200/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-white">Status</span>
              <div className="flex items-center gap-2">
                <span className="text-success">✓</span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  loanData?.isLocked 
                    ? "bg-red-500/20 text-red-400 border border-red-500/30" 
                    : "bg-green-500/20 text-green-400 border border-green-500/30"
                }`}>
                  {loanData?.isLocked ? "Locked" : "Active"}
                </span>
              </div>
            </div>
          </div>

          {/* Owner */}
          <div className="bg-base-200/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-white">Owner</span>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                  {loanData?.owner?.slice(2, 4).toUpperCase() || "??"}
                </div>
                <span className="text-white font-mono text-sm">{loanData?.owner || "0x..."}</span>
                <button className="btn btn-ghost btn-xs text-white/70 hover:text-white">
                  📋
                </button>
              </div>
            </div>
          </div>

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

          {/* Total Collateral */}
          <div className="bg-base-200/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-white">Total Collateral</span>
              <span className="text-white font-mono text-lg">{loanData?.totalCollateral || "0.0000"} WETH</span>
            </div>
          </div>

          {/* Total Debt */}
          <div className="bg-base-200/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-white">Total Debt</span>
              <span className="text-white font-mono text-lg">{loanData?.totalDebt || "0.00"} USDC</span>
            </div>
          </div>

          {/* Your Collateral */}
          <div className="bg-base-200/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-white">Your Collateral</span>
              <span className="text-white font-mono text-lg">{loanData?.ownerCollateral || "0.0000"} WETH</span>
            </div>
          </div>

          {/* Investor Collateral */}
          <div className="bg-base-200/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-white">Investor Collateral</span>
              <span className="text-white font-mono text-lg">{loanData?.investorCollateral || "0.0000"} WETH</span>
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

import React, { useRef, useEffect, useState } from "react";

interface RepayDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRepayDebt: (amount: string) => void;
  isLoading?: boolean;
  maxAmount?: string;
  currentHealthFactor?: string;
  totalCollateral?: string;
  totalDebt?: string;
  ethPrice?: string;
}

export const RepayDebtModal: React.FC<RepayDebtModalProps> = ({
  isOpen,
  onClose,
  onRepayDebt,
  isLoading = false,
  maxAmount = "0",
  currentHealthFactor = "0",
  totalCollateral = "0",
  totalDebt = "0",
  ethPrice = "2000"
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [amount, setAmount] = useState("");

  // Calculate new health factor after repaying debt
  const calculateNewHealthFactor = () => {
    if (!amount || parseFloat(amount) <= 0) return parseFloat(currentHealthFactor);
    
    const repayAmount = parseFloat(amount);
    const currentCollateral = parseFloat(totalCollateral); // ETH
    const currentDebt = parseFloat(totalDebt); // USDC (USD)
    const price = parseFloat(ethPrice);
    
    if (currentDebt <= 0) return Number.MAX_SAFE_INTEGER;
    
    // Convert ETH collateral to USD value
    const collateralValueUsd = currentCollateral * price;
    // Debt is already in USD (USDC), so we can subtract directly
    const newDebtValueUsd = Math.max(0, currentDebt - repayAmount);
    
    if (newDebtValueUsd <= 0) return Number.MAX_SAFE_INTEGER;
    
    // Health Factor = (Collateral Value * Liquidation Threshold) / Debt Value
    // Using 85% liquidation threshold (0.85)
    const liquidationThreshold = 0.85;
    const newHealthFactor = (collateralValueUsd * liquidationThreshold) / newDebtValueUsd;
    
    return newHealthFactor;
  };

  const newHealthFactor = calculateNewHealthFactor();
  const isHealthFactorImproving = newHealthFactor > parseFloat(currentHealthFactor);

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
    if (amount && parseFloat(amount) > 0) {
      onRepayDebt(amount);
      setAmount("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div ref={modalRef} className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Repay Debt</h2>
          <button 
            onClick={onClose}
            className="btn btn-ghost btn-sm text-white hover:bg-base-200"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Amount (USDC)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input input-bordered w-full text-white bg-base-200 border-base-content/20"
              placeholder="Enter USDC amount"
            />
          </div>

          <div className="bg-base-200/50 rounded-lg p-4">
            <div className="text-sm text-white/80 mb-2">
              <span className="font-semibold">Current Debt:</span> {maxAmount} USDC
            </div>
            <div className="text-sm text-white/80 mb-2">
              <span className="font-semibold">Current Health Factor:</span> {parseFloat(currentHealthFactor).toFixed(2)}
            </div>
            {amount && parseFloat(amount) > 0 && (
              <div className={`text-sm mb-2 ${isHealthFactorImproving ? 'text-success' : 'text-white/80'}`}>
                <span className="font-semibold">New Health Factor:</span> {newHealthFactor.toFixed(2)}
                {isHealthFactorImproving && (
                  <span className="block text-xs text-success mt-1">
                    ✅ Health Factor will improve!
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              className="btn btn-ghost flex-1 text-white"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="btn btn-warning flex-1"
              onClick={handleSubmit}
              disabled={
                !amount ||
                parseFloat(amount) <= 0 ||
                parseFloat(amount) > parseFloat(maxAmount.replace(/,/g, '')) ||
                isLoading
              }
            >
              {isLoading ? "Repaying..." : "Repay Debt"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

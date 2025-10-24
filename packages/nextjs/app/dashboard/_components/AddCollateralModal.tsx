import React, { useRef, useEffect, useState } from "react";

interface AddCollateralModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCollateral: (amount: string) => void;
  isLoading?: boolean;
  maxAmount?: string;
  currentHealthFactor?: string;
  totalCollateral?: string;
  totalDebt?: string;
  ethPrice?: string;
}

export const AddCollateralModal: React.FC<AddCollateralModalProps> = ({
  isOpen,
  onClose,
  onAddCollateral,
  isLoading = false,
  maxAmount = "0",
  currentHealthFactor = "0",
  totalCollateral = "0",
  totalDebt = "0",
  ethPrice = "2000"
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [amount, setAmount] = useState("");

  // Calculate new health factor after adding collateral
  const calculateNewHealthFactor = () => {
    if (!amount || parseFloat(amount) <= 0) return parseFloat(currentHealthFactor);
    
    const addAmount = parseFloat(amount);
    const currentCollateral = parseFloat(totalCollateral);
    const currentDebt = parseFloat(totalDebt);
    const price = parseFloat(ethPrice);
    
    if (currentDebt <= 0) return Number.MAX_SAFE_INTEGER;
    
    // Convert ETH to USD value
    const collateralValueUsd = currentCollateral * price;
    const addValueUsd = addAmount * price;
    const newCollateralValueUsd = collateralValueUsd + addValueUsd;
    
    // Health Factor = (Collateral Value * Liquidation Threshold) / Debt Value
    // Using 85% liquidation threshold (0.85)
    const liquidationThreshold = 0.85;
    const newHealthFactor = (newCollateralValueUsd * liquidationThreshold) / currentDebt;
    
    return newHealthFactor;
  };

  const newHealthFactor = calculateNewHealthFactor();
  const isHealthFactorTooLow = newHealthFactor < 1.5;
  const isHealthFactorWarning = newHealthFactor < 2.0 && newHealthFactor >= 1.5;
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
      onAddCollateral(amount);
      setAmount("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div ref={modalRef} className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Add Collateral</h2>
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
              Amount (ETH)
            </label>
            <input
              type="number"
              step="0.001"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input input-bordered w-full text-white bg-base-200 border-base-content/20"
              placeholder="Enter ETH amount"
            />
          </div>

          <div className="bg-base-200/50 rounded-lg p-4">
            <div className="text-sm text-white/80 mb-2">
              <span className="font-semibold">Available:</span> {maxAmount} ETH
            </div>
            <div className="text-sm text-white/80 mb-2">
              <span className="font-semibold">Current Health Factor:</span> {parseFloat(currentHealthFactor).toFixed(2)}
            </div>
            {amount && parseFloat(amount) > 0 && (
              <div className={`text-sm mb-2 ${
                isHealthFactorTooLow ? 'text-error' : 
                isHealthFactorWarning ? 'text-warning' : 
                isHealthFactorImproving ? 'text-success' : 
                'text-white/80'
              }`}>
                <span className="font-semibold">New Health Factor:</span> {newHealthFactor.toFixed(2)}
                {isHealthFactorTooLow && (
                  <span className="block text-xs text-error mt-1">
                    ⚠️ Health Factor will be below 1.5 - Risk of liquidation!
                  </span>
                )}
                {isHealthFactorWarning && (
                  <span className="block text-xs text-warning mt-1">
                    ⚠️ Health Factor will be below 2.0 - High risk of liquidation!
                  </span>
                )}
                {isHealthFactorImproving && !isHealthFactorTooLow && !isHealthFactorWarning && (
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
              className="btn btn-primary flex-1"
              onClick={handleSubmit}
              disabled={
                !amount ||
                parseFloat(amount) <= 0 ||
                parseFloat(amount) > parseFloat(maxAmount.replace(/,/g, '')) ||
                isLoading
              }
            >
              {isLoading ? "Adding..." : "Add Collateral"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

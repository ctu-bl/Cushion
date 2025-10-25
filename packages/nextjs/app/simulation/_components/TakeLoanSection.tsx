"use client";

import React from "react";
import SectionCard from "../_components/SectionCard";

type TakeLoanSectionProps = {
  borrowAmount: string;
  collateralAmount: string;
  setBorrowAmount: (v: string) => void;
  setCollateralAmount: (v: string) => void;
  onWrapLoan: () => void | Promise<void>;
  createdWrapperAddress?: string;
  wrapperAddress?: string;
  ethPrice?: string;
  totalDebt?: bigint;
  totalCollateral?: bigint;
};

export const TakeLoanSection: React.FC<TakeLoanSectionProps> = ({
  borrowAmount,
  collateralAmount,
  setBorrowAmount,
  setCollateralAmount,
  onWrapLoan,
  createdWrapperAddress,
  wrapperAddress,
  ethPrice,
  totalDebt,
  totalCollateral
}) => {
  // Calculate health factor for the new loan
  const calculateHealthFactor = () => {
    if (!borrowAmount || !collateralAmount || parseFloat(borrowAmount) <= 0 || parseFloat(collateralAmount) <= 0) {
      return null;
    }
    
    const borrowAmountNum = parseFloat(borrowAmount);
    const collateralAmountNum = parseFloat(collateralAmount);
    const price = ethPrice ? parseFloat(ethPrice) : 2000;
    
    // Apply 3% fee to collateral (subtract 3% from collateral)
    const feePercentage = 0.03; // 3%
    const effectiveCollateralAmount = collateralAmountNum * (1 - feePercentage);
    
    // Convert ETH to USD value (using effective collateral after fee)
    const collateralValueUsd = effectiveCollateralAmount * price;
    const debtValueUsd = borrowAmountNum;
    
    if (debtValueUsd <= 0) return null;
    
    // Health Factor = (Collateral Value * Liquidation Threshold) / Debt Value
    // Using 85% liquidation threshold (0.85)
    const liquidationThreshold = 0.85;
    const healthFactor = (collateralValueUsd * liquidationThreshold) / debtValueUsd;
    
    return healthFactor;
  };

  const healthFactor = calculateHealthFactor();
  const isHealthFactorTooLow = healthFactor !== null && healthFactor < 1.2;
  const isHealthFactorWarning = healthFactor !== null && healthFactor < 2.0 && healthFactor >= 1.2;
  
  // Check if user already has an active loan (debt > 0 OR collateral > 0)
  const hasActiveLoan = (totalDebt && totalDebt > 0n) || (totalCollateral && totalCollateral > 0n);

  return (
  <SectionCard title="Take Loan via Cushion" className="h-full">
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="form-control">
          <div className="mt-4">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={borrowAmount}
              onChange={(e) => setBorrowAmount(e.target.value)}
              placeholder="Amount in USDC"
              className="input input-bordered text-white bg-base-200 w-full"
            />
            <div className="text-xs text-white/70 mt-2">Enter amount in USDC (e.g., 1000)</div>
          </div>
        </div>
        <div className="form-control">
          <div className="mt-4">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9.]*"
              value={collateralAmount}
              onChange={(e) => setCollateralAmount(e.target.value)}
              placeholder="Amount in ETH"
              className="input input-bordered text-white bg-base-200 w-full"
            />
            <div className="text-xs text-white/70 mt-2">Enter amount in ETH (e.g., 1.0)</div>
          </div>
        </div>
      </div>
      
      {/* Health Factor Display */}
      {healthFactor !== null && (
        <div className="bg-base-200/50 rounded-lg p-4">
          <div className="text-sm text-white/80 mb-2">
            <span className="font-semibold">Projected Health Factor:</span>
          </div>
          <div className={`text-lg font-bold mb-2 ${
            isHealthFactorTooLow ? 'text-error' : 
            isHealthFactorWarning ? 'text-warning' : 
            'text-success'
          }`}>
            {healthFactor.toFixed(2)}
          </div>
          {isHealthFactorTooLow && (
            <div className="text-xs text-error">
              ⚠️ Health Factor will be below 1.2 - High risk of liquidation!
            </div>
          )}
          {isHealthFactorWarning && (
            <div className="text-xs text-warning">
              ⚠️ Health Factor will be below 2.0 - Consider adding more collateral!
            </div>
          )}
          {!isHealthFactorTooLow && !isHealthFactorWarning && healthFactor !== null && (
            <div className="text-xs text-success">
              ✅ Health Factor looks good!
            </div>
          )}
        </div>
      )}
      
      <div className="form-control">
        <button 
          className={`btn w-full ${
            hasActiveLoan ? "btn-disabled" :
            isHealthFactorTooLow ? "btn-secondary" : "btn-primary"
          }`}
          onClick={onWrapLoan}
          disabled={hasActiveLoan || isHealthFactorTooLow}
        >
          {hasActiveLoan ? "You already have a loan" : "Take Loan via Cushion"}
        </button>
      </div>
    </div>
  </SectionCard>
  );
};

export default TakeLoanSection;



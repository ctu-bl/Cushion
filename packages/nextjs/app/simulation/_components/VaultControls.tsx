"use client";

import React, { useState } from "react";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

type VaultControlsProps = {
  allWrappers?: string[];
  onInject: (wrapper: `0x${string}`) => void | Promise<void>;
  onWithdraw: (wrapper: `0x${string}`) => void | Promise<void>;
  onLiquidate: (wrapper: `0x${string}`) => void | Promise<void>;
  // Add wrapper data props
  userWrapperAddress?: string;
  isLocked?: boolean;
  healthFactor?: bigint;
  totalCollateral?: bigint;
  totalDebt?: bigint;
  ownerCollateral?: bigint;
  investorCollateral?: bigint;
  ethPrice?: string;
};

const WrapperRow: React.FC<{ 
  wrapper: `0x${string}`; 
  onInject: VaultControlsProps["onInject"]; 
  onWithdraw: VaultControlsProps["onWithdraw"]; 
  onLiquidate: VaultControlsProps["onLiquidate"];
  // Add wrapper data props
  isLocked?: boolean;
  healthFactor?: bigint;
  totalCollateral?: bigint;
  totalDebt?: bigint;
  investorCollateral?: bigint;
  ethPrice?: string;
}> = ({ wrapper, onInject, onWithdraw, onLiquidate, isLocked, healthFactor, totalCollateral, totalDebt, investorCollateral, ethPrice }) => {
  const currentHF = healthFactor ? Number(healthFactor) / 1e18 : 0;
  const currentInvestorCollateral = investorCollateral ? Number(investorCollateral) / 1e18 : 0;
  const currentTotalCollateral = totalCollateral ? Number(totalCollateral) / 1e18 : 0;
  const currentTotalDebt = totalDebt ? Number(totalDebt) / 1e6 : 0; // USDC has 6 decimals
  
  // Calculate what HF would be after withdrawing investor collateral
  // Using same formula as TakeLoanSection: HF = (Collateral Value * Liquidation Threshold) / Debt Value
  // Need to convert ETH to USD value first
  const price = ethPrice ? parseFloat(ethPrice) : 2000;
  const collateralAfterWithdraw = currentTotalCollateral - currentInvestorCollateral;
  const collateralValueUsd = collateralAfterWithdraw * price;
  const liquidationThreshold = 0.85;
  const hfAfterWithdraw = currentTotalDebt > 0 ? (collateralValueUsd * liquidationThreshold) / currentTotalDebt : 0;
  
  // Debug info
  console.log('Debug VaultControls:', {
    wrapper,
    currentHF,
    currentInvestorCollateral,
    currentTotalCollateral,
    currentTotalDebt,
    collateralAfterWithdraw,
    hfAfterWithdraw,
    isLocked: Boolean(isLocked),
    isWithdrawEnabled: Boolean(isLocked) && hfAfterWithdraw > 1.5
  });
  
  // Button logic
  const isInjectEnabled = currentHF < 1.15 && !Boolean(isLocked);
  const isWithdrawEnabled = Boolean(isLocked) && hfAfterWithdraw > 1.5;
  const isLiquidateEnabled = Boolean(isLocked) && currentHF < 1.3;
  
  const handleInject = async () => {
    await onInject(wrapper);
    // After inject, loan becomes locked automatically
  };
  
  const handleWithdraw = async () => {
    await onWithdraw(wrapper);
  };
  
  const handleLiquidate = async () => {
    await onLiquidate(wrapper);
  };
  
  return (
    <div className="flex items-center justify-between gap-4 p-3 rounded bg-base-200">
      <div className="flex flex-col">
        <span className="text-xs text-white/70">Wrapper</span>
        <span className="font-mono text-sm text-white">{wrapper}</span>
      </div>
      <div className="text-center">
        <span className="text-xs text-white/70">Health Factor</span>
        <div className="font-mono text-lg font-bold text-white">{currentHF.toFixed(2)}</div>
        <div className={`text-xs ${Boolean(isLocked) ? 'text-warning' : 'text-success'}`}>
          {Boolean(isLocked) ? '🔒 Locked' : '✅ Unlocked'}
        </div>
 
       
      </div>
      <div className="flex gap-2">
        <button 
          className={`btn btn-sm ${isInjectEnabled ? 'btn-primary' : 'btn-secondary'}`}
          onClick={handleInject}
          disabled={!isInjectEnabled}
        >
          Inject
        </button>
        <button 
          className={`btn btn-sm ${isWithdrawEnabled ? 'btn-secondary' : 'btn-disabled'}`}
          onClick={handleWithdraw}
          disabled={!isWithdrawEnabled}
        >
          Withdraw
        </button>
        <button 
          className={`btn btn-sm ${isLiquidateEnabled ? 'btn-error' : 'btn-disabled'}`}
          onClick={handleLiquidate}
          disabled={!isLiquidateEnabled}
        >
          Liquidate
        </button>
      </div>
    </div>
  );
};

export const VaultControls: React.FC<VaultControlsProps> = ({ 
  allWrappers, 
  onInject, 
  onWithdraw, 
  onLiquidate,
  userWrapperAddress,
  isLocked,
  healthFactor,
  totalCollateral,
  totalDebt,
  investorCollateral,
  ethPrice
}) => {
  return (
    <div className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-md p-6 mt-8">
      <h2 className="text-xl font-semibold mb-4 text-white">Vault Controls (3rd Party)</h2>
      {allWrappers && allWrappers.length > 0 ? (
        <div className="space-y-2">
          {allWrappers.map((wrapper: string, idx: number) => (
            <WrapperRow 
              key={idx} 
              wrapper={wrapper as `0x${string}`} 
              onInject={onInject} 
              onWithdraw={onWithdraw} 
              onLiquidate={onLiquidate}
              isLocked={isLocked}
              healthFactor={healthFactor}
              totalCollateral={totalCollateral}
              totalDebt={totalDebt}
              investorCollateral={investorCollateral}
              ethPrice={ethPrice}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-white/70">No wrappers yet.</p>
      )}
    </div>
  );
};

export default VaultControls;



"use client";

import React from "react";
import SectionCard from "../_components/SectionCard";
import { Address } from "~~/components/scaffold-eth/Address/Address";

type MyLoanSectionProps = {
  userWrapperAddress?: string;
  isLocked?: boolean;
  address?: string;
  healthFactor?: bigint;
  totalCollateral?: bigint;
  totalDebt?: bigint;
  ownerCollateral?: bigint;
  investorCollateral?: bigint;
  collateralManageAmount: string;
  setCollateralManageAmount: (v: string) => void;
  onIncreaseCollateral: () => void | Promise<void>;
  onDecreaseCollateral: () => void | Promise<void>;
  debtAmount: string;
  setDebtAmount: (v: string) => void;
  onIncreaseDebt: () => void | Promise<void>;
  onDecreaseDebt: () => void | Promise<void>;
  onRepayAllDebt: () => void | Promise<void>;
};

export const MyLoanSection: React.FC<MyLoanSectionProps> = ({
  userWrapperAddress,
  isLocked,
  address,
  healthFactor,
  totalCollateral,
  totalDebt,
  ownerCollateral,
  investorCollateral,
  collateralManageAmount,
  setCollateralManageAmount,
  onIncreaseCollateral,
  onDecreaseCollateral,
  debtAmount,
  setDebtAmount,
  onIncreaseDebt,
  onDecreaseDebt,
  onRepayAllDebt,
}) => {
  if (!userWrapperAddress || userWrapperAddress === "0x0000000000000000000000000000000000000000") return null;

  return (
    <div className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-md p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4 text-white">My Loan via Cushion</h2>
      <div className="mb-4 p-4 bg-info/10 rounded-lg">
        <p className="text-sm text-white/80">
          <strong>Managed by Cushion:</strong> Cushion handles your Aave position. You can adjust collateral and debt through Cushion.
        </p>
        {isLocked && (
          <div className="mt-2 p-2 bg-warning/10 rounded border border-warning/20">
            <p className="text-sm text-warning">
              <strong>⚠️ Loan is Locked:</strong> An investor has taken control of your loan. You cannot modify collateral or debt until the loan is unlocked.
            </p>
          </div>
        )}
      </div>
      <div className="space-y-4">
        <div className="p-4 bg-success/10 rounded-lg border border-success/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/70">Wrapper Address</p>
              <p className="font-mono text-sm text-white">{userWrapperAddress}</p>
            </div>
            <div className="text-success">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <p className="text-sm text-white/70">Status</p>
              <p className={`font-semibold ${isLocked ? "text-warning" : "text-success"}`}>{isLocked ? "🔒 Locked" : "✅ Active"}</p>
              {isLocked && <p className="text-xs text-warning/70 mt-1">Investor has control</p>}
            </div>
            <div>
              <p className="text-sm text-white/70">Owner</p>
              <Address address={address} />
            </div>
            <div>
              <p className="text-sm text-white/70">Health Factor</p>
              <p className="font-mono text-sm text-white">{healthFactor ? (Number(healthFactor) / 1e18).toFixed(2) : "0.00"}</p>
            </div>
            <div>
              <p className="text-sm text-white/70">Total Collateral</p>
              <p className="font-mono text-sm text-white">{totalCollateral ? (Number(totalCollateral) / 1e18).toFixed(4) : "0"} WETH</p>
            </div>
            <div>
              <p className="text-sm text-white/70">Total Debt</p>
              <p className="font-mono text-sm text-white">{totalDebt ? (Number(totalDebt) / 1e6).toFixed(2) : "0"} USDC</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-white/70">Your Collateral</p>
              <p className="font-mono text-sm text-white">{ownerCollateral ? (Number(ownerCollateral) / 1e18).toFixed(4) : "0"} WETH</p>
            </div>
            <div>
              <p className="text-sm text-white/70">Investor Collateral</p>
              <p className="font-mono text-sm text-white">{investorCollateral ? (Number(investorCollateral) / 1e18).toFixed(4) : "0"} WETH</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-base-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-white">Collateral Management via Cushion</h3>
          {isLocked && (
            <div className="mb-3 p-2 bg-warning/10 rounded border border-warning/20">
              <p className="text-sm text-warning">
                <strong>⚠️ Locked:</strong> Collateral management is disabled while loan is locked.
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text text-white">Amount (ETH)</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                value={collateralManageAmount}
                onChange={(e) => setCollateralManageAmount(e.target.value)}
                placeholder="0.1"
                className="input input-bordered"
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text text-white">Actions</span>
              </label>
              <div className="flex gap-2">
                <button className="btn btn-primary btn-sm" onClick={onIncreaseCollateral}>Add Collateral</button>
                <button className="btn btn-secondary btn-sm" onClick={onDecreaseCollateral}>Remove Collateral</button>
              </div>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text text-white">Info</span>
              </label>
              <div className="text-sm text-white/70">
                <p>• Add: Pay Cushion more ETH</p>
                <p>• Remove: Cushion returns ETH</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-base-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-white">Debt Management via Cushion</h3>
          {isLocked && (
            <div className="mb-3 p-2 bg-warning/10 rounded border border-warning/20">
              <p className="text-sm text-warning">
                <strong>⚠️ Locked:</strong> Debt management is disabled while loan is locked.
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text text-white">Amount (USDC)</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                value={debtAmount}
                onChange={(e) => setDebtAmount(e.target.value)}
                placeholder="100"
                className="input input-bordered"
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text text-white">Actions</span>
              </label>
              <div className="flex gap-2">
                <button className="btn btn-accent btn-sm" onClick={onIncreaseDebt}>Borrow More</button>
                <button className="btn btn-warning btn-sm" onClick={onDecreaseDebt}>Repay Debt</button>
              </div>
              <div className="mt-2">
                <button className="btn btn-success btn-sm w-full" onClick={onRepayAllDebt} disabled={!totalDebt || totalDebt === 0n || !!isLocked}>
                  💳 Repay All Debt
                </button>
                {totalDebt && totalDebt > 0n && (
                  <p className="text-xs text-white/70 mt-1">Repay: {(Number(totalDebt) / 1e6).toFixed(2)} USDC</p>
                )}
              </div>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text text-white">Info</span>
              </label>
              <div className="text-sm text-white/70">
                <p>• Borrow: Cushion gets more USDC from Aave</p>
                <p>• Repay: Pay Cushion USDC to reduce debt</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyLoanSection;



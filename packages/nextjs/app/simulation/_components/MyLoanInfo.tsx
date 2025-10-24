"use client";

import React from "react";
import { Address } from "~~/components/scaffold-eth/Address/Address";

type MyLoanInfoProps = {
  userWrapperAddress?: string;
  isLocked?: boolean;
  address?: string;
  healthFactor?: bigint;
  totalCollateral?: bigint;
  totalDebt?: bigint;
  ownerCollateral?: bigint;
  investorCollateral?: bigint;
};

export const MyLoanInfo: React.FC<MyLoanInfoProps> = ({
  userWrapperAddress,
  isLocked,
  address,
  healthFactor,
  totalCollateral,
  totalDebt,
  ownerCollateral,
  investorCollateral,
}) => {
  if (!userWrapperAddress || userWrapperAddress === "0x0000000000000000000000000000000000000000") return null;

  return (
    <div className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-md p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4 text-white">My Loan via Cushion</h2>
      
      {/* Wrapper Address */}
      <div className="p-4 bg-success/10 rounded-lg border border-success/20 mb-4">
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
      </div>

      {/* Loan Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
        <div>
          <p className="text-sm text-white/70">Status</p>
          <p className={`font-semibold ${isLocked ? "text-warning" : "text-success"}`}>
            {isLocked ? "🔒 Locked" : "✅ Active"}
          </p>
          {isLocked && <p className="text-xs text-warning/70 mt-1">Investor has control</p>}
        </div>
        
        <div>
          <p className="text-sm text-white">Owner</p>
          <div className="text-white">
            <Address address={address} />
          </div>
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

      {/* Collateral Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
  );
};

export default MyLoanInfo;

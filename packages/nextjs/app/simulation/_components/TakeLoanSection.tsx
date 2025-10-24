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
};

export const TakeLoanSection: React.FC<TakeLoanSectionProps> = ({
  borrowAmount,
  collateralAmount,
  setBorrowAmount,
  setCollateralAmount,
  onWrapLoan,
  createdWrapperAddress,
  wrapperAddress,
}) => (
  <SectionCard title="Take Loan via Cushion" className="h-full">
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text text-white">Borrow Amount (USDC)</span>
          </label>
          <div className="mt-2">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={borrowAmount}
              onChange={(e) => setBorrowAmount(e.target.value)}
              placeholder="1000"
              className="input input-bordered text-white bg-base-200 w-full"
            />
          </div>
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text text-white">Collateral Amount (ETH)</span>
          </label>
          <div className="mt-2">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9.]*"
              value={collateralAmount}
              onChange={(e) => setCollateralAmount(e.target.value)}
              placeholder="1.0"
              className="input input-bordered text-white bg-base-200 w-full"
            />
          </div>
        </div>
      </div>
      <div className="form-control">
        <button className="btn btn-primary w-full" onClick={onWrapLoan}>
          Take Loan via Cushion
        </button>
      </div>
    </div>
  </SectionCard>
);

export default TakeLoanSection;



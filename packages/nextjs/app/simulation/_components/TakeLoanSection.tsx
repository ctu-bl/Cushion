"use client";

import React from "react";
import SectionCard from "../_components/SectionCard";
import { EtherInput } from "~~/components/scaffold-eth/Input/EtherInput";

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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text text-white">Borrow Amount (USDC)</span>
        </label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={borrowAmount}
          onChange={(e) => setBorrowAmount(e.target.value)}
          placeholder="1000"
          className="input input-bordered text-white"
        />
      </div>
      <div className="form-control">
        <label className="label">
          <span className="label-text text-white">Collateral Amount (ETH)</span>
        </label>
        <input
          type="text"
          value={collateralAmount}
          onChange={(e) => setCollateralAmount(e.target.value)}
          placeholder="1.0"
          className="input input-bordered text-white"
        />
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



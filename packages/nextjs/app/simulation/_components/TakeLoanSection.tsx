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
    <div className="mb-4 p-4 bg-info/10 rounded-lg">
      <p className="text-sm text-white/80">
        <strong>How it works:</strong> You pay Cushion ETH (collateral + fee), Cushion takes a loan on Aave for you, and you receive USDC.
      </p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Borrow Amount (USDC)</span>
        </label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={borrowAmount}
          onChange={(e) => setBorrowAmount(e.target.value)}
          placeholder="1000"
          className="input input-bordered"
        />
      </div>
      <div className="form-control">
        <label className="label">
          <span className="label-text">Collateral Amount (ETH)</span>
        </label>
        <EtherInput value={collateralAmount} onChange={setCollateralAmount} placeholder="1.0" />
      </div>
      <div className="form-control">
        <label className="label">
          <span className="label-text">Actions</span>
        </label>
        <button className="btn btn-primary" onClick={onWrapLoan}>
          Take Loan via Cushion
        </button>
      </div>
      <div className="form-control">
        <label className="label">
          <span className="label-text">Info</span>
        </label>
        <p className="text-sm text-white/70">Fee will be calculated by smart contract</p>
      </div>
    </div>
    {(createdWrapperAddress || wrapperAddress) && (
      <div className="mt-4 p-4 bg-success/10 rounded-lg">
        <p className="text-success font-semibold">Loan Created via Cushion!</p>
        <p className="text-sm">Wrapper Address: {createdWrapperAddress || wrapperAddress}</p>
        <p className="text-sm text-white/70">You received USDC and Cushion manages your Aave position</p>
      </div>
    )}
  </SectionCard>
);

export default TakeLoanSection;



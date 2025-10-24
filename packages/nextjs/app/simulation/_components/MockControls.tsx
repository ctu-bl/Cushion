"use client";

import React from "react";
import SectionCard from "../_components/SectionCard";

type MockControlsProps = {
  onMintUSDC: () => void | Promise<void>;
  onMintPYUSD: () => void | Promise<void>;
  onMintWETH: () => void | Promise<void>;
  onDepositToPool: () => void | Promise<void>;
};

export const MockControls: React.FC<MockControlsProps> = ({ onMintUSDC, onMintPYUSD, onMintWETH, onDepositToPool }) => (
  <SectionCard title="Mock Controls" className="">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <button className="btn btn-primary w-full" onClick={onMintUSDC}>Mint 1M USDC</button>
      <button className="btn btn-secondary w-full" onClick={onMintPYUSD}>Mint 1M PYUSD</button>
      <button className="btn btn-primary w-full" onClick={onMintWETH}>Convert ETH to WETH</button>
      <button className="btn btn-primary w-full" onClick={onDepositToPool}>Deposit 500k USDC to Pool</button>
    </div>
  </SectionCard>
);

export default MockControls;



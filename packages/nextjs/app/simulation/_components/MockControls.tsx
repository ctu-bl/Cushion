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
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <button className="btn btn-primary w-full" onClick={onMintUSDC}>Mint 1M USDC</button>
      <button className="btn btn-secondary w-full" onClick={onMintPYUSD}>Mint 1M PYUSD</button>
      <button className="btn btn-primary w-full" onClick={onMintWETH}>Convert ETH to WETH</button>
      <button className="btn btn-primary w-full" onClick={onDepositToPool}>Deposit 500k USDC to Pool</button>
    </div>
    <div className="mt-4 text-sm text-white">
      <p>• Mint USDC: Creates 1,000,000 USDC tokens in your account</p>
      <p>• Mint PYUSD: Creates 1,000,000 PYUSD tokens in your account</p>
      <p>• Convert ETH: Wraps your ETH into WETH tokens</p>
      <p>• Deposit to Pool: Adds 500,000 USDC to the mock Aave pool for borrowing</p>
    </div>
  </SectionCard>
);

export default MockControls;



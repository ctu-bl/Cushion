"use client";

import React from "react";
import SectionCard from "../_components/SectionCard";
import StatBox from "../_components/StatBox";

type PoolAssetsProps = {
  poolUSDCBalance?: bigint;
  poolWETHBalance?: bigint;
};

export const PoolAssets: React.FC<PoolAssetsProps> = ({ poolUSDCBalance, poolWETHBalance }) => (
  <SectionCard title="Mock Aave Pool Assets" className="h-full">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <StatBox label="USDC in Pool"><span className="text-white">{poolUSDCBalance ? (Number(poolUSDCBalance) / 1e6).toFixed(2) : "0"} USDC</span></StatBox>
      <StatBox label="WETH in Pool"><span className="text-white">{poolWETHBalance ? (Number(poolWETHBalance) / 1e18).toFixed(4) : "0"} WETH</span></StatBox>
    </div>
  </SectionCard>
);

export default PoolAssets;



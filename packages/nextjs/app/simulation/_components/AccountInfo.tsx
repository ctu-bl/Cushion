"use client";

import React from "react";
import { Address } from "~~/components/scaffold-eth/Address/Address";
import { Balance } from "~~/components/scaffold-eth/Balance";
import StatBox from "../_components/StatBox";
import SectionCard from "../_components/SectionCard";

type AccountInfoProps = {
  address?: string;
  mockUSDCBalance?: bigint;
  mockPYUSDBalance?: bigint;
  mockWETHBalance?: bigint;
};

export const AccountInfo: React.FC<AccountInfoProps> = ({ address, mockUSDCBalance, mockPYUSDBalance, mockWETHBalance }) => (
  <SectionCard title="Account Info" className="h-full">
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <StatBox label="Address">
        <Address address={address} />
      </StatBox>
      <StatBox label="ETH Balance">
        <Balance address={address} />
      </StatBox>
      <StatBox label="Mock USDC Balance">
        {mockUSDCBalance ? (Number(mockUSDCBalance) / 1e6).toFixed(2) : "0"} USDC
      </StatBox>
      <StatBox label="Mock PYUSD Balance">
        {mockPYUSDBalance ? (Number(mockPYUSDBalance) / 1e6).toFixed(2) : "0"} PYUSD
      </StatBox>
      <StatBox label="Mock WETH Balance">
        {mockWETHBalance ? (Number(mockWETHBalance) / 1e18).toFixed(4) : "0"} WETH
      </StatBox>
    </div>
  </SectionCard>
);

export default AccountInfo;



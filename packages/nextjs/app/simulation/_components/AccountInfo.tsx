"use client";

import React from "react";
import { useBalance } from "wagmi";
import { Address } from "~~/components/scaffold-eth/Address/Address";
import StatBox from "../_components/StatBox";
import SectionCard from "../_components/SectionCard";

type AccountInfoProps = {
  address?: string;
  mockUSDCBalance?: bigint;
  mockPYUSDBalance?: bigint;
};

// Dekomponované komponenty
const EthBalance: React.FC<{ address?: string }> = ({ address }) => {
  const { data: balance, isLoading, error } = useBalance({
    address: address as `0x${string}`,
  });

  if (isLoading) {
    return <span className="text-white font-mono">Loading...</span>;
  }

  if (error) {
    return <span className="text-white font-mono">Error loading balance</span>;
  }

  const formattedBalance = balance ? Number(balance.formatted).toFixed(4) : "0.0000";

  return (
    <span className="text-white font-mono">{formattedBalance} ETH</span>
  );
};

const MockTokenBalance: React.FC<{ 
  balance?: bigint; 
  decimals: number; 
  symbol: string; 
  precision: number;
}> = ({ balance, decimals, symbol, precision }) => {
  const formattedBalance = balance 
    ? (Number(balance) / Math.pow(10, decimals)).toFixed(precision)
    : "0";
    
  return (
    <span className="text-white font-mono">{formattedBalance} {symbol}</span>
  );
};

const AddressSection: React.FC<{ address?: string }> = ({ address }) => (
  <StatBox label="Address">
    <Address address={address} />
  </StatBox>
);

const EthBalanceSection: React.FC<{ address?: string }> = ({ address }) => (
  <StatBox label="ETH Balance">
    <EthBalance address={address} />
  </StatBox>
);

const TokenBalancesSection: React.FC<{
  mockUSDCBalance?: bigint;
  mockPYUSDBalance?: bigint;
}> = ({ mockUSDCBalance, mockPYUSDBalance }) => (
  <>
    <StatBox label="Mock USDC Balance">
      <MockTokenBalance 
        balance={mockUSDCBalance} 
        decimals={6} 
        symbol="USDC" 
        precision={2} 
      />
    </StatBox>
    <StatBox label="Mock PYUSD Balance">
      <MockTokenBalance 
        balance={mockPYUSDBalance} 
        decimals={6} 
        symbol="PYUSD" 
        precision={2} 
      />
    </StatBox>
  </>
);

export const AccountInfo: React.FC<AccountInfoProps> = ({ 
  address, 
  mockUSDCBalance, 
  mockPYUSDBalance 
}) => (
  <SectionCard title="Account Info" className="h-full">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <EthBalanceSection address={address} />
      <StatBox label="Mock USDC Balance">
        <MockTokenBalance 
          balance={mockUSDCBalance} 
          decimals={6} 
          symbol="USDC" 
          precision={2} 
        />
      </StatBox>
      <StatBox label="Mock PYUSD Balance">
        <MockTokenBalance 
          balance={mockPYUSDBalance} 
          decimals={6} 
          symbol="PYUSD" 
          precision={2} 
        />
      </StatBox>
    </div>
  </SectionCard>
);

export default AccountInfo;



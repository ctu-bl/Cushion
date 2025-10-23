"use client";

import React from "react";
import { Address } from "~~/components/scaffold-eth/Address/Address";
import StatBox from "../_components/StatBox";
import SectionCard from "../_components/SectionCard";

type AccountInfoProps = {
  address?: string;
  mockUSDCBalance?: bigint;
  mockPYUSDBalance?: bigint;
  mockWETHBalance?: bigint;
};

// Dekomponované komponenty
const EthBalance: React.FC<{ address?: string }> = ({ address }) => {
  const [ethBalance, setEthBalance] = React.useState<string>("0.0000");
  
  React.useEffect(() => {
    if (address) {
      // Simulace ETH balance - v reálné aplikaci by se načítalo z blockchainu
      setEthBalance("0.9936");
    }
  }, [address]);

  return (
    <span className="text-white font-mono">{ethBalance} ETH</span>
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
  mockWETHBalance?: bigint;
}> = ({ mockUSDCBalance, mockPYUSDBalance, mockWETHBalance }) => (
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
    <StatBox label="Mock WETH Balance">
      <MockTokenBalance 
        balance={mockWETHBalance} 
        decimals={18} 
        symbol="WETH" 
        precision={4} 
      />
    </StatBox>
  </>
);

export const AccountInfo: React.FC<AccountInfoProps> = ({ 
  address, 
  mockUSDCBalance, 
  mockPYUSDBalance, 
  mockWETHBalance 
}) => (
  <SectionCard title="Account Info" className="h-full">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <AddressSection address={address} />
      <EthBalanceSection address={address} />
      <TokenBalancesSection 
        mockUSDCBalance={mockUSDCBalance}
        mockPYUSDBalance={mockPYUSDBalance}
        mockWETHBalance={mockWETHBalance}
      />
    </div>
  </SectionCard>
);

export default AccountInfo;



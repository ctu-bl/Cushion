"use client";

import React from "react";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";

export const ConnectWalletCard: React.FC = () => {
  return (
    <div className="grid grid-cols-1">
      <div className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-md p-8 text-center">
        <h2 className="text-xl font-semibold mb-2 text-base-content">Connect your wallet</h2>
        <p className="text-base-content/70 mb-6">Please connect to see your account overview.</p>
        <div className="flex justify-center">
          <RainbowKitCustomConnectButton />
        </div>
      </div>
    </div>
  );
};

export default ConnectWalletCard;

"use client";

import React from "react";
import SectionCard from "../_components/SectionCard";

type EthPriceSimulatorProps = {
  currentEthPrice?: bigint;
  priceDecimals?: number;
  newEthPrice: string;
  setNewEthPrice: (v: string) => void;
  isUpdatingPrice: boolean;
  onUpdatePrice: () => void | Promise<void>;
};

const formatEthPrice = (price: bigint | undefined, decimals: number | undefined) => {
  if (!price || !decimals) return "0.00";
  const divisor = BigInt(10 ** decimals);
  const wholePart = price / divisor;
  const fractionalPart = price % divisor;
  const fractionalStr = fractionalPart.toString().padStart(decimals, "0");
  return `${wholePart.toString()}.${fractionalStr.slice(0, 2)}`;
};

export const EthPriceSimulator: React.FC<EthPriceSimulatorProps> = ({
  currentEthPrice,
  priceDecimals,
  newEthPrice,
  setNewEthPrice,
  isUpdatingPrice,
  onUpdatePrice,
}) => (
  <div className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-md p-6">
    <h2 className="text-xl font-semibold mb-4 text-white">ETH Price Simulator</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-base-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3 text-white">Current ETH Price</h3>
        <div className="text-center">
          <div className="text-3xl font-bold text-white mb-2">${formatEthPrice(currentEthPrice, priceDecimals)}</div>
          <div className="text-sm text-white/70">Oracle controls all ETH pricing</div>
        </div>
      </div>
      <div className="bg-base-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3 text-white">Update ETH Price</h3>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="New ETH Price (USD)"
            className="input input-bordered flex-1 text-white"
            value={newEthPrice}
            onChange={(e) => setNewEthPrice(e.target.value)}
            step="0.01"
            min="0"
          />
          <button className={`btn btn-primary ${isUpdatingPrice ? "loading" : ""}`} onClick={onUpdatePrice} disabled={!newEthPrice || isUpdatingPrice}>
            {isUpdatingPrice ? "Updating..." : "Update"}
          </button>
        </div>
        <div className="text-xs text-white/70 mt-2">Enter a price in USD (e.g., 2000.50)</div>
      </div>
    </div>
  </div>
);

export default EthPriceSimulator;



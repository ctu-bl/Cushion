"use client";

import React from "react";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

type VaultControlsProps = {
  allWrappers?: string[];
  onInject: (wrapper: `0x${string}`) => void | Promise<void>;
  onWithdraw: (wrapper: `0x${string}`) => void | Promise<void>;
  onLiquidate: (wrapper: `0x${string}`) => void | Promise<void>;
};

const WrapperRow: React.FC<{ wrapper: `0x${string}`; onInject: VaultControlsProps["onInject"]; onWithdraw: VaultControlsProps["onWithdraw"]; onLiquidate: VaultControlsProps["onLiquidate"]; }> = ({ wrapper, onInject, onWithdraw, onLiquidate }) => {
  const { data: hf } = useScaffoldReadContract({ contractName: "LoanWrapperRegistry", functionName: "getHF", args: [wrapper] });
  return (
    <div className="flex items-center justify-between gap-4 p-3 rounded bg-base-200">
      <div className="flex flex-col">
        <span className="text-xs text-white/70">Wrapper</span>
        <span className="font-mono text-sm text-white">{wrapper}</span>
      </div>
      <div className="text-center">
        <span className="text-xs text-white/70">Health Factor</span>
        <div className="font-mono text-lg font-bold text-white">{hf ? (Number(hf) / 1e18).toFixed(2) : "-"}</div>
      </div>
      <div className="flex gap-2">
        <button className="btn btn-primary btn-sm" onClick={() => onInject(wrapper)}>Inject</button>
        <button className="btn btn-secondary btn-sm" onClick={() => onWithdraw(wrapper)}>Withdraw</button>
        <button className="btn btn-error btn-sm" onClick={() => onLiquidate(wrapper)}>Liquidate</button>
      </div>
    </div>
  );
};

export const VaultControls: React.FC<VaultControlsProps> = ({ allWrappers, onInject, onWithdraw, onLiquidate }) => (
  <div className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-md p-6 mt-8">
    <h2 className="text-xl font-semibold mb-4 text-white">Vault Controls (3rd Party)</h2>
    {allWrappers && allWrappers.length > 0 ? (
      <div className="space-y-2">
        {allWrappers.map((wrapper: string, idx: number) => (
          <WrapperRow key={idx} wrapper={wrapper as `0x${string}`} onInject={onInject} onWithdraw={onWithdraw} onLiquidate={onLiquidate} />
        ))}
      </div>
    ) : (
      <p className="text-sm text-white/70">No wrappers yet.</p>
    )}
  </div>
);

export default VaultControls;



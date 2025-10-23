"use client";

import React from "react";

type RegistryInfoProps = {
  registryAddress?: string;
  allWrappers?: string[];
};

export const RegistryInfo: React.FC<RegistryInfoProps> = ({ registryAddress, allWrappers }) => (
  <div className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-md p-6">
    <h2 className="text-xl font-semibold mb-4 text-white">Loan Wrapper Registry</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <p className="text-sm text-white">Registry Address</p>
        <p className="font-mono text-sm">{registryAddress}</p>
      </div>
      <div>
        <p className="text-sm text-white">Total Wrappers Created</p>
        <p className="font-mono text-lg font-bold">{allWrappers?.length || 0}</p>
      </div>
    </div>
    {allWrappers && allWrappers.length > 0 && (
      <div className="mt-4">
        <p className="text-sm text-white mb-2">All Created Wrappers:</p>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {allWrappers.map((wrapper: string, index: number) => (
            <div key={index} className="font-mono text-sm bg-base-200 p-2 rounded">{wrapper}</div>
          ))}
        </div>
      </div>
    )}
  </div>
);

export default RegistryInfo;



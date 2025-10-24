"use client";

import React from "react";

export const VaultHeader: React.FC = () => {
  return (
    <div className="text-center">
      <h1 className="text-5xl font-bold mb-4 text-base-content">Vault</h1>
      <p className="text-lg text-base-content/70 mb-4">Manage your pyUSD deposits and earn interest</p>
      <div className="flex justify-center gap-4 text-sm mb-12">
        <div className="flex items-center gap-2 bg-success/10 text-success px-3 py-1 rounded-full">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
          <span>Live</span>
        </div>
        <div className="flex items-center gap-2 bg-info/10 text-info px-3 py-1 rounded-full">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span>Secure</span>
        </div>
      </div>
    </div>
  );
};

export default VaultHeader;

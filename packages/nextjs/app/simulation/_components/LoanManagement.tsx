"use client";

import React from "react";

type LoanManagementProps = {
  onAddCollateral: () => void;
  onRemoveCollateral: () => void;
  onBorrowMore: () => void;
  onRepayDebt: () => void;
  onRepayAllDebt: () => void;
  onViewLoanDetails: () => void;
};

export const LoanManagement: React.FC<LoanManagementProps> = ({
  onAddCollateral,
  onRemoveCollateral,
  onBorrowMore,
  onRepayDebt,
  onRepayAllDebt,
  onViewLoanDetails,
}) => {
  return (
    <div className="mb-8">

      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Collateral Management */}
        <div className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-white">Collateral Management</h3>
          <div className="space-y-3">
            <button 
              className="btn btn-primary w-full"
              onClick={onAddCollateral}
            >
              Add Collateral
            </button>
            <button 
              className="btn btn-secondary w-full"
              onClick={onRemoveCollateral}
            >
              Remove Collateral
            </button>
          </div>
        </div>

        {/* Debt Management */}
        <div className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-white">Debt Management</h3>
          <div className="space-y-3">
            <button 
              className="btn btn-primary w-full"
              onClick={onBorrowMore}
            >
              Borrow More
            </button>
            <button 
              className="btn btn-warning w-full"
              onClick={onRepayDebt}
            >
              Repay Debt
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-white">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              className="btn btn-success w-full"
              onClick={onRepayAllDebt}
            >
              Repay All Debt
            </button>
            <button 
              className="btn btn-info w-full"
              onClick={onViewLoanDetails}
            >
              View Loan Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanManagement;

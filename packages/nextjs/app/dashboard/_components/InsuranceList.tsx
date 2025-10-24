"use client";

import React from "react";

type InsuranceListProps = {
  onOpenInsurance: (id: number) => void;
  onOpenTakeModal: () => void;
};

export const InsuranceList: React.FC<InsuranceListProps> = ({
  onOpenInsurance,
  onOpenTakeModal,
}) => {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map(id => (
        <div key={id} className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2 text-base-content">Insurance #{id}</h3>
          <p className="text-sm text-base-content/70 mb-4">Aave loan coverage demo.</p>
          <div className="flex justify-between items-center">
            <span className="text-xs text-base-content/60">Status: inactive</span>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => onOpenInsurance(id)}
            >
              Open dashboard
            </button>
          </div>
        </div>
      ))}
      
      <div className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-md p-6">
        <h3 className="text-lg font-semibold mb-2 text-base-content">Take New Insurance</h3>
        <p className="text-sm text-base-content/70 mb-4">Get coverage for your Aave loan.</p>
        <div className="flex justify-between items-center">
          <span className="text-xs text-base-content/60">Status: available</span>
          <button
            className="btn btn-sm btn-secondary"
            onClick={onOpenTakeModal}
          >
            Take insurance
          </button>
        </div>
      </div>
    </section>
  );
};

export default InsuranceList;

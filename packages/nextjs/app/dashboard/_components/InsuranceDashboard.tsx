"use client";

import React from "react";
import { CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { HealthStatus } from "../_hooks/useDashboardData";
import { DashboardData } from "../_hooks/useDashboardData";
import { KpiCard } from "./KpiCard";

type InsuranceDashboardProps = {
  selectedInsuranceId: number | null;
  data: DashboardData;
  address: string;
  onClose: () => void;
};

export const InsuranceDashboard: React.FC<InsuranceDashboardProps> = ({
  selectedInsuranceId,
  data,
  address,
  onClose,
}) => {
  const statusBadge = {
    good: {
      label: "Good health factor",
      className: "badge badge-success badge-outline",
      Icon: CheckCircleIcon,
    },
    rescue: {
      label: "Rescue in progress",
      className: "badge badge-warning badge-outline",
      Icon: ExclamationTriangleIcon,
    },
    liquidated: {
      label: "Liquidated",
      className: "badge badge-error badge-outline",
      Icon: ExclamationTriangleIcon,
    },
  }[data.status];

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-base-content">Dashboard · Insurance #{selectedInsuranceId}</h1>
        </div>
        <span className={`inline-flex items-center gap-2 ${statusBadge.className}`}>
          <statusBadge.Icon className="h-4 w-4" /> {statusBadge.label}
        </span>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <KpiCard
          title="Collateral supplied"
          value={`$${data.collateralUsd.toLocaleString()}`}
          subtitle="Total supplied value"
        />
        <KpiCard
          title="Debt to repay (PYUSD)"
          value={`${data.debtPyusd.toLocaleString()} PYUSD`}
          subtitle="Outstanding debt"
        />
        <KpiCard title="Health factor" value={data.healthFactor.toFixed(2)} subtitle="HF" emphasize />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-base-content">Wallet</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-base-content/70">Address</span>
              <span className="font-mono text-sm text-base-content">{address}</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default InsuranceDashboard;

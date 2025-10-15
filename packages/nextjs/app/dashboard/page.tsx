"use client";

import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import {
  ArrowDownCircleIcon,
  ArrowUpCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";

type HealthStatus = "good" | "rescue" | "liquidated";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const [selectedInsuranceId, setSelectedInsuranceId] = useState<number | null>(null);
  const [showTakeModal, setShowTakeModal] = useState(false);
  const [hasActiveInsurance, setHasActiveInsurance] = useState(false);
  const [aaveLoanAddress, setAaveLoanAddress] = useState("");

  const data = useMemo(
    () => ({
      collateralUsd: 12345.67,
      debtPyusd: 2345.89,
      walletPyusd: 987.65,
      healthFactor: 1.72,
      status: "good" as HealthStatus,
    }),
    [],
  );

  if (!isConnected) {
    return (
      <main className="container mx-auto py-12 px-4 md:px-8">
        <h1 className="text-4xl font-bold mb-6">Dashboard</h1>
        <div className="grid grid-cols-1">
          <div className="card bg-base-100 rounded-2xl border border-base-300/60 shadow-md p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Connect your wallet</h2>
            <p className="text-base-content/70 mb-6">Please connect to see your account overview.</p>
            <div className="flex justify-center">
              <RainbowKitCustomConnectButton />
            </div>
          </div>
        </div>
      </main>
    );
  }

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

  // UI: Insurance list if no active insurance or switching
  const insuranceList = (
    <>
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-4xl font-bold">Insurances</h1>
        <button className="btn btn-primary" onClick={() => setShowTakeModal(true)}>
          Take insurance
        </button>
      </div>
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(id => (
          <div key={id} className="card bg-base-100 rounded-2xl border border-base-300/60 shadow-md p-6">
            <h3 className="text-lg font-semibold mb-2">Insurance #{id}</h3>
            <p className="text-sm text-base-content/70 mb-4">Aave loan coverage demo.</p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-base-content/60">Status: inactive</span>
              <button
                className="btn btn-sm btn-outline"
                onClick={() => {
                  setSelectedInsuranceId(id);
                  setHasActiveInsurance(true);
                }}
              >
                Open dashboard
              </button>
            </div>
          </div>
        ))}
      </section>
    </>
  );

  const insuranceDashboard = (
    <>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost btn-sm" onClick={() => setHasActiveInsurance(false)}>
            ← Back
          </button>
          <h1 className="text-3xl font-bold">Dashboard · Insurance #{selectedInsuranceId}</h1>
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
        <div className="card bg-base-100 rounded-2xl border border-base-300/60 shadow-md p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          {data.status === "good" && (
            <div className="flex flex-wrap gap-3">
              <button className="btn btn-primary gap-2">
                <ArrowDownCircleIcon className="h-5 w-5" /> Repay
              </button>
              <button className="btn btn-secondary gap-2">
                <ArrowUpCircleIcon className="h-5 w-5" /> Increase debt
              </button>
            </div>
          )}

          {data.status === "rescue" && (
            <p className="text-base-content/70">
              Rescue is in progress. Actions are temporarily unavailable; you can only monitor the position.
            </p>
          )}

          {data.status === "liquidated" && (
            <div className="flex flex-wrap gap-3">
              <button className="btn btn-accent">Withdraw remaining collateral</button>
            </div>
          )}
        </div>

        <div className="card bg-base-100 rounded-2xl border border-base-300/60 shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Wallet</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-base-content/70">Address</span>
              <span className="font-mono text-sm">{address}</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );

  return (
    <main className="container mx-auto py-12 px-4 md:px-8">
      {!hasActiveInsurance ? insuranceList : insuranceDashboard}

      {showTakeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="card bg-base-100 rounded-2xl border border-base-300/60 shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-2">Take insurance</h3>
            <p className="text-base-content/70 mb-4">Enter your Aave loan address and confirm payment.</p>
            <label className="form-control w-full mb-4">
              <span className="label-text mb-1">Aave loan address</span>
              <input
                type="text"
                value={aaveLoanAddress}
                onChange={e => setAaveLoanAddress(e.target.value)}
                placeholder="0x..."
                className="input input-bordered w-full"
              />
            </label>
            <div className="flex justify-end gap-3">
              <button className="btn btn-ghost" onClick={() => setShowTakeModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setShowTakeModal(false);
                  setHasActiveInsurance(true);
                  setSelectedInsuranceId(1);
                }}
              >
                Pay
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function KpiCard({
  title,
  value,
  subtitle,
  emphasize,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  emphasize?: boolean;
}) {
  return (
    <div className="card bg-base-100 rounded-2xl border border-base-300/60 shadow-md p-6">
      <p className="text-base-content/70 text-sm mb-1">{title}</p>
      <p className={`text-2xl font-bold ${emphasize ? "text-primary" : ""}`}>{value}</p>
      {subtitle && <p className="text-base-content/60 text-xs mt-1">{subtitle}</p>}
    </div>
  );
}

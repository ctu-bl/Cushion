"use client";

import { useMemo, useState } from "react";
import AaveSepoliaBorrows from "./_components/AaveSepoliaBorrows";
import { useAccount } from "wagmi";
import { CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
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
      <main className="min-h-screen bg-base-200 py-12 px-4 md:px-8">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold mb-6 text-base-content">Dashboard</h1>
          <div className="grid grid-cols-1">
            <div className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-md p-8 text-center">
              <h2 className="text-xl font-semibold mb-2 text-base-content">Connect your wallet</h2>
              <p className="text-base-content/70 mb-6">Please connect to see your account overview.</p>
              <div className="flex justify-center">
                <RainbowKitCustomConnectButton />
              </div>
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

  const insuranceList = (
    <>
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(id => (
          <div key={id} className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-md p-6">
            <h3 className="text-lg font-semibold mb-2 text-base-content">Insurance #{id}</h3>
            <p className="text-sm text-base-content/70 mb-4">Aave loan coverage demo.</p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-base-content/60">Status: inactive</span>
              <button
                className="btn btn-sm btn-primary"
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

  return (
    <main className="min-h-screen bg-base-200 py-12 px-4 md:px-8">
      <div className="container mx-auto">
        {address && <AaveSepoliaBorrows address={address as `0x${string}`} className="mb-8" />}
        {!hasActiveInsurance ? insuranceList : insuranceDashboard}

        {showTakeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-xl w-full max-w-md p-6">
              <h3 className="text-lg font-semibold mb-2 text-base-content">Take insurance</h3>
              <p className="text-base-content/70 mb-4">Enter your Aave loan address and confirm payment.</p>
              <label className="form-control w-full mb-4">
                <span className="label-text mb-1 text-base-content">Aave loan address</span>
                <input
                  type="text"
                  value={aaveLoanAddress}
                  onChange={e => setAaveLoanAddress(e.target.value)}
                  placeholder="0x..."
                  className="input input-bordered w-full bg-base-200 text-base-content"
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
      </div>
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
    <div className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-md p-6">
      <p className="text-base-content/70 text-sm mb-1">{title}</p>
      <p className={`text-2xl font-bold ${emphasize ? "text-primary" : "text-base-content"}`}>{value}</p>
      {subtitle && <p className="text-base-content/60 text-xs mt-1">{subtitle}</p>}
    </div>
  );
}

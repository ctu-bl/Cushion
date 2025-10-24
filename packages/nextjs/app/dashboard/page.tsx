"use client";

import { useAccount } from "wagmi";
import AaveSepoliaBorrows from "./_components/AaveSepoliaBorrows";
import { useDashboardData } from "./_hooks/useDashboardData";
import { useDashboardState } from "./_hooks/useDashboardState";
import InsuranceList from "./_components/InsuranceList";
import InsuranceDashboard from "./_components/InsuranceDashboard";
import TakeInsuranceModal from "./_components/TakeInsuranceModal";
import ConnectWalletCard from "./_components/ConnectWalletCard";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  
  // Custom hooks
  const { data } = useDashboardData();
  const dashboardState = useDashboardState();

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-base-200 py-12 px-4 md:px-8">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold mb-6 text-base-content">Dashboard</h1>
          <ConnectWalletCard />
        </div>
      </main>
    );
  }


  return (
    <main className="min-h-screen bg-base-200 py-12 px-4 md:px-8">
      <div className="container mx-auto">
        {address && <AaveSepoliaBorrows address={address as `0x${string}`} className="mb-8" />}
        
        {!dashboardState.hasActiveInsurance ? (
          <InsuranceList
            onOpenInsurance={dashboardState.openInsurance}
            onOpenTakeModal={dashboardState.openTakeModal}
          />
        ) : (
          <InsuranceDashboard
            selectedInsuranceId={dashboardState.selectedInsuranceId}
            data={data}
            address={address!}
            onClose={dashboardState.closeInsurance}
          />
        )}

        <TakeInsuranceModal
          isOpen={dashboardState.showTakeModal}
          onClose={dashboardState.closeTakeModal}
          onTakeInsurance={dashboardState.takeInsurance}
          aaveLoanAddress={dashboardState.aaveLoanAddress}
          setAaveLoanAddress={dashboardState.setAaveLoanAddress}
        />
      </div>
    </main>
  );
}


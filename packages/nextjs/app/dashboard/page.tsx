"use client";

import { useAccount } from "wagmi";
import { useState } from "react";
import { useBalance } from "wagmi";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useSuccessBar } from "../_contexts/SuccessBarContext";
import { useSimulationData } from "../simulation/_hooks/useSimulationData";
import { useWrapperData } from "../simulation/_hooks/useWrapperData";
import { useEthPrice } from "../simulation/_hooks/useEthPrice";
import { useSimulationActions } from "../simulation/_hooks/useSimulationActions";
import AccountInfo from "../simulation/_components/AccountInfo";
import TakeLoanSection from "../simulation/_components/TakeLoanSection";
import EthPriceHistory from "../simulation/_components/EthPriceHistory";
import { AddCollateralModal } from "./_components/AddCollateralModal";
import { RemoveCollateralModal } from "./_components/RemoveCollateralModal";
import { BorrowMoreModal } from "./_components/BorrowMoreModal";
import { RepayDebtModal } from "./_components/RepayDebtModal";
import { RepayAllDebtModal } from "./_components/RepayAllDebtModal";
import { LoanDetailsModal } from "./_components/LoanDetailsModal";
import { MyLoanSection } from "./_components/MyLoanSection";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { showSuccess } = useSuccessBar();
  
  // Custom hooks for data and actions
  const simulationData = useSimulationData();
  const wrapperData = useWrapperData(simulationData.userWrapperAddress);
  const ethPriceData = useEthPrice();
  const actions = useSimulationActions(
    simulationData.address,
    simulationData.mockUSDCInfo,
    simulationData.mockPoolInfo
  );

  // Get real ETH balance from wallet
  const { data: ethBalance } = useBalance({
    address: address as `0x${string}`,
  });

  // Modal states
  const [showAddCollateral, setShowAddCollateral] = useState(false);
  const [showRemoveCollateral, setShowRemoveCollateral] = useState(false);
  const [showBorrowMore, setShowBorrowMore] = useState(false);
  const [showRepayDebt, setShowRepayDebt] = useState(false);
  const [showRepayAllDebt, setShowRepayAllDebt] = useState(false);
  const [showLoanDetails, setShowLoanDetails] = useState(false);

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-base-200 py-12 px-4">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold mb-6 text-white">Dashboard</h1>
          <div className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-md p-8 text-center">
            <h2 className="text-xl font-semibold mb-2 text-white">Connect your wallet</h2>
            <p className="text-white mb-6">Please connect to access the dashboard.</p>
            <RainbowKitCustomConnectButton />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-base-200 py-12 px-4">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-white">Dashboard</h1>
        
        {/* Account Information and Take Loan Section - Side by Side */}
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AccountInfo 
            address={simulationData.address} 
            mockUSDCBalance={simulationData.mockUSDCBalance as bigint | undefined} 
            mockPYUSDBalance={simulationData.mockPYUSDBalance as bigint | undefined} 
            mockWETHBalance={simulationData.mockWETHBalance as bigint | undefined} 
          />
          <TakeLoanSection
            borrowAmount={actions.borrowAmount}
            collateralAmount={actions.collateralAmount}
            setBorrowAmount={actions.setBorrowAmount}
            setCollateralAmount={actions.setCollateralAmount}
            onWrapLoan={actions.handleWrapLoan}
            createdWrapperAddress={actions.createdWrapperAddress}
            wrapperAddress={simulationData.userWrapperAddress as string | undefined}
          />
        </div>

        {/* My Loan via Cushion */}
        {simulationData.userWrapperAddress && (
          <div className="mb-8">
            <MyLoanSection
              userWrapperAddress={simulationData.userWrapperAddress as string}
              isLocked={Boolean(wrapperData.isLocked)}
              address={simulationData.address}
              healthFactor={wrapperData.healthFactor as bigint | undefined}
              totalCollateral={wrapperData.totalCollateral as bigint | undefined}
              totalDebt={wrapperData.totalDebt as bigint | undefined}
              ownerCollateral={wrapperData.ownerCollateral as bigint | undefined}
              investorCollateral={wrapperData.investorCollateral as bigint | undefined}
            />
          </div>
        )}

        {/* Loan Management Buttons */}
        <div className="mb-8">
          <div className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6 text-white text-center">Loan Management</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Collateral Management */}
              <div className="card bg-base-200/50 rounded-xl p-4">
                <h3 className="text-lg font-semibold mb-4 text-white text-center">Collateral Management</h3>
                <div className="space-y-3">
                  <button 
                    className="btn btn-primary w-full"
                    onClick={() => setShowAddCollateral(true)}
                  >
                    Add Collateral
                  </button>
                  <button 
                    className="btn btn-secondary w-full"
                    onClick={() => setShowRemoveCollateral(true)}
                  >
                    Remove Collateral
                  </button>
                </div>
              </div>

              {/* Debt Management */}
              <div className="card bg-base-200/50 rounded-xl p-4">
                <h3 className="text-lg font-semibold mb-4 text-white text-center">Debt Management</h3>
                <div className="space-y-3">
                  <button 
                    className="btn btn-primary w-full"
                    onClick={() => setShowBorrowMore(true)}
                  >
                    Borrow More
                  </button>
                  <button 
                    className="btn btn-warning w-full"
                    onClick={() => setShowRepayDebt(true)}
                  >
                    Repay Debt
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="card bg-base-200/50 rounded-xl p-4">
                <h3 className="text-lg font-semibold mb-4 text-white text-center">Quick Actions</h3>
                <div className="space-y-3">
                  <button 
                    className="btn btn-success w-full"
                    onClick={() => setShowRepayAllDebt(true)}
                  >
                    Repay All Debt
                  </button>
                  <button 
                    className="btn btn-info w-full"
                    onClick={() => setShowLoanDetails(true)}
                  >
                    View Loan Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ETH Price History Chart */}
        <div className="mb-8">
          <EthPriceHistory 
            priceHistory={ethPriceData.priceHistory}
          />
        </div>
      </div>

      {/* Modals */}
      <AddCollateralModal
        isOpen={showAddCollateral}
        onClose={() => setShowAddCollateral(false)}
        onAddCollateral={async (amount) => {
          try {
            await actions.handleIncreaseCollateral(simulationData.userWrapperAddress!, amount);
            showSuccess(`Successfully added ${amount} ETH as collateral!`);
            setShowAddCollateral(false);
          } catch (error) {
            console.error("Add collateral failed:", error);
          }
        }}
        maxAmount={ethBalance ? Number(ethBalance.formatted).toFixed(4) : "0.0000"}
        currentHealthFactor={wrapperData.healthFactor ? (Number(wrapperData.healthFactor) / 1e18).toFixed(2) : "0.00"}
        totalCollateral={wrapperData.totalCollateral ? (Number(wrapperData.totalCollateral) / 1e18).toFixed(4) : "0.0000"}
        totalDebt={wrapperData.totalDebt ? (Number(wrapperData.totalDebt) / 1e6).toFixed(2) : "0.00"}
        ethPrice="2000"
      />

      <RemoveCollateralModal
        isOpen={showRemoveCollateral}
        onClose={() => setShowRemoveCollateral(false)}
        onRemoveCollateral={async (amount) => {
          try {
            await actions.handleDecreaseCollateral(
              simulationData.userWrapperAddress!,
              Boolean(wrapperData.isLocked),
              wrapperData.ownerCollateral,
              wrapperData.totalCollateral,
              amount
            );
            showSuccess(`Successfully removed ${amount} ETH from collateral!`);
            setShowRemoveCollateral(false);
          } catch (error) {
            console.error("Remove collateral failed:", error);
          }
        }}
        maxAmount={wrapperData.ownerCollateral ? (Number(wrapperData.ownerCollateral) / 1e18).toFixed(4) : "0.0000"}
        currentHealthFactor={wrapperData.healthFactor ? (Number(wrapperData.healthFactor) / 1e18).toFixed(2) : "0.00"}
        totalCollateral={wrapperData.totalCollateral ? (Number(wrapperData.totalCollateral) / 1e18).toFixed(4) : "0.0000"}
        totalDebt={wrapperData.totalDebt ? (Number(wrapperData.totalDebt) / 1e6).toFixed(2) : "0.00"}
        ethPrice="2000"
      />

      <BorrowMoreModal
        isOpen={showBorrowMore}
        onClose={() => setShowBorrowMore(false)}
        onBorrowMore={async (amount) => {
          try {
            await actions.handleIncreaseDebt(simulationData.userWrapperAddress!, amount);
            showSuccess(`Successfully borrowed ${amount} USDC!`);
            setShowBorrowMore(false);
          } catch (error) {
            console.error("Borrow more failed:", error);
          }
        }}
        maxAmount={simulationData.mockUSDCBalance ? (Number(simulationData.mockUSDCBalance) / 1e6).toFixed(2) : "0.00"}
      />

      <RepayDebtModal
        isOpen={showRepayDebt}
        onClose={() => setShowRepayDebt(false)}
        onRepayDebt={async (amount) => {
          try {
            await actions.handleDecreaseDebt(simulationData.userWrapperAddress!, amount);
            showSuccess(`Successfully repaid ${amount} USDC!`);
            setShowRepayDebt(false);
          } catch (error) {
            console.error("Repay debt failed:", error);
          }
        }}
        maxAmount={wrapperData.totalDebt ? (Number(wrapperData.totalDebt) / 1e6).toFixed(2) : "0.00"}
      />

      <RepayAllDebtModal
        isOpen={showRepayAllDebt}
        onClose={() => setShowRepayAllDebt(false)}
        onRepayAllDebt={async () => {
          try {
            await actions.handleRepayAllDebt(
              simulationData.userWrapperAddress!,
              wrapperData.totalDebt,
              wrapperData.isLocked
            );
            const totalDebtAmount = wrapperData.totalDebt ? (Number(wrapperData.totalDebt) / 1e6).toFixed(2) : "0.00";
            showSuccess(`Successfully repaid all debt (${totalDebtAmount} USDC)!`);
            setShowRepayAllDebt(false);
          } catch (error) {
            console.error("Repay all debt failed:", error);
          }
        }}
        totalDebt={wrapperData.totalDebt ? (Number(wrapperData.totalDebt) / 1e6).toFixed(2) : "0.00"}
      />

      <LoanDetailsModal
        isOpen={showLoanDetails}
        onClose={() => setShowLoanDetails(false)}
        loanData={{
          healthFactor: wrapperData.healthFactor?.toString() || "0.00",
          totalCollateral: wrapperData.totalCollateral?.toString() || "0.00",
          totalDebt: wrapperData.totalDebt?.toString() || "0.00",
          ownerCollateral: wrapperData.ownerCollateral?.toString() || "0.00",
          investorCollateral: wrapperData.investorCollateral?.toString() || "0.00",
          isLocked: Boolean(wrapperData.isLocked)
        }}
      />
    </main>
  );
}


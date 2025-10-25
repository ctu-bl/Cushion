"use client";

import { useAccount, useBalance } from "wagmi";
import { useState } from "react";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useSimulationData } from "./_hooks/useSimulationData";
import { useWrapperData } from "./_hooks/useWrapperData";
import { useEthPrice } from "./_hooks/useEthPrice";
import { useSimulationActions } from "./_hooks/useSimulationActions";
import AccountInfo from "./_components/AccountInfo";
import TakeLoanSection from "./_components/TakeLoanSection";
import PoolAssets from "./_components/PoolAssets";
import MockControls from "./_components/MockControls";
import { MyLoanSection } from "../dashboard/_components/MyLoanSection";
import EthPriceSimulator from "./_components/EthPriceSimulator";
import { AddCollateralModal } from "../dashboard/_components/AddCollateralModal";
import { RemoveCollateralModal } from "../dashboard/_components/RemoveCollateralModal";
import { BorrowMoreModal } from "../dashboard/_components/BorrowMoreModal";
import { RepayDebtModal } from "../dashboard/_components/RepayDebtModal";
import { RepayAllDebtModal } from "../dashboard/_components/RepayAllDebtModal";
import { LoanDetailsModal } from "../dashboard/_components/LoanDetailsModal";
import EthPriceHistory from "./_components/EthPriceHistory";
import RegistryInfo from "./_components/RegistryInfo";
import VaultControls from "./_components/VaultControls";

export default function SimulationPage() {
  const { address, isConnected } = useAccount();
  
  // Modal states
  const [showAddCollateral, setShowAddCollateral] = useState(false);
  const [showRemoveCollateral, setShowRemoveCollateral] = useState(false);
  const [showBorrowMore, setShowBorrowMore] = useState(false);
  const [showRepayDebt, setShowRepayDebt] = useState(false);
  const [showRepayAllDebt, setShowRepayAllDebt] = useState(false);
  const [showLoanDetails, setShowLoanDetails] = useState(false);
  
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


  if (!isConnected) {
    return (
      <main className="min-h-screen bg-base-200 py-12 px-4">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold mb-6 text-white">Cushion Simulation</h1>
          <div className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-md p-8 text-center">
            <h2 className="text-xl font-semibold mb-2 text-white">Connect your wallet</h2>
            <p className="text-white mb-6">Please connect to access the simulation.</p>
            <RainbowKitCustomConnectButton />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-base-200 py-12 px-4">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-white">Cushion Simulation</h1>
        
        {/* Top row: Account + Pool in one line */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <div className="flex flex-col gap-6">
            <AccountInfo 
              address={simulationData.address} 
              mockUSDCBalance={simulationData.mockUSDCBalance as bigint | undefined} 
              mockPYUSDBalance={simulationData.mockPYUSDBalance as bigint | undefined} 
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
        <div className="flex flex-col gap-6">
            <PoolAssets 
              poolUSDCBalance={simulationData.poolUSDCBalance as bigint | undefined} 
              poolWETHBalance={simulationData.poolWETHBalance as bigint | undefined} 
            />
            <MockControls 
              onMintUSDC={actions.handleMintUSDC} 
              onMintPYUSD={actions.handleMintPYUSD} 
              onDepositToPool={actions.handleDepositToPool} 
            />
          </div>
        </div>

        {/* My Loan via Cushion */}
        {simulationData.userWrapperAddress && (
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
        )}

        {/* Loan Management */}
        {simulationData.userWrapperAddress && simulationData.userWrapperAddress !== "0x0000000000000000000000000000000000000000" && (
          <div className="mb-8">
            <div className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-6 text-white text-center">Loan Management</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Collateral Management */}
                <div className="card bg-base-200/50 rounded-xl p-4">
                  <h3 className="text-lg font-semibold mb-4 text-white text-center">Collateral Management</h3>
                  <div className="space-y-3">
                    <button 
                      className={`btn w-full ${Boolean(wrapperData.isLocked) ? 'btn-disabled' : 'btn-primary'}`}
                      onClick={() => setShowAddCollateral(true)}
                      disabled={Boolean(wrapperData.isLocked)}
                    >
                      Add Collateral
                    </button>
                    <button 
                      className={`btn w-full ${Boolean(wrapperData.isLocked) ? 'btn-disabled' : 'btn-secondary'}`}
                      onClick={() => setShowRemoveCollateral(true)}
                      disabled={Boolean(wrapperData.isLocked)}
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
                      className={`btn w-full ${Boolean(wrapperData.isLocked) ? 'btn-disabled' : 'btn-primary'}`}
                      onClick={() => setShowBorrowMore(true)}
                      disabled={Boolean(wrapperData.isLocked)}
                    >
                      Borrow More
                    </button>
                    <button 
                      className={`btn w-full ${Boolean(wrapperData.isLocked) ? 'btn-disabled' : 'btn-warning'}`}
                      onClick={() => setShowRepayDebt(true)}
                      disabled={Boolean(wrapperData.isLocked)}
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
                      className={`btn w-full ${Boolean(wrapperData.isLocked) ? 'btn-disabled' : 'btn-success'}`}
                      onClick={() => setShowRepayAllDebt(true)}
                      disabled={Boolean(wrapperData.isLocked)}
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
        )}

        <div className="mb-8">
          <EthPriceSimulator 
            currentEthPrice={ethPriceData.currentEthPrice as bigint | undefined} 
            priceDecimals={ethPriceData.priceDecimals as number | undefined} 
            newEthPrice={ethPriceData.newEthPrice} 
            setNewEthPrice={ethPriceData.setNewEthPrice} 
            isUpdatingPrice={ethPriceData.isUpdatingPrice} 
            onUpdatePrice={ethPriceData.handleEthPriceUpdate} 
          />
        </div>

        <div className="mb-8">
          <EthPriceHistory 
            priceHistory={ethPriceData.priceHistory}
          />
        </div>

        <div className="mb-8">
          <VaultControls
            allWrappers={simulationData.allWrappers as string[] | undefined}
            onInject={(wrapper) => actions.handleVaultAction("injectToLoan", wrapper)}
            onWithdraw={(wrapper) => actions.handleVaultAction("withdrawFromLoan", wrapper)}
            onLiquidate={(wrapper) => actions.handleVaultAction("liquidate", wrapper)}
            userWrapperAddress={simulationData.userWrapperAddress as string | undefined}
            isLocked={Boolean(wrapperData.isLocked)}
            healthFactor={wrapperData.healthFactor as bigint | undefined}
            totalCollateral={wrapperData.totalCollateral as bigint | undefined}
            totalDebt={wrapperData.totalDebt as bigint | undefined}
            investorCollateral={wrapperData.investorCollateral as bigint | undefined}
            ethPrice={ethPriceData.formatEthPrice(ethPriceData.currentEthPrice, ethPriceData.priceDecimals)}
          />
        </div>

        <div className="mb-8">
          <RegistryInfo 
            registryAddress={simulationData.registryAddress as string | undefined} 
            allWrappers={simulationData.allWrappers as string[] | undefined} 
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
            setShowBorrowMore(false);
          } catch (error) {
            console.error("Borrow more failed:", error);
          }
        }}
        maxAmount={simulationData.mockUSDCBalance ? (Number(simulationData.mockUSDCBalance) / 1e6).toFixed(2) : "0.00"}
        currentHealthFactor={wrapperData.healthFactor ? (Number(wrapperData.healthFactor) / 1e18).toFixed(2) : "0.00"}
        totalCollateral={wrapperData.totalCollateral ? (Number(wrapperData.totalCollateral) / 1e18).toFixed(4) : "0.0000"}
        totalDebt={wrapperData.totalDebt ? (Number(wrapperData.totalDebt) / 1e6).toFixed(2) : "0.00"}
        ethPrice="2000"
      />

      <RepayDebtModal
        isOpen={showRepayDebt}
        onClose={() => setShowRepayDebt(false)}
        onRepayDebt={async (amount) => {
          try {
            await actions.handleDecreaseDebt(simulationData.userWrapperAddress!, amount);
            setShowRepayDebt(false);
          } catch (error) {
            console.error("Repay debt failed:", error);
          }
        }}
        maxAmount={wrapperData.totalDebt ? (Number(wrapperData.totalDebt) / 1e6).toFixed(2) : "0.00"}
        currentHealthFactor={wrapperData.healthFactor ? (Number(wrapperData.healthFactor) / 1e18).toFixed(2) : "0.00"}
        totalCollateral={wrapperData.totalCollateral ? (Number(wrapperData.totalCollateral) / 1e18).toFixed(4) : "0.0000"}
        totalDebt={wrapperData.totalDebt ? (Number(wrapperData.totalDebt) / 1e6).toFixed(2) : "0.00"}
        ethPrice="2000"
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
          wrapperAddress: simulationData.userWrapperAddress,
          owner: address,
          healthFactor: wrapperData.healthFactor ? (Number(wrapperData.healthFactor) / 1e18).toFixed(2) : "0.00",
          totalCollateral: wrapperData.totalCollateral ? (Number(wrapperData.totalCollateral) / 1e18).toFixed(4) : "0.0000",
          totalDebt: wrapperData.totalDebt ? (Number(wrapperData.totalDebt) / 1e6).toFixed(2) : "0.00",
          ownerCollateral: wrapperData.ownerCollateral ? (Number(wrapperData.ownerCollateral) / 1e18).toFixed(4) : "0.0000",
          investorCollateral: wrapperData.investorCollateral ? (Number(wrapperData.investorCollateral) / 1e18).toFixed(4) : "0.0000",
          isLocked: Boolean(wrapperData.isLocked)
        }}
      />
    </main>
  );
}

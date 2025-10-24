"use client";

import { useAccount } from "wagmi";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useSimulationData } from "./_hooks/useSimulationData";
import { useWrapperData } from "./_hooks/useWrapperData";
import { useEthPrice } from "./_hooks/useEthPrice";
import { useSimulationActions } from "./_hooks/useSimulationActions";
import AccountInfo from "./_components/AccountInfo";
import TakeLoanSection from "./_components/TakeLoanSection";
import PoolAssets from "./_components/PoolAssets";
import MockControls from "./_components/MockControls";
import MyLoanSection from "./_components/MyLoanSection";
import EthPriceSimulator from "./_components/EthPriceSimulator";
import RegistryInfo from "./_components/RegistryInfo";
import VaultControls from "./_components/VaultControls";

export default function SimulationPage() {
  const { address, isConnected } = useAccount();
  
  // Custom hooks for data and actions
  const simulationData = useSimulationData();
  const wrapperData = useWrapperData(simulationData.userWrapperAddress);
  const ethPriceData = useEthPrice();
  const actions = useSimulationActions(
    simulationData.address,
    simulationData.mockUSDCInfo,
    simulationData.mockPoolInfo
  );


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
        <div className="flex flex-col gap-6">
            <PoolAssets 
              poolUSDCBalance={simulationData.poolUSDCBalance as bigint | undefined} 
              poolWETHBalance={simulationData.poolWETHBalance as bigint | undefined} 
            />
            <MockControls 
              onMintUSDC={actions.handleMintUSDC} 
              onMintPYUSD={actions.handleMintPYUSD} 
              onMintWETH={actions.handleMintWETH} 
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
            collateralManageAmount={actions.collateralManageAmount}
            setCollateralManageAmount={actions.setCollateralManageAmount}
            onIncreaseCollateral={() => actions.handleIncreaseCollateral(simulationData.userWrapperAddress!)}
            onDecreaseCollateral={() => actions.handleDecreaseCollateral(
              simulationData.userWrapperAddress!, 
              Boolean(wrapperData.isLocked), 
              wrapperData.ownerCollateral, 
              wrapperData.totalCollateral
            )}
            debtAmount={actions.debtAmount}
            setDebtAmount={actions.setDebtAmount}
            onIncreaseDebt={() => actions.handleIncreaseDebt(simulationData.userWrapperAddress!)}
            onDecreaseDebt={() => actions.handleDecreaseDebt(simulationData.userWrapperAddress!)}
            onRepayAllDebt={() => actions.handleRepayAllDebt(
              simulationData.userWrapperAddress!, 
              wrapperData.totalDebt, 
              wrapperData.isLocked
            )}
          />
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
          <VaultControls
            allWrappers={simulationData.allWrappers as string[] | undefined}
            onInject={(wrapper) => actions.handleVaultAction("injectToLoan", wrapper)}
            onWithdraw={(wrapper) => actions.handleVaultAction("withdrawFromLoan", wrapper)}
            onLiquidate={(wrapper) => actions.handleVaultAction("liquidate", wrapper)}
          />
        </div>

        <div className="mb-8">
          <RegistryInfo 
            registryAddress={simulationData.registryAddress as string | undefined} 
            allWrappers={simulationData.allWrappers as string[] | undefined} 
          />
        </div>
      </div>
    </main>
  );
}

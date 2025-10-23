"use client";

import { useAccount } from "wagmi";
import { useVaultData } from "./_hooks/useVaultData";
import { useVaultActions } from "./_hooks/useVaultActions";
import { useVaultModals } from "./_hooks/useVaultModals";
import VaultHeader from "./_components/VaultHeader";
import BalanceCards from "./_components/BalanceCards";
import StatusMessages from "./_components/StatusMessages";
import DepositModal from "./_components/DepositModal";
import WithdrawModal from "./_components/WithdrawModal";
import ApproveModal from "./_components/ApproveModal";

export default function VaultPage() {
  const { isConnected } = useAccount();
  
  // Custom hooks
  const vaultData = useVaultData();
  const vaultActions = useVaultActions(
    vaultData.PYUSD_ADDRESS,
    vaultData.VAULT_ADDRESS,
    vaultData.mockPYUSDInfo,
    vaultData.vaultInfo,
    vaultData.address
  );
  const modals = useVaultModals(vaultData.refreshAllBalances);

  // Handle actions with error handling
  const handleDeposit = async () => {
    try {
      modals.setDepositError(undefined);
      const hash = await vaultActions.handleDeposit();
      modals.setDepositTxHash(hash);
      modals.setShowDepositModal(false);
    } catch (error) {
      modals.setDepositError(error instanceof Error ? error.message : "Deposit failed");
    }
  };

  const handleWithdraw = async () => {
    try {
      modals.setWithdrawError(undefined);
      const hash = await vaultActions.handleWithdraw();
      modals.setWithdrawTxHash(hash);
      modals.setShowWithdrawModal(false);
    } catch (error) {
      modals.setWithdrawError(error instanceof Error ? error.message : "Withdraw failed");
    }
  };

  const handleApprove = async () => {
    try {
      modals.setApproveError(undefined);
      const hash = await vaultActions.handleApprove();
      modals.setApproveTxHash(hash);
      modals.setShowApproveModal(false);
    } catch (error) {
      modals.setApproveError(error instanceof Error ? error.message : "Approve failed");
    }
  };

  // Show loading if contracts are not loaded
  if (!vaultData.PYUSD_ADDRESS || !vaultData.VAULT_ADDRESS) {
    return (
      <main className="min-h-screen bg-base-200 py-12 px-4 md:px-8">
        <div className="container mx-auto">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-4 text-base-content">Vault</h1>
            <div className="loading loading-spinner loading-lg"></div>
            <p className="text-lg text-base-content/70 mt-4">Loading contracts...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-base-200 py-12 px-4 md:px-8">
      <div className="container mx-auto">
        <StatusMessages
          isApproveSuccess={modals.isApproveSuccess}
          approveAmount={vaultActions.approveAmount}
          onApproveClose={() => {
            modals.setApproveTxHash(undefined);
            vaultActions.setApproveAmount("1");
          }}
          approveError={modals.approveError}
          onApproveErrorClose={() => modals.setApproveError(undefined)}
          isDepositSuccess={modals.isDepositSuccess}
          depositAmount={vaultActions.depositAmount}
          onDepositClose={() => {
            modals.setDepositTxHash(undefined);
            vaultActions.setDepositAmount("");
          }}
          depositError={modals.depositError}
          onDepositErrorClose={() => modals.setDepositError(undefined)}
          isWithdrawSuccess={modals.isWithdrawSuccess}
          withdrawAmount={vaultActions.withdrawAmount}
          onWithdrawClose={() => {
            modals.setWithdrawTxHash(undefined);
            vaultActions.setWithdrawAmount("");
          }}
          withdrawError={modals.withdrawError}
          onWithdrawErrorClose={() => modals.setWithdrawError(undefined)}
        />

        <VaultHeader />

        <BalanceCards
          totalVaultAmount={vaultData.totalVaultAmount}
          userBalance={vaultData.userBalance}
          userVaultBalance={vaultData.userVaultBalance}
          isConnected={isConnected}
          onApprove={() => modals.setShowApproveModal(true)}
          onDeposit={() => modals.setShowDepositModal(true)}
          onWithdraw={() => modals.setShowWithdrawModal(true)}
        />

        <DepositModal
          isOpen={modals.showDepositModal}
          onClose={() => {
            modals.setShowDepositModal(false);
            vaultActions.setDepositAmount("");
          }}
          depositAmount={vaultActions.depositAmount}
          setDepositAmount={vaultActions.setDepositAmount}
          onDeposit={handleDeposit}
          isLoading={modals.isDepositLoading}
          userBalance={vaultData.userBalance}
          userVaultBalance={vaultData.userVaultBalance}
        />

        <ApproveModal
          isOpen={modals.showApproveModal}
          onClose={() => {
            modals.setShowApproveModal(false);
            vaultActions.setApproveAmount("1");
            modals.setApproveTxHash(undefined);
            modals.setApproveError(undefined);
          }}
          approveAmount={vaultActions.approveAmount}
          setApproveAmount={vaultActions.setApproveAmount}
          onApprove={handleApprove}
          isLoading={modals.isApproveLoading}
          isSuccess={modals.isApproveSuccess}
        />

        <WithdrawModal
          isOpen={modals.showWithdrawModal}
          onClose={() => {
            modals.setShowWithdrawModal(false);
            vaultActions.setWithdrawAmount("");
          }}
          withdrawAmount={vaultActions.withdrawAmount}
          setWithdrawAmount={vaultActions.setWithdrawAmount}
          onWithdraw={handleWithdraw}
          isLoading={modals.isWithdrawLoading}
          userBalance={vaultData.userBalance}
          userVaultBalance={vaultData.userVaultBalance}
        />
      </div>
    </main>
  );
}

import { Hash, SendTransactionParameters, TransactionReceipt, WalletClient } from "viem";
import { Config, useWalletClient } from "wagmi";
import { getPublicClient } from "wagmi/actions";
import { SendTransactionMutate } from "wagmi/query";
import scaffoldConfig from "~~/scaffold.config";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";
import { AllowedChainIds, getBlockExplorerTxLink } from "~~/utils/scaffold-eth";
import { useSuccessBar } from "~~/app/_contexts/SuccessBarContext";
import { TransactorFuncOptions, getParsedErrorWithAllAbis } from "~~/utils/scaffold-eth/contract";

type TransactionFunc = (
  tx: (() => Promise<Hash>) | Parameters<SendTransactionMutate<Config, undefined>>[0],
  options?: TransactorFuncOptions,
) => Promise<Hash | undefined>;

// TxnNotification removed - using GlobalSuccessBar instead

/**
 * Runs Transaction passed in to returned function showing UI feedback.
 * @param _walletClient - Optional wallet client to use. If not provided, will use the one from useWalletClient.
 * @returns function that takes in transaction function as callback, shows UI feedback for transaction and returns a promise of the transaction hash
 */
export const useTransactor = (_walletClient?: WalletClient): TransactionFunc => {
  let walletClient = _walletClient;
  const { data } = useWalletClient();
  const { showSuccess } = useSuccessBar();
  if (walletClient === undefined && data) {
    walletClient = data;
  }

  const result: TransactionFunc = async (tx, options) => {
    if (!walletClient) {
      console.error("Cannot access account");
      return;
    }

    // Notification system removed
    let transactionHash: Hash | undefined = undefined;
    let transactionReceipt: TransactionReceipt | undefined;
    let blockExplorerTxURL = "";
    let chainId: number = scaffoldConfig.targetNetworks[0].id;
    try {
      chainId = await walletClient.getChainId();
      // Get full transaction from public client
      const publicClient = getPublicClient(wagmiConfig);

      // Loading state handled by global success bar
      if (typeof tx === "function") {
        // Tx is already prepared by the caller
        const result = await tx();
        transactionHash = result;
      } else if (tx != null) {
        transactionHash = await walletClient.sendTransaction(tx as SendTransactionParameters);
      } else {
        throw new Error("Incorrect transaction passed to transactor");
      }
      blockExplorerTxURL = chainId ? getBlockExplorerTxLink(chainId, transactionHash) : "";

      transactionReceipt = await publicClient.waitForTransactionReceipt({
        hash: transactionHash,
        confirmations: options?.blockConfirmations,
      });

      if (transactionReceipt.status === "reverted") throw new Error("Transaction reverted");

      // Show global success bar
      showSuccess("Transaction completed successfully!", blockExplorerTxURL);

      if (options?.onBlockConfirmation) options.onBlockConfirmation(transactionReceipt);
    } catch (error: any) {
      // Error handling without notifications
      console.error("⚡️ ~ file: useTransactor.ts ~ error", error);
      const message = getParsedErrorWithAllAbis(error, chainId as AllowedChainIds);

      // Error handling - could add error bar here if needed
      console.error("Transaction failed:", message);
      throw error;
    }

    return transactionHash;
  };

  return result;
};

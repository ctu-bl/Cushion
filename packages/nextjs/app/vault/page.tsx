"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

export default function VaultPage() {
  const { isConnected, address } = useAccount();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [approveAmount, setApproveAmount] = useState("1");
  const [approveTxHash, setApproveTxHash] = useState<string | undefined>();
  const [approveError, setApproveError] = useState<string | undefined>();
  const [depositTxHash, setDepositTxHash] = useState<string | undefined>();
  const [depositError, setDepositError] = useState<string | undefined>();
  const [withdrawTxHash, setWithdrawTxHash] = useState<string | undefined>();
  const [withdrawError, setWithdrawError] = useState<string | undefined>();

  const interestRate = 15;

  // PYUSD Token contract
  const PYUSD_ADDRESS = "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9";
  const VAULT_ADDRESS = "0x7C046A238e0197FF9691839d85f27cC6914A4fB8";

  const { writeContractAsync } = useWriteContract();

  // Read PYUSD balance
  const { data: pyusdBalance, refetch: refetchPyusdBalance } = useReadContract({
    address: PYUSD_ADDRESS,
    abi: [
      {
        inputs: [{ name: "account", type: "address" }],
        name: "balanceOf",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
    ],
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Read Vault total assets
  const { data: vaultTotalAssets, refetch: refetchVaultTotalAssets } = useReadContract({
    address: VAULT_ADDRESS,
    abi: [
      {
        inputs: [],
        name: "totalAssets",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
    ],
    functionName: "totalAssets",
  });

  // Read user's Vault shares
  const { data: userVaultShares, refetch: refetchUserVaultShares } = useReadContract({
    address: VAULT_ADDRESS,
    abi: [
      {
        inputs: [{ name: "account", type: "address" }],
        name: "balanceOf",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
    ],
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Convert user's shares to assets
  const { data: userVaultAssets, refetch: refetchUserVaultAssets } = useReadContract({
    address: VAULT_ADDRESS,
    abi: [
      {
        inputs: [{ name: "shares", type: "uint256" }],
        name: "convertToAssets",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
    ],
    functionName: "convertToAssets",
    args: userVaultShares ? [userVaultShares] : undefined,
    query: {
      enabled: !!userVaultShares,
    },
  });

  // Format PYUSD balance (6 decimals)
  const formatPyusdBalance = (balance: bigint | undefined) => {
    if (!balance) return "0.00";
    const formatted = Number(balance) / 1000000; // Convert from 6 decimals
    return formatted.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const userBalance = formatPyusdBalance(pyusdBalance);
  const totalVaultAmount = formatPyusdBalance(vaultTotalAssets);
  const userVaultBalance = formatPyusdBalance(userVaultAssets);

  // Function to refresh all balances
  const refreshAllBalances = async () => {
    await Promise.all([
      refetchPyusdBalance(),
      refetchVaultTotalAssets(),
      refetchUserVaultShares(),
      refetchUserVaultAssets(),
    ]);
  };

  // Wait for transactions
  const { isLoading: isApproveLoading, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveTxHash as `0x${string}`,
  });

  const { isLoading: isDepositLoading, isSuccess: isDepositSuccess } = useWaitForTransactionReceipt({
    hash: depositTxHash as `0x${string}`,
  });

  const { isLoading: isWithdrawLoading, isSuccess: isWithdrawSuccess } = useWaitForTransactionReceipt({
    hash: withdrawTxHash as `0x${string}`,
  });

  // Auto-hide success message after 3 seconds and refresh balances
  useEffect(() => {
    if (isApproveSuccess) {
      refreshAllBalances();
      const timer = setTimeout(() => {
        setApproveTxHash(undefined);
        setApproveAmount("1");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isApproveSuccess]);

  // Auto-hide error message after 3 seconds
  useEffect(() => {
    if (approveError) {
      const timer = setTimeout(() => {
        setApproveError(undefined);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [approveError]);

  // Auto-hide deposit success message after 3 seconds and refresh balances
  useEffect(() => {
    if (isDepositSuccess) {
      refreshAllBalances();
      const timer = setTimeout(() => {
        setDepositTxHash(undefined);
        setDepositAmount("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isDepositSuccess]);

  // Auto-hide deposit error message after 3 seconds
  useEffect(() => {
    if (depositError) {
      const timer = setTimeout(() => {
        setDepositError(undefined);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [depositError]);

  // Auto-hide withdraw success message after 3 seconds and refresh balances
  useEffect(() => {
    if (isWithdrawSuccess) {
      refreshAllBalances();
      const timer = setTimeout(() => {
        setWithdrawTxHash(undefined);
        setWithdrawAmount("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isWithdrawSuccess]);

  // Auto-hide withdraw error message after 3 seconds
  useEffect(() => {
    if (withdrawError) {
      const timer = setTimeout(() => {
        setWithdrawError(undefined);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [withdrawError]);

  const handleDeposit = async () => {
    try {
      setDepositError(undefined);
      const amount = parseFloat(depositAmount) * 1000000; // Convert to 6 decimals
      const hash = await writeContractAsync({
        address: VAULT_ADDRESS,
        abi: [
          {
            inputs: [
              { name: "assets", type: "uint256" },
              { name: "receiver", type: "address" },
            ],
            name: "deposit",
            outputs: [{ name: "", type: "uint256" }],
            stateMutability: "nonpayable",
            type: "function",
          },
        ],
        functionName: "deposit",
        args: [BigInt(amount), address!],
      });
      setDepositTxHash(hash);
      setShowDepositModal(false);
      console.log("Deposit transaction sent:", hash);
    } catch (error) {
      console.error("Deposit failed:", error);
      setDepositError(error instanceof Error ? error.message : "Deposit failed");
    }
  };

  const handleWithdraw = async () => {
    try {
      setWithdrawError(undefined);
      const amount = parseFloat(withdrawAmount) * 1000000; // Convert to 6 decimals
      const hash = await writeContractAsync({
        address: VAULT_ADDRESS,
        abi: [
          {
            inputs: [
              { name: "assets", type: "uint256" },
              { name: "receiver", type: "address" },
              { name: "owner", type: "address" },
            ],
            name: "withdraw",
            outputs: [{ name: "", type: "uint256" }],
            stateMutability: "nonpayable",
            type: "function",
          },
        ],
        functionName: "withdraw",
        args: [BigInt(amount), address!, address!],
      });
      setWithdrawTxHash(hash);
      setShowWithdrawModal(false);
      console.log("Withdraw transaction sent:", hash);
    } catch (error) {
      console.error("Withdraw failed:", error);
      setWithdrawError(error instanceof Error ? error.message : "Withdraw failed");
    }
  };

  const handleApprove = async () => {
    try {
      setApproveError(undefined);
      const amount = parseFloat(approveAmount) * 1000000; // Convert to 6 decimals
      const hash = await writeContractAsync({
        address: PYUSD_ADDRESS,
        abi: [
          {
            inputs: [
              { name: "spender", type: "address" },
              { name: "amount", type: "uint256" },
            ],
            name: "approve",
            outputs: [{ name: "", type: "bool" }],
            stateMutability: "nonpayable",
            type: "function",
          },
        ],
        functionName: "approve",
        args: [VAULT_ADDRESS, BigInt(amount)],
      });
      setApproveTxHash(hash);
      setShowApproveModal(false);
      console.log("Approve transaction sent:", hash);
    } catch (error) {
      console.error("Approve failed:", error);
      setApproveError(error instanceof Error ? error.message : "Approve failed");
    }
  };

  return (
    <main className="min-h-screen bg-base-200 py-12 px-4 md:px-8">
      <div className="container mx-auto">
        {/* Success/Error Messages */}
        {isApproveSuccess && (
          <div className="bg-green-500 text-white p-4 text-center mb-6 rounded-lg">
            <div className="flex items-center justify-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Successfully approved {approveAmount} PYUSD!</span>
              <button
                onClick={() => {
                  setApproveTxHash(undefined);
                  setApproveAmount("1");
                }}
                className="ml-4 text-white hover:text-gray-200"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {approveError && (
          <div className="bg-red-500 text-white p-4 text-center mb-6 rounded-lg">
            <div className="flex items-center justify-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Error: {approveError}</span>
              <button onClick={() => setApproveError(undefined)} className="ml-4 text-white hover:text-gray-200">
                ✕
              </button>
            </div>
          </div>
        )}

        {isDepositSuccess && (
          <div className="bg-green-500 text-white p-4 text-center mb-6 rounded-lg">
            <div className="flex items-center justify-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Successfully deposited {depositAmount} PYUSD!</span>
              <button
                onClick={() => {
                  setDepositTxHash(undefined);
                  setDepositAmount("");
                }}
                className="ml-4 text-white hover:text-gray-200"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {depositError && (
          <div className="bg-red-500 text-white p-4 text-center mb-6 rounded-lg">
            <div className="flex items-center justify-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Error: {depositError}</span>
              <button onClick={() => setDepositError(undefined)} className="ml-4 text-white hover:text-gray-200">
                ✕
              </button>
            </div>
          </div>
        )}

        {isWithdrawSuccess && (
          <div className="bg-green-500 text-white p-4 text-center mb-6 rounded-lg">
            <div className="flex items-center justify-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Successfully withdrew {withdrawAmount} PYUSD!</span>
              <button
                onClick={() => {
                  setWithdrawTxHash(undefined);
                  setWithdrawAmount("");
                }}
                className="ml-4 text-white hover:text-gray-200"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {withdrawError && (
          <div className="bg-red-500 text-white p-4 text-center mb-6 rounded-lg">
            <div className="flex items-center justify-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Error: {withdrawError}</span>
              <button onClick={() => setWithdrawError(undefined)} className="ml-4 text-white hover:text-gray-200">
                ✕
              </button>
            </div>
          </div>
        )}

        <div className="text-center">
          <h1 className="text-5xl font-bold mb-4 text-base-content">Vault</h1>
          <p className="text-lg text-base-content/70 mb-4">Manage your pyUSD deposits and earn interest</p>
          <div className="flex justify-center gap-4 text-sm mb-12">
            <div className="flex items-center gap-2 bg-success/10 text-success px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              <span>Live</span>
            </div>
            <div className="flex items-center gap-2 bg-info/10 text-info px-3 py-1 rounded-full">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-2 bg-secondary/10 text-secondary px-3 py-1 rounded-full">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>5% APY</span>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-xl p-8 mb-8 min-h-[200px] flex items-center justify-center hover:shadow-2xl transition-all duration-300">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4 text-base-content/70">Total Vault Balance</h2>
            <div className="text-6xl font-bold text-base-content mb-2">{totalVaultAmount}</div>
            <div className="text-xl text-base-content/60 mb-4">pyUSD</div>
            <div className="flex items-center justify-center gap-2 text-sm text-success">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span>Growing with 5% APY</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4 text-base-content">Your PYUSD Balance</h3>
              <div className="text-4xl font-bold text-white mb-2">{userBalance}</div>
              <div className="text-lg text-base-content/60 mb-4">pyUSD</div>
              <div className="badge badge-primary badge-lg gap-1 px-4 py-2">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                Wallet
              </div>
            </div>
          </div>

          <div className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4 text-base-content">Your Vault Balance</h3>
              <div className="text-4xl font-bold text-secondary mb-2">{userVaultBalance}</div>
              <div className="text-lg text-base-content/60 mb-4">pyUSD</div>
              <div className="badge badge-secondary badge-lg gap-1 px-4 py-2">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {interestRate}% APY
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-6 mb-8">
          <button
            className="btn btn-secondary btn-lg px-8 gap-2 hover:scale-105 transition-all duration-200"
            onClick={() => setShowApproveModal(true)}
            disabled={!isConnected}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Approve
          </button>

          <button
            className="btn btn-primary btn-lg px-8 gap-2 hover:scale-105 transition-all duration-200"
            onClick={() => setShowDepositModal(true)}
            disabled={!isConnected}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Deposit
          </button>

          <button
            className="btn btn-outline border-base-content/20 hover:bg-base-100 text-base-content btn-lg px-8 gap-2 hover:scale-105 transition-all duration-200"
            onClick={() => setShowWithdrawModal(true)}
            disabled={!isConnected}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4m16 0l-4-4m4 4l-4 4" />
            </svg>
            Withdraw
          </button>
        </div>

        {!isConnected && (
          <div className="alert alert-warning mt-6 max-w-md mx-auto">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <span>Please connect your wallet to interact with the vault</span>
          </div>
        )}

        {showDepositModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-xl w-full max-w-md p-6">
              <h3 className="text-2xl font-bold mb-4 text-base-content">Deposit pyUSD</h3>
              <p className="text-base-content/70 mb-6">Enter the amount you want to deposit into the vault</p>

              <label className="form-control w-full mb-6">
                <span className="label-text mb-2 text-lg font-semibold text-base-content">Amount (pyUSD)</span>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  placeholder="0.00"
                  className="input input-bordered w-full text-lg bg-base-200 text-base-content"
                  step="0.01"
                  min="0"
                />
              </label>

              <div className="text-sm text-base-content/60 mb-4">
                <div>Available: {userBalance} pyUSD</div>
                <div>In Vault: {userVaultBalance} pyUSD</div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  className="btn btn-ghost text-white"
                  onClick={() => {
                    setShowDepositModal(false);
                    setDepositAmount("");
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleDeposit}
                  disabled={!depositAmount || parseFloat(depositAmount) <= 0 || isDepositLoading}
                >
                  {isDepositLoading ? "Depositing..." : "Deposit"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showApproveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-xl w-full max-w-md p-6">
              <h3 className="text-2xl font-bold mb-4 text-base-content">Approve pyUSD</h3>
              <p className="text-base-content/70 mb-6">Allow the vault to spend your pyUSD tokens</p>

              <label className="form-control w-full mb-6">
                <span className="label-text mb-2 text-lg font-semibold text-base-content">Amount (pyUSD)</span>
                <input
                  type="number"
                  value={approveAmount}
                  onChange={e => setApproveAmount(e.target.value)}
                  placeholder="1.00"
                  className="input input-bordered w-full text-lg bg-base-200 text-base-content"
                  step="0.01"
                  min="0"
                />
              </label>

              <div className="text-sm text-base-content/60 mb-4">
                This will approve the vault to spend {approveAmount} pyUSD on your behalf
              </div>

              <div className="flex justify-end gap-3">
                <button
                  className="btn btn-ghost text-white"
                  onClick={() => {
                    setShowApproveModal(false);
                    setApproveAmount("1");
                    setApproveTxHash(undefined);
                    setApproveError(undefined);
                  }}
                >
                  {isApproveSuccess ? "Close" : "Cancel"}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleApprove}
                  disabled={!approveAmount || parseFloat(approveAmount) <= 0 || isApproveLoading}
                >
                  {isApproveLoading ? "Approving..." : "Approve"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showWithdrawModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-xl w-full max-w-md p-6">
              <h3 className="text-2xl font-bold mb-4 text-base-content">Withdraw pyUSD</h3>
              <p className="text-base-content/70 mb-6">Enter the amount you want to withdraw from the vault</p>

              <label className="form-control w-full mb-6">
                <span className="label-text mb-2 text-lg font-semibold text-base-content">Amount (pyUSD)</span>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  className="input input-bordered w-full text-lg bg-base-200 text-base-content"
                  step="0.01"
                  min="0"
                  max={userBalance.replace(/,/g, "")}
                />
              </label>

              <div className="text-sm text-base-content/60 mb-4">
                <div>Available: {userBalance} pyUSD</div>
                <div>In Vault: {userVaultBalance} pyUSD</div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  className="btn btn-ghost text-white"
                  onClick={() => {
                    setShowWithdrawModal(false);
                    setWithdrawAmount("");
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleWithdraw}
                  disabled={
                    !withdrawAmount ||
                    parseFloat(withdrawAmount) <= 0 ||
                    parseFloat(withdrawAmount) > parseFloat(userBalance.replace(/,/g, "")) ||
                    isWithdrawLoading
                  }
                >
                  {isWithdrawLoading ? "Withdrawing..." : "Withdraw"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract, useScaffoldContract } from "~~/hooks/scaffold-eth";
import { useWriteContract } from "wagmi";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { Address } from "~~/components/scaffold-eth/Address/Address";
import { Balance } from "~~/components/scaffold-eth/Balance";
import { EtherInput } from "~~/components/scaffold-eth/Input/EtherInput";
import { AddressInput } from "~~/components/scaffold-eth/Input/AddressInput";

export default function SimulationPage() {
  const { address, isConnected } = useAccount();
  const [borrowerAddress, setBorrowerAddress] = useState("");
  const [borrowAmount, setBorrowAmount] = useState("");
  const [collateralAmount, setCollateralAmount] = useState("");
  const [createdWrapperAddress, setCreatedWrapperAddress] = useState("");
  const [repayAmount, setRepayAmount] = useState("");

  // Contract addresses (updated after redeploy)
  const mockUSDCAddress = "0x3F1ec566f7324Aa8279cb8DDb42dF89e16AE2e74";
  const mockPoolAddress = "0x11aA42C33c1d3E9BAA9E3C12C58B2a2ECa443838";

  // Read contract data
  const { data: registryAddress } = useScaffoldReadContract({
    contractName: "LoanWrapperRegistry",
    functionName: "provider",
  });

  const { data: allWrappers } = useScaffoldReadContract({
    contractName: "LoanWrapperRegistry", 
    functionName: "getAllWrappers",
  });

  // User balances
  const { data: mockUSDCBalance } = useScaffoldReadContract({
    contractName: "MockUSDC",
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  const { data: mockWETHBalance } = useScaffoldReadContract({
    contractName: "MockWETH",
    functionName: "balanceOf", 
    args: address ? [address] : undefined,
  });

  // Pool asset balances
  const { data: poolUSDCBalance } = useScaffoldReadContract({
    contractName: "MockUSDC",
    functionName: "balanceOf",
    args: [mockPoolAddress],
  });

  const { data: poolWETHBalance } = useScaffoldReadContract({
    contractName: "MockWETH",
    functionName: "balanceOf",
    args: [mockPoolAddress],
  });

  const { data: wrapperAddress } = useScaffoldReadContract({
    contractName: "LoanWrapperRegistry",
    functionName: "wrapperOf",
    args: borrowerAddress ? [borrowerAddress] : undefined,
  });

  // Get wrapper for current user
  const { data: userWrapperAddress } = useScaffoldReadContract({
    contractName: "LoanWrapperRegistry",
    functionName: "wrapperOf",
    args: address ? [address] : undefined,
  });

  // Write contract functions
  const { writeContractAsync: writeRegistry } = useScaffoldWriteContract({
    contractName: "LoanWrapperRegistry",
  });

  const { writeContractAsync: writeMockUSDC } = useScaffoldWriteContract({
    contractName: "MockUSDC",
  });

  const { writeContractAsync: writeMockWETH } = useScaffoldWriteContract({
    contractName: "MockWETH",
  });

  const { writeContractAsync: writeMockPool } = useScaffoldWriteContract({
    contractName: "MockAavePool",
  });

  // Write contract for LoanWrapper (for repay functionality)
  const { writeContractAsync: writeLoanWrapper } = useScaffoldWriteContract({
    contractName: "LoanWrapper",
  });

  // Actions
  const handleWrapLoan = async () => {
    if (!borrowerAddress || !borrowAmount || !collateralAmount) {
      alert("Please fill all fields");
      return;
    }

    try {
      console.log("Attempting to wrap loan with:");
      console.log("Borrower:", borrowerAddress);
      console.log("Borrow amount:", parseFloat(borrowAmount) * 1e6);
      console.log("Collateral amount:", parseFloat(collateralAmount) * 1e18);
      
      const tx = await writeRegistry({
        functionName: "wrapLoan",
        args: [borrowerAddress, BigInt(parseFloat(borrowAmount) * 1e6)], // USDC has 6 decimals
        value: BigInt(parseFloat(collateralAmount) * 1e18), // ETH to wei - this is the collateral
      });
      
      console.log("Transaction hash:", tx);
      
      // Get wrapper address after transaction
      setTimeout(() => {
        setCreatedWrapperAddress(wrapperAddress || "");
      }, 2000);
    } catch (error) {
      console.error("Error wrapping loan:", error);
      console.error("Full error:", error);
      alert("Transaction failed: " + (error as Error).message);
    }
  };

  const handleMintUSDC = async () => {
    try {
      await writeMockUSDC({
        functionName: "mint",
        args: [address, BigInt(1000000 * 1e6)], // 1M USDC
      });
    } catch (error) {
      console.error("Error minting USDC:", error);
    }
  };

  const handleMintWETH = async () => {
    try {
      await writeMockWETH({
        functionName: "deposit",
        value: BigInt(parseFloat(collateralAmount || "0") * 1e18),
      });
    } catch (error) {
      console.error("Error minting WETH:", error);
    }
  };

  const handleDepositToPool = async () => {
    try {
      // First approve USDC spending
      await writeMockUSDC({
        functionName: "approve", 
        args: [mockPoolAddress, BigInt(500000 * 1e6)],
      });
      
      // Then deposit USDC to pool
      await writeMockPool({
        functionName: "deposit",
        args: [mockUSDCAddress, BigInt(500000 * 1e6), address, 0],
      });
    } catch (error) {
      console.error("Error depositing to pool:", error);
    }
  };

  const handleRepayLoan = async () => {
    if (!repayAmount || !userWrapperAddress) {
      alert("Please enter repay amount and ensure you have a wrapper");
      return;
    }

    try {
      console.log("Attempting to repay loan:");
      console.log("Wrapper address:", userWrapperAddress);
      console.log("Repay amount:", parseFloat(repayAmount) * 1e6);
      
      // First approve USDC spending for the wrapper
      await writeMockUSDC({
        functionName: "approve",
        args: [userWrapperAddress, BigInt(parseFloat(repayAmount) * 1e6)],
      });
      
      // Then call decreaseDebt on the wrapper using useWriteContract
      await writeLoanWrapper({
        address: userWrapperAddress as `0x${string}`,
        abi: [
          {
            "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
            "name": "decreaseDebt",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
          }
        ],
        functionName: "decreaseDebt",
        args: [BigInt(parseFloat(repayAmount) * 1e6)],
      });
      
      console.log("Repay transaction successful");
      setRepayAmount(""); // Clear the input
    } catch (error) {
      console.error("Error repaying loan:", error);
      alert("Repay failed: " + (error as Error).message);
    }
  };

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-base-200 py-12 px-4">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold mb-6 text-white">Aave Simulation</h1>
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
        <h1 className="text-4xl font-bold mb-6 text-white">Aave Simulation</h1>
        
        {/* Account Info */}
        <div className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-white">Account Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-white">Address</p>
              <Address address={address} />
            </div>
            <div>
              <p className="text-sm text-white">ETH Balance</p>
              <Balance address={address} />
            </div>
            <div>
              <p className="text-sm text-white">Mock USDC Balance</p>
              <p className="font-mono">{mockUSDCBalance ? (Number(mockUSDCBalance) / 1e6).toFixed(2) : "0"} USDC</p>
            </div>
            <div>
              <p className="text-sm text-white">Mock WETH Balance</p>
              <p className="font-mono">{mockWETHBalance ? (Number(mockWETHBalance) / 1e18).toFixed(4) : "0"} WETH</p>
            </div>
          </div>
        </div>

        {/* Pool Info */}
        <div className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-white">Mock Aave Pool Assets</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-white">USDC in Pool</p>
              <p className="font-mono text-lg">{poolUSDCBalance ? (Number(poolUSDCBalance) / 1e6).toFixed(2) : "0"} USDC</p>
            </div>
            <div>
              <p className="text-sm text-white">WETH in Pool</p>
              <p className="font-mono text-lg">{poolWETHBalance ? (Number(poolWETHBalance) / 1e18).toFixed(4) : "0"} WETH</p>
            </div>
          </div>
        </div>

        {/* Mock Controls */}
        <div className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-white">Mock Controls</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              className="btn btn-primary"
              onClick={handleMintUSDC}
            >
              Mint 1M USDC
            </button>
            <button 
              className="btn btn-secondary"
              onClick={handleMintWETH}
            >
              Convert ETH to WETH
            </button>
            <button 
              className="btn btn-accent"
              onClick={handleDepositToPool}
            >
              Deposit 500k USDC to Pool
            </button>
          </div>
          <div className="mt-4 text-sm text-white">
            <p>• Mint USDC: Creates 1,000,000 USDC tokens in your account</p>
            <p>• Convert ETH: Wraps your ETH into WETH tokens</p>
            <p>• Deposit to Pool: Adds 500,000 USDC to the mock Aave pool for borrowing</p>
          </div>
        </div>

        {/* Loan Wrapping */}
        <div className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-white">Wrap Loan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Borrower Address</span>
              </label>
              <AddressInput
                value={borrowerAddress}
                onChange={setBorrowerAddress}
                placeholder="0x..."
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Borrow Amount (USDC)</span>
              </label>
              <input
                type="number"
                value={borrowAmount}
                onChange={(e) => setBorrowAmount(e.target.value)}
                placeholder="1000"
                className="input input-bordered"
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Collateral Amount (ETH)</span>
              </label>
              <EtherInput
                value={collateralAmount}
                onChange={setCollateralAmount}
                placeholder="1.0"
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Actions</span>
              </label>
              <button 
                className="btn btn-primary"
                onClick={handleWrapLoan}
              >
                Wrap Loan
              </button>
            </div>
          </div>
          
          {(createdWrapperAddress || wrapperAddress) && (
            <div className="mt-4 p-4 bg-success/10 rounded-lg">
              <p className="text-success font-semibold">Wrapper Created!</p>
              <p className="text-sm">Address: {createdWrapperAddress || wrapperAddress}</p>
            </div>
          )}
        </div>

        {/* My Wrapped Loans */}
        {userWrapperAddress && userWrapperAddress !== "0x0000000000000000000000000000000000000000" && (
          <div className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-white">My Wrapped Loan</h2>
            <div className="space-y-4">
              <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/70">Wrapper Address</p>
                    <p className="font-mono text-sm text-white">{userWrapperAddress}</p>
                  </div>
                  <div className="text-success">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-white/70">Status</p>
                    <p className="text-success font-semibold">Active</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/70">Owner</p>
                    <Address address={address} />
                  </div>
                </div>
              </div>
              
              {/* Repay Section */}
              <div className="p-4 bg-base-200 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-white">Repay Loan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-white">Repay Amount (USDC)</span>
                    </label>
                    <input
                      type="number"
                      value={repayAmount}
                      onChange={(e) => setRepayAmount(e.target.value)}
                      placeholder="100"
                      className="input input-bordered"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-white">Actions</span>
                    </label>
                    <button 
                      className="btn btn-warning"
                      onClick={handleRepayLoan}
                    >
                      Repay Loan
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-sm text-white/70">
                  <p>• Enter the amount of USDC you want to repay</p>
                  <p>• This will reduce your debt in the wrapper</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Registry Info */}
        <div className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Loan Wrapper Registry</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-white">Registry Address</p>
              <p className="font-mono text-sm">{registryAddress}</p>
            </div>
            <div>
              <p className="text-sm text-white">Total Wrappers Created</p>
              <p className="font-mono text-lg font-bold">{allWrappers?.length || 0}</p>
            </div>
          </div>
          
          {allWrappers && allWrappers.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-white mb-2">All Created Wrappers:</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {allWrappers.map((wrapper: string, index: number) => (
                  <div key={index} className="font-mono text-sm bg-base-200 p-2 rounded">
                    {wrapper}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

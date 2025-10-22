"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { useScaffoldReadContract, useScaffoldWriteContract, useDeployedContractInfo } from "~~/hooks/scaffold-eth";
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
  const [debtAmount, setDebtAmount] = useState("");
  const [collateralManageAmount, setCollateralManageAmount] = useState("");
  const [newEthPrice, setNewEthPrice] = useState("");
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);

  // Load deployed mock addresses dynamically
  const { data: mockUSDCInfo } = useDeployedContractInfo("MockUSDC");
  const { data: mockPYUSDInfo } = useDeployedContractInfo("MockPYUSD");
  const { data: mockWETHInfo } = useDeployedContractInfo("MockWETH");
  const { data: mockPoolInfo } = useDeployedContractInfo("MockPool");

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

  const { data: mockPYUSDBalance } = useScaffoldReadContract({
    contractName: "MockPYUSD",
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  // MockWETH9 exposes `balance(address)` in our mock
  const { data: mockWETHBalance } = useScaffoldReadContract({
    contractName: "MockWETH",
    functionName: "balance", 
    args: address ? [address] : undefined,
  });

  // Pool asset balances
  const { data: poolUSDCBalance } = useScaffoldReadContract({
    contractName: "MockUSDC",
    functionName: "balanceOf",
    args: mockPoolInfo?.address ? [mockPoolInfo.address] : undefined,
  });

  const { data: poolWETHBalance } = useScaffoldReadContract({
    contractName: "MockWETH",
    functionName: "balance",
    args: mockPoolInfo?.address ? [mockPoolInfo.address] : undefined,
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

  // Get wrapper details - using dynamic contract calls
  const { data: totalCollateral } = useScaffoldReadContract({
    contractName: "LoanWrapper",
    functionName: "getTotalCollateralValue",
    address: userWrapperAddress as `0x${string}`,
    abi: [
      {
        "inputs": [],
        "name": "getTotalCollateralValue",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      }
    ],
    args: [],
  });

  const { data: totalDebt } = useScaffoldReadContract({
    contractName: "LoanWrapper", 
    functionName: "getTotalDebtValue",
    address: userWrapperAddress as `0x${string}`,
    abi: [
      {
        "inputs": [],
        "name": "getTotalDebtValue",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      }
    ],
    args: [],
  });

  const { data: ownerCollateral } = useScaffoldReadContract({
    contractName: "LoanWrapper",
    functionName: "getOwnerCollateralValue",
    address: userWrapperAddress as `0x${string}`,
    abi: [
      {
        "inputs": [],
        "name": "getOwnerCollateralValue",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      }
    ],
    args: [],
  });

  const { data: investorCollateral } = useScaffoldReadContract({
    contractName: "LoanWrapper",
    functionName: "getInvestorCollateralValue",
    address: userWrapperAddress as `0x${string}`,
    abi: [
      {
        "inputs": [],
        "name": "getInvestorCollateralValue",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      }
    ],
    args: [],
  });

  const { data: isLocked } = useScaffoldReadContract({
    contractName: "LoanWrapper",
    functionName: "isLocked",
    address: userWrapperAddress as `0x${string}`,
    abi: [
      {
        "inputs": [],
        "name": "isLocked",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
      }
    ],
    args: [],
  });

  // Health Factor (from Registry helper)
  const { data: healthFactor } = useScaffoldReadContract({
    contractName: "LoanWrapperRegistry",
    functionName: "getHF",
    args: userWrapperAddress ? [userWrapperAddress] : undefined,
  });

  // ETH Price Oracle
  const { data: currentEthPrice, refetch: refetchEthPrice } = useScaffoldReadContract({
    contractName: "MockEthOracle",
    functionName: "latestAnswer",
  });

  const { data: priceDecimals } = useScaffoldReadContract({
    contractName: "MockEthOracle",
    functionName: "decimals",
  });

  const { writeContractAsync: setEthPrice } = useScaffoldWriteContract("MockEthOracle");

  // Format ETH price for display
  const formatEthPrice = (price: bigint | undefined, decimals: number | undefined) => {
    if (!price || !decimals) return "0.00";
    const divisor = BigInt(10 ** decimals);
    const wholePart = price / divisor;
    const fractionalPart = price % divisor;
    const fractionalStr = fractionalPart.toString().padStart(decimals, "0");
    return `${wholePart.toString()}.${fractionalStr.slice(0, 2)}`;
  };

  // Handle ETH price update
  const handleEthPriceUpdate = async () => {
    if (!newEthPrice || isUpdatingPrice) return;
    
    setIsUpdatingPrice(true);
    try {
      const priceFloat = parseFloat(newEthPrice);
      const priceWithDecimals = Math.floor(priceFloat * (10 ** (priceDecimals || 8)));
      
      await setEthPrice({
        functionName: "setPrice",
        args: [BigInt(priceWithDecimals)],
      });
      
      setNewEthPrice("");
      await refetchEthPrice();
    } catch (error) {
      console.error("Error updating ETH price:", error);
    } finally {
      setIsUpdatingPrice(false);
    }
  };

  // Debug: Log the values
  console.log("Debug - Wrapper Address:", userWrapperAddress);
  console.log("Debug - Total Collateral:", totalCollateral);
  console.log("Debug - Total Debt:", totalDebt);
  console.log("Debug - Owner Collateral:", ownerCollateral);
  console.log("Debug - Investor Collateral:", investorCollateral);

  // Write contract functions
  const { writeContractAsync: writeRegistry } = useScaffoldWriteContract({
    contractName: "LoanWrapperRegistry",
  });

  const { writeContractAsync: writeMockUSDC } = useScaffoldWriteContract({
    contractName: "MockUSDC",
  });

  const { writeContractAsync: writeMockPYUSD } = useScaffoldWriteContract({
    contractName: "MockPYUSD",
  });

  const { writeContractAsync: writeMockWETH } = useScaffoldWriteContract({
    contractName: "MockWETH",
  });

  const { writeContractAsync: writeMockPool } = useScaffoldWriteContract({
    contractName: "MockPool",
  });

  // Write contract for LoanWrapper (for repay functionality)
  const { writeContractAsync: writeLoanWrapper } = useScaffoldWriteContract({
    contractName: "LoanWrapper",
  });

  // Write contract for Vault actions
  const { writeContractAsync: writeVault } = useScaffoldWriteContract({
    contractName: "Vault",
  });

  // Write contract for wrapper management - using useWriteContract for dynamic contracts
  const { writeContractAsync: writeWrapper } = useWriteContract();

  // ---------- UI helpers (consistent white text/stat boxes) ----------
  const SectionCard: React.FC<{ title: string; children: React.ReactNode; className?: string }>=({ title, children, className })=> (
    <div className={`card bg-base-100 rounded-2xl border border-base-content/10 shadow-md p-6 ${className || ""}`}>
      <h2 className="text-2xl font-semibold mb-5 text-white">{title}</h2>
      {children}
    </div>
  );

  const StatBox: React.FC<{ label: string; children: React.ReactNode }>=({ label, children })=> (
    <div className="rounded-xl bg-base-200/60 border border-base-content/10 p-4">
      <p className="text-xs tracking-wide text-white mb-1">{label}</p>
      <div className="font-mono text-lg text-white">{children}</div>
    </div>
  );

  const ActionButton: React.FC<{
    label: string;
    subtitle?: string;
    onClick: () => void | Promise<void>;
    variant?: "primary" | "secondary" | "accent";
  }> = ({ label, subtitle, onClick, variant = "primary" }) => (
    <button
      onClick={onClick}
      className={`rounded-xl w-full text-left border border-base-content/10 p-5 transition-colors hover:border-base-content/20 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-base-200/60 ${
        variant === "primary"
          ? "hover:bg-primary/20"
          : variant === "secondary"
          ? "hover:bg-secondary/20"
          : "hover:bg-accent/20"
      }`}
    >
      <div className="text-white font-semibold">{label}</div>
      {subtitle && <div className="text-xs text-white/70 mt-1">{subtitle}</div>}
    </button>
  );

  // Sub-component for per-wrapper Vault controls with HF display
  const WrapperRow: React.FC<{ wrapper: `0x${string}` }> = ({ wrapper }) => {
    const { data: hf } = useScaffoldReadContract({
      contractName: "LoanWrapperRegistry",
      functionName: "getHF",
      args: [wrapper],
    });

    const onInject = async () => {
      try {
        await writeVault({ functionName: "injectToLoan", args: [wrapper] });
      } catch (e) {
        console.error("Vault injectToLoan error", e);
        alert((e as Error).message);
      }
    };

    const onWithdraw = async () => {
      try {
        await writeVault({ functionName: "withdrawFromLoan", args: [wrapper] });
      } catch (e) {
        console.error("Vault withdrawFromLoan error", e);
        alert((e as Error).message);
      }
    };

    const onLiquidate = async () => {
      try {
        await writeVault({ functionName: "liquidate", args: [wrapper] });
      } catch (e) {
        console.error("Vault liquidate error", e);
        alert((e as Error).message);
      }
    };

    return (
      <div className="flex items-center justify-between gap-4 p-3 rounded bg-base-200">
        <div className="flex flex-col">
          <span className="text-xs text-white/70">Wrapper</span>
          <span className="font-mono text-sm text-white">{wrapper}</span>
        </div>
        <div className="text-right">
          <span className="text-xs text-white/70">HF</span>
          <div className="font-mono text-sm text-white">
            {hf ? (Number(hf) / 1e18).toFixed(2) : "-"}
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-primary btn-sm" onClick={onInject}>Inject</button>
          <button className="btn btn-secondary btn-sm" onClick={onWithdraw}>Withdraw</button>
          <button className="btn btn-error btn-sm" onClick={onLiquidate}>Liquidate</button>
        </div>
      </div>
    );
  };

  // Actions
  const handleWrapLoan = async () => {
    if (!address || !borrowAmount || !collateralAmount) {
      alert("Please fill all fields and ensure you're connected");
      return;
    }

    try {
      const borrowAmountWei = BigInt(Math.floor(parseFloat(borrowAmount) * 1e6));
      const collateralAmountWei = BigInt(Math.floor(parseFloat(collateralAmount) * 1e18));
      
      console.log("Attempting to take loan via Cushion:");
      console.log("Borrower (you):", address);
      console.log("Borrow amount:", borrowAmountWei.toString());
      console.log("Collateral amount:", collateralAmountWei.toString());
      
      const tx = await writeRegistry({
        functionName: "wrapLoan",
        args: [address, borrowAmountWei],
        value: collateralAmountWei, // Only collateral, no fee
      });
      
      console.log("Transaction hash:", tx);
      
      // Get wrapper address after transaction
      setTimeout(() => {
        setCreatedWrapperAddress(wrapperAddress || "");
      }, 2000);
    } catch (error) {
      console.error("Error taking loan via Cushion:", error);
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

  const handleMintPYUSD = async () => {
    try {
      await writeMockPYUSD({
        functionName: "mint",
        args: [address, BigInt(1000000 * 1e6)], // 1M PYUSD
      });
    } catch (error) {
      console.error("Error minting PYUSD:", error);
    }
  };

  const handleMintWETH = async () => {
    try {
      await writeMockWETH({
        functionName: "deposit",
        value: BigInt(Math.floor(parseFloat(collateralAmount || "0") * 1e18)),
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
        args: mockPoolInfo?.address ? [mockPoolInfo.address, BigInt(500000 * 1e6)] : undefined,
      });
      
      // Then deposit USDC to pool
      await writeMockPool({
        functionName: "deposit",
        args: mockUSDCInfo?.address && address ? [mockUSDCInfo.address, BigInt(500000 * 1e6), address, 0] : undefined,
      });
    } catch (error) {
      console.error("Error depositing to pool:", error);
    }
  };

  

  const handleIncreaseCollateral = async () => {
    if (!collateralManageAmount || !userWrapperAddress) {
      alert("Please enter collateral amount and ensure you have a wrapper");
      return;
    }

    try {
      const amount = BigInt(Math.floor(parseFloat(collateralManageAmount) * 1e18));
      await writeWrapper({
        address: userWrapperAddress as `0x${string}`,
        abi: [
          {
            "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
            "name": "increaseCollateral",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
          },
          {
            "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
            "name": "decreaseCollateral",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
          },
          {
            "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
            "name": "increaseDebt",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
          },
          {
            "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
            "name": "decreaseDebt",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
          }
        ],
        functionName: "increaseCollateral",
        args: [amount],
        value: amount, // Send ETH as collateral
      });
      setCollateralManageAmount("");
    } catch (error) {
      console.error("Error increasing collateral:", error);
      alert("Increase collateral failed: " + (error as Error).message);
    }
  };

  const handleDecreaseCollateral = async () => {
    if (!collateralManageAmount || !userWrapperAddress) {
      alert("Please enter collateral amount and ensure you have a wrapper");
      return;
    }

    try {
      const amount = BigInt(Math.floor(parseFloat(collateralManageAmount) * 1e18));
      
      console.log("Attempting to decrease collateral:");
      console.log("Amount:", amount.toString());
      console.log("Wrapper address:", userWrapperAddress);
      console.log("Current collateral values:", {
        totalCollateral: totalCollateral?.toString(),
        ownerCollateral: ownerCollateral?.toString(),
        investorCollateral: investorCollateral?.toString(),
        isLocked: isLocked
      });

      // Validation checks
      if (isLocked) {
        alert("Wrapper is locked. Cannot decrease collateral.");
        return;
      }

      if (ownerCollateral && amount > ownerCollateral) {
        alert(`Cannot decrease more than your collateral. You have ${(Number(ownerCollateral) / 1e18).toFixed(4)} ETH collateral.`);
        return;
      }

      if (amount <= 0n) {
        alert("Amount must be greater than 0");
        return;
      }

      // Check if we have any collateral at all
      if (!totalCollateral || totalCollateral === 0n) {
        alert("No collateral available to decrease.");
        return;
      }

      // Health Factor warning - decreasing collateral makes position riskier
      console.log("⚠️ Warning: Decreasing collateral will make your position riskier!");
      console.log("Current collateral:", (Number(totalCollateral) / 1e18).toFixed(4), "ETH");
      console.log("Decreasing by:", (Number(amount) / 1e18).toFixed(4), "ETH");
      console.log("New collateral will be:", (Number(totalCollateral - amount) / 1e18).toFixed(4), "ETH");
      
      console.log("🔍 About to call decreaseCollateral with:");
      console.log("- Wrapper address:", userWrapperAddress);
      console.log("- Amount:", amount.toString());
      console.log("- Value (ETH):", (Number(amount) / 1e18).toFixed(4));
      console.log("- Owner collateral:", ownerCollateral?.toString());
      console.log("- Total collateral:", totalCollateral?.toString());
      console.log("- Amount vs Owner collateral:", amount > (ownerCollateral || 0n));
      
      // Listen for events
      console.log("📡 Listening for CollateralDecreased event...");
      
      await writeWrapper({
        address: userWrapperAddress as `0x${string}`,
        abi: [
          {
            "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
            "name": "increaseCollateral",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
          },
          {
            "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
            "name": "decreaseCollateral",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
          },
          {
            "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
            "name": "increaseDebt",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
          },
          {
            "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
            "name": "decreaseDebt",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
          }
        ],
        functionName: "decreaseCollateral",
        args: [amount],
        value: 0n, // No ETH sent for decrease
      });
      setCollateralManageAmount("");
    } catch (error) {
      console.error("Error decreasing collateral:", error);
      console.error("Full error:", error);
      
      // Parse specific error messages
      const errorMessage = (error as Error).message;
      if (errorMessage.includes("LoanWrapper__InvalidAmount")) {
        alert("Invalid amount: Cannot decrease more collateral than you have.");
      } else if (errorMessage.includes("LoanWrapper__BreaksHealthFactor")) {
        alert("Health Factor too low: Decreasing collateral would make the position unsafe.");
      } else if (errorMessage.includes("LoanWrapper__WrapperNotUnlocked")) {
        alert("Wrapper is locked: Cannot decrease collateral when locked.");
      } else if (errorMessage.includes("LoanWrapper__WithdrawFailed")) {
        alert("Withdraw failed: Could not send ETH back to you.");
      } else {
        alert("Decrease collateral failed: " + errorMessage);
      }
    }
  };

  const handleIncreaseDebt = async () => {
    if (!debtAmount || !userWrapperAddress) {
      alert("Please enter debt amount and ensure you have a wrapper");
      return;
    }

    try {
      const amount = BigInt(Math.floor(parseFloat(debtAmount) * 1e6));
      await writeWrapper({
        address: userWrapperAddress as `0x${string}`,
        abi: [
          {
            "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
            "name": "increaseCollateral",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
          },
          {
            "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
            "name": "decreaseCollateral",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
          },
          {
            "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
            "name": "increaseDebt",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
          },
          {
            "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
            "name": "decreaseDebt",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
          }
        ],
        functionName: "increaseDebt",
        args: [amount]
      });
      setDebtAmount("");
    } catch (error) {
      console.error("Error increasing debt:", error);
      alert("Increase debt failed: " + (error as Error).message);
    }
  };

  const handleDecreaseDebt = async () => {
    console.log("🔴 handleDecreaseDebt called");
    console.log("debtAmount:", debtAmount);
    console.log("userWrapperAddress:", userWrapperAddress);
    console.log("Stack trace:", new Error().stack);

    if (!debtAmount || debtAmount.trim() === "" || !userWrapperAddress) {
      alert("Please enter debt amount and ensure you have a wrapper");
      return;
    }

    const parsedAmount = parseFloat(debtAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Please enter a valid debt amount greater than 0");
      return;
    }

    try {
      const amount = BigInt(Math.floor(parsedAmount * 1e6));
      console.log("Parsed amount:", amount.toString());
      
      // First approve USDC spending for the wrapper
      await writeMockUSDC({
        functionName: "approve",
        args: [userWrapperAddress, amount],
      });
      
      await writeWrapper({
        address: userWrapperAddress as `0x${string}`,
        abi: [
          {
            "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
            "name": "increaseCollateral",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
          },
          {
            "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
            "name": "decreaseCollateral",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
          },
          {
            "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
            "name": "increaseDebt",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
          },
          {
            "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
            "name": "decreaseDebt",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
          }
        ],
        functionName: "decreaseDebt",
        args: [amount]
      });
      setDebtAmount("");
    } catch (error) {
      console.error("Error decreasing debt:", error);
      alert("Decrease debt failed: " + (error as Error).message);
    }
  };

  const handleRepayAllDebt = async () => {
    console.log("🟢 handleRepayAllDebt called");
    console.log("userWrapperAddress:", userWrapperAddress);
    console.log("totalDebt:", totalDebt);
    console.log("isLocked:", isLocked);
    console.log("Stack trace:", new Error().stack);

    if (!userWrapperAddress) {
      alert("Please ensure you have a wrapper");
      return;
    }

    if (!totalDebt || totalDebt === 0n) {
      alert("No debt to repay.");
      return;
    }

    if (isLocked) {
      alert("Wrapper is locked. Cannot repay debt.");
      return;
    }

    try {
      console.log("Attempting to repay all debt using repayLoan():");
      console.log("Amount:", totalDebt.toString());
      console.log("Wrapper address:", userWrapperAddress);
      
      // First approve USDC spending for the wrapper
      await writeMockUSDC({
        functionName: "approve",
        args: [userWrapperAddress, totalDebt],
      });
      
      await writeWrapper({
        address: userWrapperAddress as `0x${string}`,
        abi: [
          {
            "inputs": [],
            "name": "repayLoan",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
          }
        ],
        functionName: "repayLoan",
        args: []
      });
    } catch (error) {
      console.error("Error repaying all debt:", error);
      console.error("Full error:", error);
      
      // Parse specific error messages
      const errorMessage = (error as Error).message;
      if (errorMessage.includes("LoanWrapper__AccessDenied")) {
        alert("Access denied: Only Vault can call repayLoan(). Use regular repay instead.");
      } else if (errorMessage.includes("LoanWrapper__NothingToRepay")) {
        alert("Nothing to repay: No debt available.");
      } else {
        alert("Repay all debt failed: " + errorMessage);
      }
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
        
        {/* Top row: Account + Pool in one line */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <div className="flex flex-col gap-6">
        <SectionCard title="Account Info" className="h-full">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <StatBox label="Address">
              <Address address={address} />
            </StatBox>
            <StatBox label="ETH Balance">
              <Balance address={address} />
            </StatBox>
            <StatBox label="Mock USDC Balance">
              {mockUSDCBalance ? (Number(mockUSDCBalance) / 1e6).toFixed(2) : "0"} USDC
            </StatBox>
            <StatBox label="Mock PYUSD Balance">
              {mockPYUSDBalance ? (Number(mockPYUSDBalance) / 1e6).toFixed(2) : "0"} PYUSD
            </StatBox>
            <StatBox label="Mock WETH Balance">
              {mockWETHBalance ? (Number(mockWETHBalance) / 1e18).toFixed(4) : "0"} WETH
            </StatBox>
          </div>
        </SectionCard>
        {/* Take Loan via Cushion under Account Info */}
        <SectionCard title="Take Loan via Cushion" className="h-full">
          <div className="mb-4 p-4 bg-info/10 rounded-lg">
            <p className="text-sm text-white/80">
              <strong>How it works:</strong> You pay Cushion ETH (collateral + fee), Cushion takes a loan on Aave for you, and you receive USDC.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Borrow Amount (USDC)</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
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
                Take Loan via Cushion
              </button>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Info</span>
              </label>
              <p className="text-sm text-white/70">
                Fee will be calculated by smart contract
              </p>
            </div>
          </div>
          {(createdWrapperAddress || wrapperAddress) && (
            <div className="mt-4 p-4 bg-success/10 rounded-lg">
              <p className="text-success font-semibold">Loan Created via Cushion!</p>
              <p className="text-sm">Wrapper Address: {createdWrapperAddress || wrapperAddress}</p>
              <p className="text-sm text-white/70">You received USDC and Cushion manages your Aave position</p>
            </div>
          )}
        </SectionCard>
        </div>

        {/* Pool Info */}
        <div className="flex flex-col gap-6">
        <SectionCard title="Mock Aave Pool Assets" className="h-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatBox label="USDC in Pool">
              {poolUSDCBalance ? (Number(poolUSDCBalance) / 1e6).toFixed(2) : "0"} USDC
            </StatBox>
            <StatBox label="WETH in Pool">
              {poolWETHBalance ? (Number(poolWETHBalance) / 1e18).toFixed(4) : "0"} WETH
            </StatBox>
          </div>
        </SectionCard>
        {/* Mock Controls under Mock assets */}
        <SectionCard title="Mock Controls" className="">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button className="btn btn-primary w-full" onClick={handleMintUSDC}>
              Mint 1M USDC
            </button>
            <button className="btn btn-secondary w-full" onClick={handleMintPYUSD}>
              Mint 1M PYUSD
            </button>
            <button className="btn btn-primary w-full" onClick={handleMintWETH}>
              Convert ETH to WETH
            </button>
            <button className="btn btn-primary w-full" onClick={handleDepositToPool}>
              Deposit 500k USDC to Pool
            </button>
          </div>
          <div className="mt-4 text-sm text-white">
            <p>• Mint USDC: Creates 1,000,000 USDC tokens in your account</p>
            <p>• Mint PYUSD: Creates 1,000,000 PYUSD tokens in your account</p>
            <p>• Convert ETH: Wraps your ETH into WETH tokens</p>
            <p>• Deposit to Pool: Adds 500,000 USDC to the mock Aave pool for borrowing</p>
          </div>
        </SectionCard>
        </div>
        </div>

        {/* Take Loan via Cushion */}
        <div className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-white">Take Loan via Cushion</h2>
          <div className="mb-4 p-4 bg-info/10 rounded-lg">
            <p className="text-sm text-white/80">
              <strong>How it works:</strong> You pay Cushion ETH (collateral + fee), Cushion takes a loan on Aave for you, and you receive USDC.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                Take Loan via Cushion
              </button>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Info</span>
              </label>
              <p className="text-sm text-white/70">
                Fee will be calculated by smart contract
              </p>
            </div>
          </div>
          
          {(createdWrapperAddress || wrapperAddress) && (
            <div className="mt-4 p-4 bg-success/10 rounded-lg">
              <p className="text-success font-semibold">Loan Created via Cushion!</p>
              <p className="text-sm">Wrapper Address: {createdWrapperAddress || wrapperAddress}</p>
              <p className="text-sm text-white/70">You received USDC and Cushion manages your Aave position</p>
            </div>
          )}
        </div>

        {/* My Loan via Cushion */}
        {userWrapperAddress && userWrapperAddress !== "0x0000000000000000000000000000000000000000" && (
          <div className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-white">My Loan via Cushion</h2>
            <div className="mb-4 p-4 bg-info/10 rounded-lg">
              <p className="text-sm text-white/80">
                <strong>Managed by Cushion:</strong> Cushion handles your Aave position. You can adjust collateral and debt through Cushion.
              </p>
              {isLocked && (
                <div className="mt-2 p-2 bg-warning/10 rounded border border-warning/20">
                  <p className="text-sm text-warning">
                    <strong>⚠️ Loan is Locked:</strong> An investor has taken control of your loan. You cannot modify collateral or debt until the loan is unlocked.
                  </p>
                </div>
              )}
            </div>
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
                <div className="mt-3 grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-sm text-white/70">Status</p>
                    <p className={`font-semibold ${isLocked ? "text-warning" : "text-success"}`}>
                      {isLocked ? "🔒 Locked" : "✅ Active"}
                    </p>
                    {isLocked && (
                      <p className="text-xs text-warning/70 mt-1">
                        Investor has control
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-white/70">Owner</p>
                    <Address address={address} />
                  </div>
                  <div>
                    <p className="text-sm text-white/70">Health Factor</p>
                    <p className="font-mono text-sm text-white">
                      {healthFactor ? Number(formatUnits(healthFactor as bigint, 18)).toFixed(2) : "0.00"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-white/70">Total Collateral</p>
                    <p className="font-mono text-sm text-white">{totalCollateral ? (Number(totalCollateral) / 1e18).toFixed(4) : "0"} WETH</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/70">Total Debt</p>
                    <p className="font-mono text-sm text-white">{totalDebt ? (Number(totalDebt) / 1e6).toFixed(2) : "0"} USDC</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-white/70">Your Collateral</p>
                    <p className="font-mono text-sm text-white">{ownerCollateral ? (Number(ownerCollateral) / 1e18).toFixed(4) : "0"} WETH</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/70">Investor Collateral</p>
                    <p className="font-mono text-sm text-white">{investorCollateral ? (Number(investorCollateral) / 1e18).toFixed(4) : "0"} WETH</p>
                  </div>
                </div>
              </div>
              
              {/* Collateral Management via Cushion */}
              <div className="p-4 bg-base-200 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-white">Collateral Management via Cushion</h3>
                {isLocked && (
                  <div className="mb-3 p-2 bg-warning/10 rounded border border-warning/20">
                    <p className="text-sm text-warning">
                      <strong>⚠️ Locked:</strong> Collateral management is disabled while loan is locked.
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-white">Amount (ETH)</span>
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9]*[.,]?[0-9]*"
                      value={collateralManageAmount}
                      onChange={(e) => setCollateralManageAmount(e.target.value)}
                      placeholder="0.1"
                      className="input input-bordered"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-white">Actions</span>
                    </label>
                    <div className="flex gap-2">
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={handleIncreaseCollateral}
                      >
                        Add Collateral
                      </button>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={handleDecreaseCollateral}
                      >
                        Remove Collateral
                      </button>
                    </div>
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-white">Info</span>
                    </label>
                    <div className="text-sm text-white/70">
                      <p>• Add: Pay Cushion more ETH</p>
                      <p>• Remove: Cushion returns ETH</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Debt Management via Cushion */}
              <div className="p-4 bg-base-200 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-white">Debt Management via Cushion</h3>
                {isLocked && (
                  <div className="mb-3 p-2 bg-warning/10 rounded border border-warning/20">
                    <p className="text-sm text-warning">
                      <strong>⚠️ Locked:</strong> Debt management is disabled while loan is locked.
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-white">Amount (USDC)</span>
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9]*[.,]?[0-9]*"
                      value={debtAmount}
                      onChange={(e) => setDebtAmount(e.target.value)}
                      placeholder="100"
                      className="input input-bordered"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-white">Actions</span>
                    </label>
                    <div className="flex gap-2">
                      <button 
                        className="btn btn-accent btn-sm"
                        onClick={handleIncreaseDebt}
                      >
                        Borrow More
                      </button>
                      <button 
                        className="btn btn-warning btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDecreaseDebt();
                        }}
                      >
                        Repay Debt
                      </button>
                    </div>
                    <div className="mt-2">
                      <button 
                        className="btn btn-success btn-sm w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRepayAllDebt();
                        }}
                        disabled={!totalDebt || totalDebt === 0n || isLocked}
                      >
                        💳 Repay All Debt
                      </button>
                      {totalDebt && totalDebt > 0n && (
                        <p className="text-xs text-white/70 mt-1">
                          Repay: {(Number(totalDebt) / 1e6).toFixed(2)} USDC
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-white">Info</span>
                    </label>
                    <div className="text-sm text-white/70">
                      <p>• Borrow: Cushion gets more USDC from Aave</p>
                      <p>• Repay: Pay Cushion USDC to reduce debt</p>
                    </div>
                  </div>
                </div>
              </div>

              
            </div>
          </div>
        )}

        {/* ETH Price Simulator */}
        <div className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">ETH Price Simulator</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Price Display */}
            <div className="bg-base-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-white">Current ETH Price</h3>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  ${formatEthPrice(currentEthPrice, priceDecimals)}
                </div>
                <div className="text-sm text-white/70">
                  Oracle controls all ETH pricing
                </div>
              </div>
            </div>

            {/* Price Update */}
            <div className="bg-base-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-white">Update ETH Price</h3>
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text text-white">New ETH Price (USD)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="2000.00"
                    className="input input-bordered flex-1"
                    value={newEthPrice}
                    onChange={(e) => setNewEthPrice(e.target.value)}
                    step="0.01"
                    min="0"
                  />
                  <button
                    className={`btn btn-primary ${isUpdatingPrice ? "loading" : ""}`}
                    onClick={handleEthPriceUpdate}
                    disabled={!newEthPrice || isUpdatingPrice}
                  >
                    {isUpdatingPrice ? "Updating..." : "Update"}
                  </button>
                </div>
              </div>
              <div className="text-xs text-white/70 mt-2">
                Enter a price in USD (e.g., 2000.50)
              </div>
            </div>
          </div>

          {/* Quick Price Buttons */}
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2 text-white">Quick Price Updates</h4>
            <div className="flex flex-wrap gap-2">
              {[1500, 2000, 2500, 3000, 3500].map((price) => (
                <button
                  key={price}
                  className="btn btn-outline btn-sm"
                  onClick={() => setNewEthPrice(price.toString())}
                >
                  ${price}
                </button>
              ))}
            </div>
          </div>

          {/* Impact Information */}
          <div className="mt-4 bg-info/10 p-4 rounded-lg">
            <h4 className="text-sm font-semibold text-info mb-2">Price Impact</h4>
            <div className="text-xs text-white/70 space-y-1">
              <p>• <strong>Higher ETH price:</strong> Increases collateral value, improves Health Factor</p>
              <p>• <strong>Lower ETH price:</strong> Decreases collateral value, worsens Health Factor</p>
              <p>• <strong>Affects:</strong> All ETH collateral, swap rates, loan valuations</p>
            </div>
          </div>
        </div>

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

        {/* Vault Controls - 3rd party view */}
        <div className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-md p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4 text-white">Vault Controls (3rd Party)</h2>
          {allWrappers && allWrappers.length > 0 ? (
            <div className="space-y-2">
              {allWrappers.map((wrapper: string, idx: number) => (
                <WrapperRow key={idx} wrapper={wrapper as `0x${string}`} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/70">No wrappers yet.</p>
          )}
        </div>
      </div>
    </main>
  );
}

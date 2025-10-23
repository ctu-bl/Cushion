"use client";

import { useState } from "react";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export const useEthPrice = () => {
  const [newEthPrice, setNewEthPrice] = useState("");
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);

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
      // Error updating ETH price
    } finally {
      setIsUpdatingPrice(false);
    }
  };

  return {
    currentEthPrice,
    priceDecimals,
    newEthPrice,
    setNewEthPrice,
    isUpdatingPrice,
    formatEthPrice,
    handleEthPriceUpdate,
  };
};

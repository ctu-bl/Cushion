"use client";

import { useState, useCallback, useEffect } from "react";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export const useEthPrice = () => {
  const [newEthPrice, setNewEthPrice] = useState("");
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);
  const [priceHistory, setPriceHistory] = useState<Array<{
    timestamp: number;
    price: string;
    updateNumber: number;
  }>>([]);
  const [isInitialized, setIsInitialized] = useState(false);

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

  // Initialize with 60 default price points
  useEffect(() => {
    if (currentEthPrice && priceDecimals && !isInitialized) {
      const formatEthPrice = (price: bigint, decimals: number) => {
        const divisor = BigInt(10 ** decimals);
        const wholePart = price / divisor;
        const fractionalPart = price % divisor;
        const fractionalStr = fractionalPart.toString().padStart(decimals, "0");
        return `${wholePart.toString()}.${fractionalStr.slice(0, 2)}`;
      };

      const defaultPrice = formatEthPrice(currentEthPrice, priceDecimals);
      const now = Date.now();
      
      // Create 60 default price points (one for each minute of the hour)
      const defaultHistory = Array.from({ length: 60 }, (_, index) => ({
        timestamp: now - (59 - index) * 60000, // Spread over last hour
        price: defaultPrice,
        updateNumber: index + 1,
      }));

      setPriceHistory(defaultHistory);
      setIsInitialized(true);
    }
  }, [currentEthPrice, priceDecimals, isInitialized]);

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
  const handleEthPriceUpdate = useCallback(async () => {
    if (!newEthPrice || isUpdatingPrice) return;
    
    setIsUpdatingPrice(true);
    try {
      const priceFloat = parseFloat(newEthPrice);
      const priceWithDecimals = Math.floor(priceFloat * (10 ** (priceDecimals || 8)));
      
      await setEthPrice({
        functionName: "setPrice",
        args: [BigInt(priceWithDecimals)],
      });
      
      // Add to price history
      const newEntry = {
        timestamp: Date.now(),
        price: newEthPrice,
        updateNumber: priceHistory.length + 1,
      };
      
      setPriceHistory(prev => [...prev, newEntry]);
      setNewEthPrice("");
      await refetchEthPrice();
    } catch (error) {
      // Error updating ETH price
    } finally {
      setIsUpdatingPrice(false);
    }
  }, [newEthPrice, isUpdatingPrice, priceDecimals, setEthPrice, priceHistory.length, refetchEthPrice]);

  return {
    currentEthPrice,
    priceDecimals,
    newEthPrice,
    setNewEthPrice,
    isUpdatingPrice,
    formatEthPrice,
    handleEthPriceUpdate,
    priceHistory,
  };
};

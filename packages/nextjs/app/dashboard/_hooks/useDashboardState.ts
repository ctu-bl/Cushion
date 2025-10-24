"use client";

import { useState } from "react";

export const useDashboardState = () => {
  const [selectedInsuranceId, setSelectedInsuranceId] = useState<number | null>(null);
  const [showTakeModal, setShowTakeModal] = useState(false);
  const [hasActiveInsurance, setHasActiveInsurance] = useState(false);
  const [aaveLoanAddress, setAaveLoanAddress] = useState("");

  const openInsurance = (id: number) => {
    setSelectedInsuranceId(id);
    setHasActiveInsurance(true);
  };

  const closeInsurance = () => {
    setHasActiveInsurance(false);
    setSelectedInsuranceId(null);
  };

  const takeInsurance = () => {
    setShowTakeModal(false);
    setHasActiveInsurance(true);
    setSelectedInsuranceId(1);
  };

  const openTakeModal = () => {
    setShowTakeModal(true);
  };

  const closeTakeModal = () => {
    setShowTakeModal(false);
  };

  return {
    // State
    selectedInsuranceId,
    showTakeModal,
    hasActiveInsurance,
    aaveLoanAddress,
    
    // Setters
    setAaveLoanAddress,
    
    // Actions
    openInsurance,
    closeInsurance,
    takeInsurance,
    openTakeModal,
    closeTakeModal,
  };
};

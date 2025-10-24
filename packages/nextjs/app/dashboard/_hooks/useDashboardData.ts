"use client";

import { useMemo } from "react";

export type HealthStatus = "good" | "rescue" | "liquidated";

export interface DashboardData {
  collateralUsd: number;
  debtPyusd: number;
  walletPyusd: number;
  healthFactor: number;
  status: HealthStatus;
}

export const useDashboardData = () => {
  const data = useMemo<DashboardData>(
    () => ({
      collateralUsd: 12345.67,
      debtPyusd: 2345.89,
      walletPyusd: 987.65,
      healthFactor: 1.72,
      status: "good" as HealthStatus,
    }),
    [],
  );

  return { data };
};

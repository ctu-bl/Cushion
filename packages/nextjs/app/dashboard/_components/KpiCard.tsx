"use client";

import React from "react";

type KpiCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  emphasize?: boolean;
};

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  emphasize,
}) => {
  return (
    <div className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-md p-6">
      <p className="text-base-content/70 text-sm mb-1">{title}</p>
      <p className={`text-2xl font-bold ${emphasize ? "text-primary" : "text-base-content"}`}>{value}</p>
      {subtitle && <p className="text-base-content/60 text-xs mt-1">{subtitle}</p>}
    </div>
  );
};

export default KpiCard;

"use client";

import React from "react";

type SectionCardProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
};

export const SectionCard: React.FC<SectionCardProps> = ({ title, children, className }) => (
  <div className={`card bg-base-100 rounded-2xl border border-base-content/10 shadow-md p-6 ${className || ""}`}>
    <h2 className="text-2xl font-semibold mb-5 text-white">{title}</h2>
    {children}
  </div>
);

export default SectionCard;



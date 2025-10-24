"use client";

import React from "react";

type StatBoxProps = {
  label: string;
  children: React.ReactNode;
};

export const StatBox: React.FC<StatBoxProps> = ({ label, children }) => (
  <div className="rounded-xl bg-base-200/60 border border-base-content/10 p-2 min-h-[50px] flex flex-col justify-center items-center text-center">
    <p className="text-xs tracking-wide text-white mb-0.5">{label}</p>
    <div className="font-mono text-lg text-white">{children}</div>
  </div>
);

export default StatBox;



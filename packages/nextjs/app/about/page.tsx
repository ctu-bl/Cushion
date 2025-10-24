"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  GlobeAltIcon,
  HeartIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

type AboutItem = {
  id: number;
  title: string;
  summary: string;
  details: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const ITEMS: AboutItem[] = [
  {
    id: 1,
    title: "Liquidation Protection",
    summary: "Cushion lowers liquidation risk on Aave by wrapping each user into a per-borrower LoanWrapper",
    details:
      "Cushion manages the position for borrowers, providing preemptive defense by monitoring Health Factor and topping up collateral before liquidators can act.",
    Icon: ShieldCheckIcon,
  },
  {
    id: 2,
    title: "Isolated Accounts",
    summary: "Every borrower gets a dedicated wrapper for clean risk isolation",
    details:
      "Each borrower gets their own LoanWrapper contract, providing simpler repay/adjust flows and clean risk isolation from other users.",
    Icon: UserGroupIcon,
  },
  {
    id: 3,
    title: "Cushion Vault",
    summary: "Deposit PYUSD and earn interest on injected capital",
    details:
      "The vault holds PYUSD, mints LP tokens on deposit, and tracks deployed capital. LPs earn variable yield from protection fees and interest on injected capital.",
    Icon: SparklesIcon,
  },
  {
    id: 4,
    title: "Preemptive Defense",
    summary: "Monitors Health Factor and tops up collateral before liquidators",
    details:
      "The system triggers at a safer threshold to keep loans alive, providing additional collateral when health factor drops below threshold.",
    Icon: GlobeAltIcon,
  },
];

export default function AboutPage() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const items = useMemo(() => ITEMS, []);

  return (
    <main className="min-h-screen bg-base-200">
      <div className="container mx-auto">
        <h1 className="text-5xl font-bold mb-4 mt-12 text-center text-base-content">Cushion Overview</h1>
        <p className="text-lg text-base-content/70 text-center max-w-3xl mx-auto mb-12">
          Decentralized protection layer against liquidations in DeFi lending protocols.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {items.map(item => (
            <AboutCard
              key={item.id}
              item={item}
              isOpen={expandedId === item.id}
              onToggle={() => setExpandedId(prev => (prev === item.id ? null : item.id))}
            />
          ))}
        </div>
      </div>

      {/* Smart Contracts Section */}
      <section className="py-20 px-4 bg-base-100/50 backdrop-blur-sm mt-16">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-base-content text-center">Smart Contracts</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center p-6">
              <div className="w-16 h-16 bg-base-content/5 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-base-content" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-base-content mb-2">LoanWrapperRegistry</h3>
              <p className="text-sm text-base-content/70 text-center">Deploys new LoanWrapper for each borrower</p>
            </div>
            <div className="flex flex-col items-center p-6">
              <div className="w-16 h-16 bg-base-content/5 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-base-content" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-base-content mb-2">LoanWrapper</h3>
              <p className="text-sm text-base-content/70 text-center">Middle-man between lending protocol and borrower</p>
            </div>
            <div className="flex flex-col items-center p-6">
              <div className="w-16 h-16 bg-base-content/5 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-base-content" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-base-content mb-2">Vault</h3>
              <p className="text-sm text-base-content/70 text-center">Holds PYUSD and mints LP tokens</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function AboutCard({ item, isOpen, onToggle }: { item: AboutItem; isOpen: boolean; onToggle: () => void }) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const COLLAPSED_HEIGHT = 130;
  const [expandedHeight, setExpandedHeight] = useState<number>(COLLAPSED_HEIGHT);

  useEffect(() => {
    const detailsHeight = contentRef.current?.scrollHeight ?? 0;
    setExpandedHeight(COLLAPSED_HEIGHT + (detailsHeight > 0 ? detailsHeight + 24 : 0));
  }, [isOpen]);

  return (
    <div
      className="card bg-base-100 rounded-2xl border border-base-content/10 shadow-md hover:shadow-lg overflow-hidden transition-all duration-500 ease-in-out cursor-pointer"
      style={{ height: isOpen ? expandedHeight : COLLAPSED_HEIGHT }}
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
    >
      <div className="card-body p-6">
        <div className="flex items-start gap-4 justify-between">
          <div className="flex items-start gap-4">
            <span className="rounded-lg bg-base-200/70 w-10 h-10 grid place-items-center shrink-0 text-base-content">
              <item.Icon className="h-6 w-6" />
            </span>
            <div className="flex-1">
              <h3 className="text-2xl font-semibold leading-7 text-base-content mb-1">{item.title}</h3>
              <p className="text-base leading-6 text-base-content/80">{item.summary}</p>
            </div>
          </div>
          <div
            className={`transition-transform duration-300 ease-in-out text-base-content ${isOpen ? "rotate-90" : ""}`}
          >
            {isOpen ? (
              <ChevronRightIcon className="h-6 w-6 text-base-content" />
            ) : (
              <ChevronDownIcon className="h-6 w-6 text-base-content" />
            )}
          </div>
        </div>
        <div
          id={`about-item-${item.id}`}
          ref={contentRef}
          className={`transition-opacity duration-300 ease-out ${
            isOpen ? "mt-4 border-t border-base-content/10 pt-4 opacity-100" : "opacity-0"
          }`}
          aria-hidden={!isOpen}
        >
          <p className="text-base text-base-content/80 leading-relaxed">{item.details}</p>
        </div>
      </div>
    </div>
  );
}

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
    title: "ERC721 Loan Wrapper",
    summary: "Wrap existing Aave loans into NFTs for enhanced management and protection",
    details:
      "The Loan Wrapper uses flashloans to refinance your existing Aave position into an ERC721 NFT. This process repays your original debt, withdraws collateral, deposits it through the wrapper, and re-borrows the same amount. The wrapper acts as a middleware, allowing you to manage your loan while enabling third-party capital injection when your health factor drops below safety thresholds. All standard Aave operations (increase/decrease debt, add/remove collateral) remain available through the wrapper interface.",
    Icon: SparklesIcon,
  },
  {
    id: 2,
    title: "Automated Capital Injection",
    summary: "Smart contract automatically injects collateral when health factor approaches liquidation",
    details:
      "When your wrapped loan's health factor approaches dangerous levels, the Cushion vault automatically injects pyUSD as additional collateral. The injection amount is calculated using the formula: (total_collateral - total_debt) × (total_debt / total_collateral) / 2. During this protection period, your ability to withdraw collateral or increase debt is temporarily locked to protect both you and the vault. Once your health factor recovers sufficiently, the vault withdraws its injected capital plus accumulated interest.",
    Icon: UserGroupIcon,
  },
  {
    id: 3,
    title: "pyUSD Vault System",
    summary: "Deposit pyUSD, earn 15% APY, and power the liquidation protection mechanism",
    details:
      "The Cushion vault accepts pyUSD deposits and mints LP tokens (ERC4626 standard) representing your share of the pool. The LP token price is calculated as total vault value divided by issued LP tokens, where vault value includes available balance plus outstanding deployed capital with accrued interest. Interest accrues continuously using the formula: previous_rate × (1 + interest_rate)^(time_elapsed). Withdrawals may fail if insufficient liquidity is available due to capital deployed in active protection positions.",
    Icon: ShieldCheckIcon,
  },
  {
    id: 4,
    title: "Keeper Network",
    summary: "24/7 automated monitoring and execution of protection and liquidation operations",
    details:
      "Whitelisted keeper bots continuously monitor all wrapped loans for health factor thresholds. When a loan reaches the injection threshold, authorized keepers call inject_to_loan() to deploy vault capital. Similarly, when health factor recovers, keepers trigger withdraw_from_loan() to return capital to the vault. If a protected loan's health factor deteriorates again, keepers can initiate preemptive liquidation to minimize losses for both borrower and vault. The whitelist system ensures reliable execution while maintaining decentralized infrastructure across multiple keeper operators.",
    Icon: GlobeAltIcon,
  },
  {
    id: 5,
    title: "Flashloan Integration",
    summary: "Leverage flashloans for loan wrapping and efficient liquidation execution",
    details:
      "Cushion uses Aave flashloans for two critical operations: (1) Wrapping existing loans - flashloan is used to repay original debt, allowing collateral withdrawal and re-deposit through the wrapper contract, then the loan is re-borrowed to repay the flashloan. (2) Liquidation execution - when liquidating, the vault flashloans the debt asset, repays the loan, withdraws collateral, swaps to debt asset, and repays the flashloan. This capital-efficient approach allows operations without requiring upfront capital reserves.",
    Icon: RocketLaunchIcon,
  },
  {
    id: 6,
    title: "Reduced Liquidation Losses",
    summary: "Minimize liquidation penalties through proactive protection and controlled exits",
    details:
      "Traditional Aave liquidations can result in losses of 5-10% of collateral value. Cushion reduces this significantly by: (1) Preventing liquidation through timely collateral injection, (2) When liquidation becomes inevitable, executing it proactively before penalties compound, (3) Controlled liquidation execution that minimizes slippage and MEV extraction. While borrowers pay a small protection fee, the savings from avoided liquidation penalties far exceed the cost. The vault's profit comes from interest on deployed capital and liquidation spread capture.",
    Icon: HeartIcon,
  },
];

export default function AboutPage() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const items = useMemo(() => ITEMS, []);

  return (
    <main className="min-h-screen bg-base-200">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold mb-4 mt-8 text-center text-base-content">About Cushion</h1>
        <p className="text-lg text-base-content/70 text-center max-w-3xl mx-auto mb-12">
          A decentralized liquidation protection protocol built on Aave V3, utilizing smart contract automation, ERC721
          loan wrappers, and a pyUSD-based vault system to prevent costly liquidations in DeFi lending markets.
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

      {/* What is Cushion Section */}
      <section className="py-20 px-4 bg-base-100/50 backdrop-blur-sm mt-16">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-base-content text-center">What is Cushion?</h2>
          <div className="mb-8">
            <p className="text-lg text-base-content leading-relaxed mb-4">
              Cushion is a decentralized liquidation protection protocol designed to safeguard DeFi borrowers from the
              harsh penalties of loan liquidations. Built on Aave V3 and deployed on Sepolia testnet, Cushion introduces
              a novel two-sided marketplace where liquidity providers earn competitive yields while protecting borrowers
              from liquidation.
            </p>
            <p className="text-lg text-base-content leading-relaxed mb-4">
              The protocol wraps existing Aave loans into ERC721 NFTs using flashloan-based refinancing. When a
              borrower's health factor approaches liquidation (HF {"<"} threshold), the Cushion vault automatically
              injects pyUSD collateral to restore the position to safety. This injection is temporary - once the health
              factor recovers, the vault withdraws its capital plus accrued interest.
            </p>
            <p className="text-lg text-base-content leading-relaxed mb-4">
              For liquidity providers, Cushion offers an attractive yield opportunity. By depositing pyUSD into the
              vault, LPs receive ERC4626-compliant LP tokens representing their share of the pool. The vault generates
              returns from: (1) interest on deployed capital in protected loans, (2) protection fees paid by borrowers,
              and (3) profitable liquidation execution when protection becomes unsustainable.
            </p>
            <p className="text-lg text-base-content leading-relaxed">
              The entire system operates autonomously through a whitelisted network of keeper bots that monitor health
              factors, trigger capital injections, execute withdrawals, and perform liquidations when necessary. This
              creates a reliable, automated insurance layer for DeFi lending markets - reducing systemic risk while
              creating new yield opportunities.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
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
              <h3 className="font-semibold text-base-content mb-2">ERC721 Wrapper</h3>
              <p className="text-sm text-base-content/70 text-center">NFT-based loan management</p>
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
              <h3 className="font-semibold text-base-content mb-2">ERC4626 Vault</h3>
              <p className="text-sm text-base-content/70 text-center">Standard LP token vault</p>
            </div>
            <div className="flex flex-col items-center p-6">
              <div className="w-16 h-16 bg-base-content/5 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-base-content" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-base-content mb-2">pyUSD Native</h3>
              <p className="text-sm text-base-content/70 text-center">PayPal stablecoin integration</p>
            </div>
            <div className="flex flex-col items-center p-6">
              <div className="w-16 h-16 bg-base-content/5 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-base-content" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-base-content mb-2">Flashloan Powered</h3>
              <p className="text-sm text-base-content/70 text-center">Capital-efficient operations</p>
            </div>
            <div className="flex flex-col items-center p-6">
              <div className="w-16 h-16 bg-base-content/5 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-base-content" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-base-content mb-2">Whitelisted Keepers</h3>
              <p className="text-sm text-base-content/70 text-center">Authorized keeper network</p>
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

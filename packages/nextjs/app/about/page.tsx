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
    title: "Lorem ipsum",
    summary: "Lorem ipsum lorem ipsum lorem ipsum lorem ipsum",
    details:
      "lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum",
    Icon: SparklesIcon,
  },
  {
    id: 2,
    title: "lorem ipsum",
    summary: "lorem ipsum lorem ipsum lorem ipsum lorem ipsum",
    details:
      "lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum",
    Icon: UserGroupIcon,
  },
  {
    id: 3,
    title: "lorem ipsum",
    summary: "lorem ipsum lorem ipsum lorem ipsum lorem ipsum",
    details:
      "lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum",
    Icon: ShieldCheckIcon,
  },
  {
    id: 4,
    title: "lorem ipsum",
    summary: "lorem ipsum lorem ipsum lorem ipsum lorem ipsum",
    details:
      "lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum",
    Icon: GlobeAltIcon,
  },
  {
    id: 5,
    title: "lorem ipsum",
    summary: "lorem ipsum lorem ipsum lorem ipsum lorem ipsum",
    details:
      "lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum",
    Icon: RocketLaunchIcon,
  },
  {
    id: 6,
    title: "lorem ipsum",
    summary: "lorem ipsum lorem ipsum lorem ipsum lorem ipsum",
    details:
      "lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum",
    Icon: HeartIcon,
  },
];

export default function AboutPage() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const items = useMemo(() => ITEMS, []);

  return (
    <main className="container mx-auto py-12 px-4 md:px-8">
      <h1 className="text-4xl font-bold mb-4 text-center">About us</h1>
      <p className="text-lg text-base-content/70 text-center max-w-3xl mx-auto mb-12">
        Lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum
        lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum
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

      <div className="text-center mt-16">
        <h2 className="text-3xl font-bold mb-6 text-primary">What is Cushion?</h2>
        <div className="mb-8">
          <p className="text-lg text-base-content/80 leading-relaxed">
            lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum
            lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum
            lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum
            lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum
            lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum
            lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum
            lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum
            lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum
            lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum
            lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum
            lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum
            lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum
            lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum
            lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum
            lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum
            lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="flex flex-col items-center p-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-base-content mb-2">Heading1</h3>
            <p className="text-sm text-base-content/70 text-center">Text 1</p>
          </div>
          <div className="flex flex-col items-center p-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="font-semibold text-base-content mb-2">Heading2</h3>
            <p className="text-sm text-base-content/70 text-center">Text 2</p>
          </div>
          <div className="flex flex-col items-center p-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-base-content mb-2">Heading3</h3>
            <p className="text-sm text-base-content/70 text-center">Text 3</p>
          </div>
          <div className="flex flex-col items-center p-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-base-content mb-2">Heading4</h3>
            <p className="text-sm text-base-content/70 text-center">Text 4</p>
          </div>
          <div className="flex flex-col items-center p-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-base-content mb-2">Heading5</h3>
            <p className="text-sm text-base-content/70 text-center">Text 5</p>
          </div>
        </div>
      </div>
    </main>
  );
}

function AboutCard({ item, isOpen, onToggle }: { item: AboutItem; isOpen: boolean; onToggle: () => void }) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const COLLAPSED_HEIGHT = 200;
  const [expandedHeight, setExpandedHeight] = useState<number>(COLLAPSED_HEIGHT);

  useEffect(() => {
    const detailsHeight = contentRef.current?.scrollHeight ?? 0;
    setExpandedHeight(COLLAPSED_HEIGHT + (detailsHeight > 0 ? detailsHeight + 24 : 0));
  }, [isOpen]);

  return (
    <div
      className="card bg-base-100 rounded-2xl border border-base-300/60 shadow-md hover:shadow-lg overflow-hidden transition-all duration-500 ease-in-out"
      style={{ height: isOpen ? expandedHeight : COLLAPSED_HEIGHT }}
    >
      <div className="card-body py-6 md:py-7">
        <div
          className="flex items-start gap-4 justify-between cursor-pointer"
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
          <div className="flex items-start gap-4">
            <span className="rounded-lg bg-base-200/70 w-9 h-9 grid place-items-center shrink-0">
              <item.Icon className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <h3 className="text-xl font-semibold leading-7">{item.title}</h3>
              <p className="opacity-80 text-[15px] leading-6">{item.summary}</p>
            </div>
          </div>
          <button
            type="button"
            className={`btn btn-ghost btn-circle bg-base-200/60 hover:bg-base-300 transition-transform duration-300 ease-in-out ${
              isOpen ? "rotate-90" : ""
            }`}
            aria-label={isOpen ? "Close section" : "Open section"}
            onClick={e => {
              e.stopPropagation();
              onToggle();
            }}
          >
            {isOpen ? <ChevronRightIcon className="h-6 w-6" /> : <ChevronDownIcon className="h-6 w-6" />}
          </button>
        </div>
        <div
          id={`about-item-${item.id}`}
          ref={contentRef}
          className={`transition-opacity duration-300 ease-out ${
            isOpen ? "mt-5 border-t border-base-300/70 pt-5 opacity-100" : "opacity-0"
          }`}
          aria-hidden={!isOpen}
        >
          <p className="text-base-content/80 leading-7">{item.details}</p>
        </div>
      </div>
    </div>
  );
}

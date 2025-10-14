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
    </main>
  );
}

function AboutCard({ item, isOpen, onToggle }: { item: AboutItem; isOpen: boolean; onToggle: () => void }) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const COLLAPSED_HEIGHT = 200; // px
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

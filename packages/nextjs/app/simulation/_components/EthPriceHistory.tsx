"use client";

import React from "react";
import SectionCard from "../_components/SectionCard";

type EthPriceHistoryProps = {
  priceHistory: Array<{
    timestamp: number;
    price: string;
    updateNumber: number;
  }>;
};

export const EthPriceHistory: React.FC<EthPriceHistoryProps> = ({ priceHistory }) => {
  const chartWidth = 1500;
  const chartHeight = 600;
  const padding = 40;
  
  if (priceHistory.length === 0) {
    return (
      <SectionCard title="ETH Price History" className="h-full">
        <div className="text-center py-8">
          <p className="text-white/70">No price updates yet</p>
          <p className="text-sm text-white/50">Update ETH price to see history</p>
        </div>
      </SectionCard>
    );
  }

  const prices = priceHistory.map(entry => parseFloat(entry.price));
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  
  const paddedMin = 0;
  const paddedMax = maxPrice + (priceRange * 0.2);
  const paddedRange = paddedMax - paddedMin;
  
  const actualUpdates = priceHistory
    .filter(entry => entry.updateNumber > 60)
    .slice(-4) // Only show last 4 updates
    .map((entry, index) => ({
      ...entry,
      displayNumber: index + 1 // Renumber from 1
    }));
  
  const points = priceHistory.map((entry, index) => {
    const availableWidth = (chartWidth - 60) - 2 * padding;
    const x = padding + (index / Math.max(priceHistory.length - 1, 1)) * availableWidth;
    const y = padding + ((paddedMax - parseFloat(entry.price)) / paddedRange) * (chartHeight - 2 * padding);
    return { x, y, price: entry.price, updateNumber: entry.updateNumber };
  });
  
  const pathData = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ');
  
  const areaPath = `${pathData} L ${points[points.length - 1].x} ${chartHeight - padding} L ${padding} ${chartHeight - padding} Z`;

  return (
    <SectionCard title="ETH Price History" className="h-full">
      <div className="space-y-4">
        {/* Chart */}
        <div className="bg-base-200/30 rounded-lg p-2 relative">
          {/* Y-axis labels */}
          <div className="absolute left-2 top-2 bottom-2 flex flex-col justify-between text-xs text-white/70">
            <span>${Math.round(paddedMax)}</span>
            <span>${Math.round(paddedMax * 0.75)}</span>
            <span>${Math.round(paddedMax * 0.5)}</span>
            <span>${Math.round(paddedMax * 0.25)}</span>
            <span>$0</span>
          </div>
          
          <svg width="100%" height={chartHeight} className="w-full ml-8" viewBox={`0 0 ${chartWidth - 60} ${chartHeight}`}>
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Area fill */}
            <path d={areaPath} fill="url(#gradient)" opacity="0.3" />
            
            {/* Line */}
            <path d={pathData} fill="none" stroke="currentColor" strokeWidth="4" className="text-green-500" />
            
            {/* Data points */}
            {points.map((point, index) => {
              const isDefaultPoint = point.updateNumber <= 60;
              return (
                <g key={index}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={isDefaultPoint ? "1" : "4"}
                    fill="currentColor"
                    className={isDefaultPoint ? "text-white/30" : "text-green-500"}
                  />
                  {!isDefaultPoint && (
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      className="text-green-500/50"
                    />
                  )}
                </g>
              );
            })}
            
            {/* Gradient definition */}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" className="text-green-500" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" className="text-green-500" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        
        {/* Price points info - only show last 4 actual updates */}
        {actualUpdates.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {actualUpdates.map((entry, index) => (
              <div key={index} className="bg-base-200/60 rounded p-2 text-center">
                <div className="text-xs text-white/70">#{entry.displayNumber}</div>
                <div className="text-sm font-bold text-white">${entry.price}</div>
              </div>
            ))}
          </div>
        )}
        
        {/* Summary */}
        <div className="flex justify-between items-center text-sm pt-2 border-t border-base-content/10">
          <span className="text-white/70">Total Updates:</span>
          <span className="font-bold text-white">{actualUpdates.length}</span>
        </div>
      </div>
    </SectionCard>
  );
};

export default EthPriceHistory;

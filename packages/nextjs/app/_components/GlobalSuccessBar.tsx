"use client";

import React, { useEffect, useState } from "react";

type GlobalSuccessBarProps = {
  message: string;
  blockExplorerLink?: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
};

export const GlobalSuccessBar: React.FC<GlobalSuccessBarProps> = ({
  message,
  blockExplorerLink,
  isVisible,
  onClose,
  duration = 3000,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setTimeout(onClose, 300); // Wait for animation to complete
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 bg-green-500 text-white transition-all duration-300 ${
        isAnimating 
          ? 'translate-y-0 opacity-100' 
          : '-translate-y-full opacity-0'
      }`}
    >
      <div className="w-full px-4 py-3 flex items-center justify-center gap-3 shadow-lg">
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-semibold text-center">{message}</span>
        {blockExplorerLink && (
          <a 
            href={blockExplorerLink} 
            target="_blank" 
            rel="noreferrer" 
            className="text-sm text-blue-200 hover:text-blue-100 underline transition-colors flex-shrink-0"
          >
            View on block explorer
          </a>
        )}
        <button
          onClick={onClose}
          className="ml-auto text-white hover:text-gray-200 transition-colors flex-shrink-0"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default GlobalSuccessBar;

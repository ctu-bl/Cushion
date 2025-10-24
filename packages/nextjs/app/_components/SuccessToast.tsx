"use client";

import React, { useEffect, useState } from "react";

type SuccessToastProps = {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
};

export const SuccessToast: React.FC<SuccessToastProps> = ({
  message,
  isVisible,
  onClose,
  duration = 2000,
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
      className={`fixed top-14 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${
        isAnimating 
          ? 'translate-y-0 opacity-100' 
          : '-translate-y-full opacity-0'
      }`}
    >
      <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px]">
        <div className="flex-shrink-0">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <span className="font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-auto text-white hover:text-gray-200 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default SuccessToast;

"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import GlobalSuccessBar from "../_components/GlobalSuccessBar";

type SuccessBarContextType = {
  showSuccess: (message: string, blockExplorerLink?: string) => void;
};

const SuccessBarContext = createContext<SuccessBarContextType | undefined>(undefined);

export const useSuccessBar = () => {
  const context = useContext(SuccessBarContext);
  if (!context) {
    throw new Error("useSuccessBar must be used within a SuccessBarProvider");
  }
  return context;
};

export const SuccessBarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [blockExplorerLink, setBlockExplorerLink] = useState<string | undefined>();

  const showSuccess = useCallback((msg: string, link?: string) => {
    setMessage(msg);
    setBlockExplorerLink(link);
    setIsVisible(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsVisible(false);
  }, []);

  return (
    <SuccessBarContext.Provider value={{ showSuccess }}>
      {children}
      <GlobalSuccessBar
        message={message}
        blockExplorerLink={blockExplorerLink}
        isVisible={isVisible}
        onClose={handleClose}
      />
    </SuccessBarContext.Provider>
  );
};

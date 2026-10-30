'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface PhiContextType {
  phiMasked: boolean;
  setPhiMasked: (masked: boolean) => void;
  togglePhiMask: () => void;
  maskName: (name: string | undefined | null) => string;
}

const PhiContext = createContext<PhiContextType>({
  phiMasked: false,
  setPhiMasked: () => { },
  togglePhiMask: () => { },
  maskName: (name) => name || '',
});

export const PhiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [phiMasked, setPhiMasked] = useState(false);

  const togglePhiMask = () => setPhiMasked((prev) => !prev);

  const maskName = (name: string | undefined | null): string => {
    if (!name) return '';
    if (!phiMasked) return name;
    // Replace letters with bullet dots for PHI privacy
    return name.replace(/[a-zA-Z0-9]/g, '•');
  };

  return (
    <PhiContext.Provider value={{ phiMasked, setPhiMasked, togglePhiMask, maskName }}>
      {children}
    </PhiContext.Provider>
  );
};

export const usePhi = () => useContext(PhiContext);

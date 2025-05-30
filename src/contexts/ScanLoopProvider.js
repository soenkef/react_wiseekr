// contexts/ScanLoopProvider.js
import { createContext, useContext, useRef } from 'react';

const ScanLoopContext = createContext();

export function ScanLoopProvider({ children }) {
  const loopingRef = useRef(false);
  const scanIdRef = useRef(null);

  return (
    <ScanLoopContext.Provider value={{ loopingRef, scanIdRef }}>
      {children}
    </ScanLoopContext.Provider>
  );
}

export const useScanLoop = () => useContext(ScanLoopContext);

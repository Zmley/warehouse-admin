// src/contexts/BinContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { getBinsInWarehouse } from "../api/binApi";

export interface Bin {
  binID: string;
  binCode: string;
}

interface BinContextType {
  bins: Bin[];
  loading: boolean;
  error: string | null;
  refreshBins: () => void;
}

const BinContext = createContext<BinContextType | undefined>(undefined);

export const BinProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [bins, setBins] = useState<Bin[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBins = async () => {
    try {
      setLoading(true);
      const data = await getBinsInWarehouse();
      setBins(data);
      setError(null);
    } catch (err) {
      setError("❌ Failed to load bins");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBins();
  }, []);

  const refreshBins = () => {
    fetchBins();
  };

  return (
    <BinContext.Provider value={{ bins, loading, error, refreshBins }}>
      {children}
    </BinContext.Provider>
  );
};

export const useBinContext = () => {
  const context = useContext(BinContext);
  if (!context) {
    throw new Error("useBinContext must be used within a BinProvider");
  }
  return context;
};

import { useCallback } from "react";
import { getAllBinCodesInWarehouse } from "../api/binApi";

export const useBin = () => {
  const fetchAllBinCodes = useCallback(async (): Promise<string[]> => {
    return await getAllBinCodesInWarehouse();
  }, []);

  return { fetchAllBinCodes };
};

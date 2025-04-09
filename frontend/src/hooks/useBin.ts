// src/hooks/useBin.ts
import { useCallback, useEffect, useState } from "react";
import { getBinsInWarehouse } from "../api/binApi";

export const useBin = (autoLoad: boolean = false) => {
  // 更新状态，保存完整的 bins 数组
  const [bins, setBins] = useState<{ binID: string; binCode: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 获取所有 bins 数据的异步方法
  const fetchAllBins = useCallback(async (): Promise<
    { binID: string; binCode: string }[]
  > => {
    try {
      setLoading(true);
      const binsData = await getBinsInWarehouse(); // 获取完整的 bins 数组
      setBins(binsData); // 保存完整的 bins 数据
      setError(null);
      return binsData; // 返回完整的 bins 数组
    } catch (err) {
      setError("❌ Failed to fetch bins");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) {
      fetchAllBins();
    }
  }, [autoLoad, fetchAllBins]);

  return {
    bins, // 返回完整的 bins 数据
    loading,
    error,
    fetchAllBins, // 提供 fetchAllBins 方法供调用者使用
  };
};

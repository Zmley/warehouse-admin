import apiClient from "./axiosClient.ts";
import { Bin } from "../types/bin.js";

export const getBinByBinCode = async (binCode: string): Promise<Bin> => {
  const response = await apiClient.get(`/bins/${binCode}`);
  return response.data.bin;
};

export const getBinCodesByProductCode = async (
  productCode: string
): Promise<string[]> => {
  const response = await apiClient.get(`/bins/code/${productCode}`);
  return response.data.binCodes;
};

export const getBinsInWarehouse = async (): Promise<
  { binID: string; binCode: string }[]
> => {
  const response = await apiClient.get("/bins");
  return response.data.bins;
};

export const deleteBinInWarehouse = async (binID: string): Promise<any> => {
  // 调用删除 bin 的 API
  const response = await apiClient.delete(`/bins/${binID}`);
  return response.data;
};

import apiClient from "./axiosClient.ts";

export const getAllWarehouses = async () => {
  const response = await apiClient.get("/warehouses");
  return response.data;
};

export const getWarehouseById = async (warehouseID: string) => {
  const response = await apiClient.get(`/warehouses/${warehouseID}`);
  return response.data;
};

import apiClient from "./axiosClient.ts"; // 导入配置好的 Axios 实例

// 获取所有仓库
export const getAllWarehouses = async () => {
  const response = await apiClient.get("/warehouses"); // 添加了前缀 '/warehouses'
  return response.data;
};

// 获取单个仓库
export const getWarehouseById = async (warehouseID: string) => {
  const response = await apiClient.get(`/warehouses/${warehouseID}`); // 添加了前缀 '/warehouses'
  return response.data;
};

// 创建新的仓库
export const createWarehouse = async (warehouseCode: string) => {
  const response = await apiClient.post("/warehouses", { warehouseCode }); // 添加了前缀 '/warehouses'
  return response.data;
};

// 更新仓库信息
export const updateWarehouse = async (
  warehouseID: string,
  warehouseCode: string
) => {
  const response = await apiClient.put(`/warehouses/${warehouseID}`, {
    warehouseCode,
  }); // 添加了前缀 '/warehouses'
  return response.data;
};

// 删除仓库
export const deleteWarehouse = async (warehouseID: string) => {
  const response = await apiClient.delete(`/warehouses/${warehouseID}`); // 添加了前缀 '/warehouses'
  return response.data;
};

import apiClient from "./axiosClient.ts";

// ✅ 获取所有库存（InventoryPage 用）
export const fetchInventory = async () => {
  const response = await apiClient.get("/inventories/all");
  return { inventory: response.data.inventories };
};

// ✅ 删除某个库存项
export const deleteInventoryItem = async (inventoryID: string) => {
  const response = await apiClient.delete(`/inventories/${inventoryID}`);
  return response.data;
};

// ✅ 添加新的库存项（需要根据你后端参数结构来调整）
export const addInventoryItem = async (newItem: {
  productCode: string;
  binID: string;
  quantity: number;
}) => {
  const response = await apiClient.post("/inventories", newItem);
  return response.data;
};

// ✅ 更新库存数量（支持更新单个字段或多个字段）
export const updateInventoryItem = async (
  inventoryID: string,
  updatedFields: {
    quantity?: number;
    productCode?: string;
    binID?: string;
  }
) => {
  const response = await apiClient.put(
    `/inventories/${inventoryID}`,
    updatedFields
  );
  return response.data;
};

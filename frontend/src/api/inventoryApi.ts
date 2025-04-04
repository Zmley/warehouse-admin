import apiClient from "./axiosClient.ts";

export const fetchBinsForUser = async () => {
  try {
    const response = await apiClient.get("/api/inventory/bins-for-user");
    console.log("🟢 Fetched Bins:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Failed to fetch bins:", error);
    throw error;
  }
};

export const fetchInventory = async () => {
  try {
    const response = await apiClient.get("/api/inventory");
    console.log("🟢 fetch database data successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌:fetch database data failed", error);
    throw error;
  }
};

export const addInventoryItem = async (item: {
  warehouse_code: string;
  bin_code: string;
  product_code: string;
  quantity: number;
  bin_qr_code: string;
}) => {
  try {
    const response = await apiClient.post("/api/inventory", item);
    console.log("successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("add inventory failed:", error);
    throw error;
  }
};

export const updateInventoryItem = async (
  inventoryID: string,
  updatedData: Partial<any>
) => {
  if (!inventoryID) {
    console.error("❌ Missing inventoryID in API call");
    return;
  }

  try {
    console.log(`🟢 API Call: PUT /api/inventory/${inventoryID}`, updatedData);
    const response = await apiClient.put(
      `/api/inventory/${inventoryID}`,
      updatedData
    );
    console.log("🟢 更新库存成功:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ 更新库存失败:", error);
    throw error;
  }
};

export const deleteInventoryItem = async (id: string) => {
  try {
    await apiClient.delete(`/api/inventory/${id}`);
    console.log(`🟢 删除库存成功: ${id}`);
  } catch (error) {
    console.error(`❌ 删除库存失败: ${id}`, error);
    throw error;
  }
};

export const fetchInventoryItem = async (id: string) => {
  try {
    console.log(`🔍 Fetching inventory item with ID: ${id}`);

    const response = await apiClient.get(`/api/inventory/${id}`);

    console.log("✅ Inventory item received:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Failed to fetch inventory item:", error);
    throw error;
  }
};

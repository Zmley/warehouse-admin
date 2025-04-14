import apiClient from "./axiosClient.ts";

export const fetchInventory = async (warehouseID: string) => {
  const response = await apiClient.get(`/inventories`, {
    params: { warehouseID },
  });
  return { inventory: response.data.inventories };
};

export const deleteInventoryItem = async (inventoryID: string) => {
  const response = await apiClient.delete(`/inventories/${inventoryID}`);
  return response.data;
};

export const addInventoryItem = async (newItem: {
  productCode: string;
  binID: string;
  quantity: number;
}) => {
  const response = await apiClient.post("/inventories", newItem);
  return response.data;
};

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

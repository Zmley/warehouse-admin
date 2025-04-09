import Bin from "routes/bins/bin.model";
import { Inventory } from "./inventory.model";

export const getAllInventories = async () => {
  const inventories = await Inventory.findAll({
    include: [
      {
        model: Bin,
        attributes: ["binCode"],
      },
    ],
  });

  return inventories;
};

export const deleteInventoryItem = async (
  inventoryID: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // 查找指定的库存项
    const inventoryItem = await Inventory.findByPk(inventoryID);

    if (!inventoryItem) {
      return { success: false, message: "Inventory item not found" };
    }

    // 删除库存项
    await inventoryItem.destroy();
    return { success: true, message: "Inventory item deleted successfully" };
  } catch (error) {
    console.error(error);
    throw new Error("Error deleting inventory item");
  }
};

// services/inventory.service.ts

// 添加新的库存项

export const addInventoryItemService = async ({
  productCode,
  binID,
  quantity,
}: {
  productCode: string;
  binID: string;
  quantity: number;
}) => {
  try {
    // Check if the product already exists in the specified bin
    const existingItem = await Inventory.findOne({
      where: { productCode, binID },
    });

    if (existingItem) {
      // If the product already exists in the bin, return an error response
      return {
        success: false,
        message: "This product is already added to the bin.",
      };
    }

    // If the product does not exist, create a new inventory item
    const newItem = await Inventory.create({
      productCode,
      binID,
      quantity,
    });

    return {
      success: true,
      data: newItem, // Return the newly created inventory item
    };
  } catch (error) {
    // Catch and handle any errors
    return {
      success: false,
      message: error.message || "Failed to add inventory item",
    };
  }
};

// 更新库存项
export const updateInventoryItemService = async (
  inventoryID: string,
  updatedFields: { quantity?: number; productID?: string; binID?: string }
) => {
  try {
    const inventoryItem = await Inventory.findByPk(inventoryID);
    if (!inventoryItem) {
      return null; // 如果库存项未找到，返回 null
    }

    // 更新库存项字段
    await inventoryItem.update(updatedFields);
    return inventoryItem;
  } catch (error) {
    throw new Error("Failed to update inventory item");
  }
};

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
    // 查找当前 bin 中是否已经存在该 productCode
    const existingItem = await Inventory.findOne({
      where: { productCode, binID },
    });

    if (existingItem) {
      // 如果产品已存在，直接增加数量
      existingItem.quantity += quantity;
      await existingItem.save(); // 更新数量

      return {
        success: true,
        message: `Product quantity updated successfully.`,
        data: existingItem, // 返回更新后的库存项
      };
    }

    // 如果产品不存在，则创建新的库存项
    const newItem = await Inventory.create({
      productCode,
      binID,
      quantity,
    });

    return {
      success: true,
      data: newItem, // 返回新创建的库存项
    };
  } catch (error) {
    // 捕获并处理任何错误
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

import { Request, Response, NextFunction } from "express";
import {
  getAllInventories,
  deleteInventoryItem,
  addInventoryItemService,
  updateInventoryItemService,
} from "./inventory.service";

export const getAllInventoriesController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const inventories = await getAllInventories();
    res.status(200).json({ inventories });
  } catch (error) {
    next(error);
  }
};

export const deleteInventoryItemController = async (
  req: Request,
  res: Response
) => {
  const { inventoryID } = req.params;

  try {
    const result = await deleteInventoryItem(inventoryID);

    if (result.success) {
      return res.status(200).json({ message: result.message });
    } else {
      return res.status(404).json({ message: result.message });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error deleting inventory item" });
  }
};

// 添加新的库存项
export const addInventoryItemController = async (
  req: Request,
  res: Response
) => {
  const { productCode, binID, quantity } = req.body;

  try {
    const newItem = await addInventoryItemService({
      productCode,
      binID,
      quantity,
    });
    return res.status(201).json(newItem);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error adding inventory item" });
  }
};

// 更新库存项
export const updateInventoryItemController = async (
  req: Request,
  res: Response
) => {
  const { inventoryID } = req.params;
  const updatedFields = req.body;

  try {
    const updatedItem = await updateInventoryItemService(
      inventoryID,
      updatedFields
    );
    if (updatedItem) {
      return res.status(200).json(updatedItem);
    } else {
      return res.status(404).json({ message: "Inventory item not found" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error updating inventory item" });
  }
};

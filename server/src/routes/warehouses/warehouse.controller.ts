// warehouses/warehouse.controller.ts
import { Request, Response } from "express";
import {
  getAllWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
} from "./warehouse.service";

// 获取所有仓库
export const getAllWarehousesHandler = async (req: Request, res: Response) => {
  try {
    const warehouses = await getAllWarehouses();
    res.status(200).json(warehouses);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// 获取单个仓库
export const getWarehouseByIdHandler = async (req: Request, res: Response) => {
  const { warehouseID } = req.params;
  try {
    const warehouse = await getWarehouseById(warehouseID);
    res.status(200).json(warehouse);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// 创建仓库
export const createWarehouseHandler = async (req: Request, res: Response) => {
  const { warehouseCode } = req.body;
  try {
    const newWarehouse = await createWarehouse(warehouseCode);
    res.status(201).json(newWarehouse);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// 更新仓库
export const updateWarehouseHandler = async (req: Request, res: Response) => {
  const { warehouseID } = req.params;
  const { warehouseCode } = req.body;
  try {
    const updatedWarehouse = await updateWarehouse(warehouseID, warehouseCode);
    res.status(200).json(updatedWarehouse);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// 删除仓库
export const deleteWarehouseHandler = async (req: Request, res: Response) => {
  const { warehouseID } = req.params;
  try {
    const message = await deleteWarehouse(warehouseID);
    res.status(200).json({ message });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

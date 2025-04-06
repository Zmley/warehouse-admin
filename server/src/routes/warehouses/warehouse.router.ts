// warehouses/warehouse.router.ts
import express from "express";
import {
  getAllWarehousesHandler,
  getWarehouseByIdHandler,
  createWarehouseHandler,
  updateWarehouseHandler,
  deleteWarehouseHandler,
} from "./warehouse.controller";

const router = express.Router();

// 注意：外部已使用 app.use('/warehouses', router)，所以路径本身不需要再加 '/warehouses'

// 获取所有仓库
router.get("/", getAllWarehousesHandler);

// 获取单个仓库
router.get("/:warehouseID", getWarehouseByIdHandler);

// 创建仓库
router.post("/", createWarehouseHandler);

// 更新仓库
router.put("/:warehouseID", updateWarehouseHandler);

// 删除仓库
router.delete("/:warehouseID", deleteWarehouseHandler);

export default router;

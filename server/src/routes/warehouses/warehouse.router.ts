import express from "express";
import {
  getAllWarehousesHandler,
  getWarehouseByIdHandler,
  createWarehouseHandler,
  updateWarehouseHandler,
  deleteWarehouseHandler,
} from "./warehouse.controller";

const router = express.Router();

router.get("/", getAllWarehousesHandler);

router.get("/:warehouseID", getWarehouseByIdHandler);

router.post("/", createWarehouseHandler);

router.put("/:warehouseID", updateWarehouseHandler);

router.delete("/:warehouseID", deleteWarehouseHandler);

export default router;

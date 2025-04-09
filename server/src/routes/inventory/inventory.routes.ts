// inventory.route.ts
import express from "express";
import {
  getAllInventoriesController,
  deleteInventoryItemController,
  addInventoryItemController,
  updateInventoryItemController,
} from "./inventory.controller";
import adminOnly from "../../middlewares/admin.middleware";

const router = express.Router();

router.get("/all", adminOnly, getAllInventoriesController);

router.delete("/:inventoryID", adminOnly, deleteInventoryItemController); // 新增删除库存

router.post("/", addInventoryItemController);

router.put("/:inventoryID", updateInventoryItemController);

export default router;

import express from "express";
import {
  getBinByCode,
  getBinCodes,
  getBinsForWarehouse,
} from "./bin.controller";

const router = express.Router();

router.get("/:binCode", getBinByCode);

router.get("/code/:productCode", getBinCodes);

router.get("/", getBinsForWarehouse);

export default router;

import express from "express";
import {
  getBinByCode,
  getBinCodes,
  getAllBinCodesInWarehouse,
} from "./bin.controller";

const router = express.Router();

router.get("/:binCode", getBinByCode);

router.get("/code/:productCode", getBinCodes);

router.get("/", getAllBinCodesInWarehouse);

export default router;

import { Request, Response, NextFunction } from "express";
import { getBinByBinCode } from "./bin.service";
import {
  getBinCodesByProductCode,
  getAllBinsInWarehouse,
} from "../bins/bin.service";
import AppError from "utils/appError";
import Bin from "./bin.model";
const express = require("express");
const router = express.Router();

export const getBinByCode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { warehouseID } = res.locals;

    const { binCode } = req.params;

    const bin = await getBinByBinCode(binCode, warehouseID);

    res.status(200).json({
      message: "Bin fetched successfully",
      bin: bin,
    });
  } catch (error) {
    next(error);
  }
};

export const getBinCodes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { productCode } = req.params;
    const { warehouseID } = res.locals;

    const binCodes = await getBinCodesByProductCode(productCode, warehouseID);

    res.status(200).json({
      message: "Bin codes fetched successfully",
      binCodes,
    });
  } catch (error) {
    next(error);
  }
};

export const getBinsForWarehouse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const warehouseID = res.locals.warehouseID; // 或者你从 req.user 拿
    const bins = await getAllBinsInWarehouse(warehouseID);
    res.status(200).json({
      message: "All bins fetched successfully",
      bins,
    });
  } catch (error) {
    next(error);
  }
};

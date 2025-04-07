import { Request, Response, NextFunction } from "express";
import { getBinByBinCode } from "./bin.service";
import { getBinCodesByProductCode } from "../bins/bin.service";
import AppError from "utils/appError";
import Bin from "./bin.model";

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

export const getAllBinCodesInWarehouse = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { warehouseID } = res.locals;

    if (!warehouseID) {
      throw new AppError(400, "Warehouse ID is missing in request");
    }

    const bins = await Bin.findAll({
      where: { warehouseID },
      attributes: ["binCode"],
    });

    const binCodes = bins.map((bin) => bin.binCode);

    res.status(200).json({
      message: "All bin codes fetched successfully",
      binCodes,
    });
  } catch (error) {
    next(error);
  }
};

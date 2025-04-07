import { Request, Response, NextFunction } from "express";
import {
  createTaskAsAdmin,
  getTasksByWarehouseID,
  cancelTaskByID,
} from "../tasks/task.service";
import { getBinByBinCode } from "routes/bins/bin.service";

export const createAsAdmin = async (req: Request, res: Response) => {
  try {
    const { sourceBinCode, destinationBinCode, productCode } = req.body;
    const accountID = res.locals.currentAccount.accountID;
    const warehouseID = res.locals.currentAccount.warehouseID;

    const sourceBin = await getBinByBinCode(sourceBinCode, warehouseID);
    const destinationBin = await getBinByBinCode(
      destinationBinCode,
      warehouseID
    );

    const task = await createTaskAsAdmin(
      sourceBin.binID,
      destinationBin.binID,
      productCode,
      accountID
    );

    res.status(201).json(task);
  } catch (error) {
    console.error("❌ Error creating task as admin:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getTasks = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { warehouseID, role } = res.locals;

    const tasksWithBinCodes = await getTasksByWarehouseID(warehouseID);

    res.status(200).json({
      message: "Successfully fetched all pending tasks for Picker",
      tasks: tasksWithBinCodes,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelTask = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { taskID } = req.params;

    const task = await cancelTaskByID(taskID);

    res.status(200).json({
      message: `Task "${task.taskID}" cancelled successfully`,
      task,
    });
  } catch (error) {
    next(error);
  }
};

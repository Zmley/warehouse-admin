import express from "express";
import { createAsAdmin, getTasks, cancelTask } from "./task.controller";
import adminOnly from "../../middlewares/admin.middleware";

const router = express.Router();

router.post("/createAsAdmin", adminOnly, createAsAdmin);
router.post("/getTasks", adminOnly, getTasks);
router.post("/cancelTask/:taskID", adminOnly, cancelTask);

export default router;

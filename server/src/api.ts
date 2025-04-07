import { Router } from "express";
import currentAccount from "middlewares/currentAccount.middleware";
import authenticateToken from "./middlewares/auth.middleware";
import healthCheck from "routes/healthcheck/healthCheck.router";
import accountRoutes from "routes/accounts/accounts.router";
import warehouseRoutes from "routes/warehouses/warehouse.router";
import tasks from "routes/tasks/task.routes";
import bins from "routes/bins/bin.routes";
import products from "routes/products/product.routes";

const router: Router = Router();
router.use(healthCheck);
router.use(accountRoutes);
router.use(authenticateToken, currentAccount);
router.use("/warehouses", warehouseRoutes);
router.use("/tasks", tasks);
router.use("/bins", bins);
router.use("/products", products);

export default router;

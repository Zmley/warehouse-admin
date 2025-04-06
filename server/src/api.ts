import { Router } from "express";
import currentAccount from "middlewares/currentAccount.middleware";
import authenticateToken from "./middlewares/auth.middleware";
import healthCheck from "routes/healthcheck/healthCheck.router";
import accountRoutes from "routes/accounts/accounts.router";
import warehouseRoutes from "routes/warehouses/warehouse.router";

const router: Router = Router();
router.use(healthCheck);
router.use(accountRoutes);
router.use(authenticateToken, currentAccount);

router.use("/warehouses", warehouseRoutes);

export default router;

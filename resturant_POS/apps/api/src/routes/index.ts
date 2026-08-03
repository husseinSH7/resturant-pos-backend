import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import menuRoutes from "../modules/menu/menu.routes.js";
import orderRoutes from "../modules/orders/orders.routes.js";
import tableRoutes from "../modules/tables/tables.routes.js";
import shiftRoutes from "../modules/shifts/shifts.routes.js";
import customerRoutes from "../modules/customers/customers.routes.js";
import kitchenRoutes from "../modules/kitchen/kitchen.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/menu", menuRoutes);
router.use("/orders", orderRoutes);
router.use("/tables", tableRoutes);
router.use("/shifts", shiftRoutes);
router.use("/customers", customerRoutes);
router.use("/kitchen", kitchenRoutes);

export default router;

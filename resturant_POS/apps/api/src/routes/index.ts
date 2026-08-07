import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import menuRoutes from "../modules/menu/menu.routes.js";
import orderRoutes from "../modules/orders/orders.routes.js";
import tableRoutes from "../modules/tables/tables.routes.js";
import shiftRoutes from "../modules/shifts/shifts.routes.js";
import customerRoutes from "../modules/customers/customers.routes.js";
import kitchenRoutes from "../modules/kitchen/kitchen.routes.js";
import inventoryRoutes from "../modules/inventory/inventory.routes.js";
import giftCardRoutes from "../modules/giftcards/giftcards.routes.js";
import marketingRoutes from "../modules/marketing/marketing.routes.js";
import reservationRoutes from "../modules/reservations/reservations.routes.js";
import analyticsRoutes from "../modules/analytics/analytics.routes.js";
import staffRoutes from "../modules/staff/staff.routes.js";
import settingsRoutes from "../modules/settings/settings.routes.js";
import deviceRoutes from "../modules/devices/device.routes.js";
import platformAdminRoutes from "../modules/platform-admin/platform-admin.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/menu", menuRoutes);
router.use("/orders", orderRoutes);
router.use("/tables", tableRoutes);
router.use("/shifts", shiftRoutes);
router.use("/customers", customerRoutes);
router.use("/kitchen", kitchenRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/giftcards", giftCardRoutes);
router.use("/marketing", marketingRoutes);
router.use("/reservations", reservationRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/staff", staffRoutes);
router.use("/settings", settingsRoutes);
router.use("/devices", deviceRoutes);
router.use("/platform-admin", platformAdminRoutes);

export default router;

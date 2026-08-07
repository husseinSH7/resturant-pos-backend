import { Router } from "express";
import { auth, requireRole } from "../../middleware/auth.js";
import {
  getRestaurants,
  getRestaurant,
  createRestaurant,
  updateRestaurant,
  getPlans,
  createPlan,
  updatePlan,
  updateSubscription,
  getGlobalAnalytics,
  getAuditLogs,
} from "./platform-admin.controller.js";

const router = Router();

// All platform admin routes require PLATFORM_ADMIN role
router.use(auth, requireRole("PLATFORM_ADMIN"));

// Restaurant management
router.get("/restaurants", getRestaurants);
router.get("/restaurants/:id", getRestaurant);
router.post("/restaurants", createRestaurant);
router.put("/restaurants/:id", updateRestaurant);

// Plan management
router.get("/plans", getPlans);
router.post("/plans", createPlan);
router.put("/plans/:id", updatePlan);

// Subscription management
router.put("/subscriptions/:restaurantId", updateSubscription);

// Analytics
router.get("/analytics", getGlobalAnalytics);

// Audit logs
router.get("/audit-logs", getAuditLogs);

export default router;

import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import {
  salesAnalytics,
  menuPerformance,
  serverPerformance,
  peakHours,
  laborCost,
  salesForecast,
  realTimeMetrics,
} from "./analytics.controller.js";

const router = Router();

router.get("/sales", auth, salesAnalytics);
router.get("/menu-performance", auth, menuPerformance);
router.get("/server-performance", auth, serverPerformance);
router.get("/peak-hours", auth, peakHours);
router.get("/labor-cost", auth, laborCost);
router.get("/forecast", auth, salesForecast);
router.get("/real-time", auth, realTimeMetrics);

export default router;
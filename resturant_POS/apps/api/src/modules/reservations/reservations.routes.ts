import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import {
  list,
  create,
  updateStatus,
  checkAvailabilityController,
  listWaitlist,
  addToWaitlistController,
  updateWaitlistStatusController,
  getNoShowStatsController,
} from "./reservations.controller.js";

const router = Router();

// Reservations
router.get("/", auth, list);
router.post("/", auth, create);
router.put("/:id/status", auth, updateStatus);
router.get("/availability", auth, checkAvailabilityController);

// Waitlist
router.get("/waitlist", auth, listWaitlist);
router.post("/waitlist", auth, addToWaitlistController);
router.put("/waitlist/:id/status", auth, updateWaitlistStatusController);

// Analytics
router.get("/no-show-stats", auth, getNoShowStatsController);

export default router;
import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import { checkSubscriptionStatus, checkDeviceLimit } from "../../middleware/license.js";
import {
  listDevices,
  createDeviceController,
  updateDeviceController,
  deleteDeviceController,
  testPrintController,
  heartbeatController,
} from "./device.controller.js";

const router = Router();

// Device management
router.get("/", auth, checkSubscriptionStatus, listDevices);
router.post("/", auth, checkSubscriptionStatus, checkDeviceLimit, createDeviceController);
router.put("/:id", auth, checkSubscriptionStatus, updateDeviceController);
router.delete("/:id", auth, checkSubscriptionStatus, deleteDeviceController);
router.post("/:id/test-print", auth, checkSubscriptionStatus, testPrintController);

// Heartbeat
router.post("/heartbeat", auth, heartbeatController);

export default router;
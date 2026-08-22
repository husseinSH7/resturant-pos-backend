import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import { checkSubscriptionStatus, checkDeviceLimit } from "../../middleware/license.js";
import {
  listDevices,
  registerDevice,
  updateDevice,
  deleteDevice,
  heartbeat,
  testPrint,
  printReceipt,
} from "./device.controller.js";

const router = Router();

// Device management
router.get("/", auth, checkSubscriptionStatus, listDevices);
router.post("/", auth, checkSubscriptionStatus, checkDeviceLimit, registerDevice);
router.put("/:id", auth, checkSubscriptionStatus, updateDevice);
router.delete("/:id", auth, checkSubscriptionStatus, deleteDevice);

// Printer endpoints
router.post("/:id/test-print", auth, checkSubscriptionStatus, testPrint);
router.post("/:id/print", auth, checkSubscriptionStatus, printReceipt);

// Heartbeat
router.post("/heartbeat", auth, heartbeat);

export default router;
import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import { checkSubscriptionStatus, checkDeviceLimit } from "../../middleware/license.js";
import { registerDevice, listDevices, updateDevice, heartbeat } from "./device.controller.js";

const router = Router();

router.post("/register", auth, checkSubscriptionStatus, checkDeviceLimit, registerDevice);
router.get("/", auth, checkSubscriptionStatus, listDevices);
router.put("/:id", auth, checkSubscriptionStatus, updateDevice);
router.post("/heartbeat", auth, heartbeat);

export default router;

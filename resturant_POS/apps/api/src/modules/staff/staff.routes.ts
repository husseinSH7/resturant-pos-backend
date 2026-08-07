import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import { checkSubscriptionStatus, checkStaffLimit } from "../../middleware/license.js";
import { list, performance, create, update, remove } from "./staff.controller.js";

const router = Router();

router.get("/", auth, checkSubscriptionStatus, list);
router.get("/performance", auth, checkSubscriptionStatus, performance);
router.post("/", auth, checkSubscriptionStatus, checkStaffLimit, create);
router.put("/:id", auth, checkSubscriptionStatus, update);
router.delete("/:id", auth, checkSubscriptionStatus, remove);

export default router;
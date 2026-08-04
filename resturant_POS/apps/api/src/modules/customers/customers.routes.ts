import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import { list, create, addPoints, redeemPoints, getLoyaltyTier, getAnalytics } from "./customers.controller.js";

const router = Router();

router.get("/", auth, list);
router.get("/analytics/overview", auth, getAnalytics);
router.post("/", auth, create);
router.post("/:id/points", auth, addPoints);
router.post("/:id/redeem", auth, redeemPoints);
router.get("/:id/loyalty-tier", auth, getLoyaltyTier);

export default router;

import { Router } from "express";
import { auth, requireManagerRole } from "../../middleware/auth.js";
import { create, list, get, addItems, pay, voidOrderController, refundOrderController, createSplit, payWithSplit } from "./orders.controller.js";

const router = Router();

router.post("/", auth, create);
router.get("/", auth, list);
router.get("/:id", auth, get);
router.put("/:id/items", auth, addItems);
router.post("/:id/pay", auth, pay);
router.post("/:id/pay-split", auth, payWithSplit);
router.post("/:id/splits", auth, createSplit);
router.post("/:id/void", auth, requireManagerRole, voidOrderController);
router.post("/:id/refund", auth, requireManagerRole, refundOrderController);

export default router;

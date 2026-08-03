import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import { create, list, get, addItems, pay, voidOrderController } from "./orders.controller.js";

const router = Router();

router.post("/", auth, create);
router.get("/", auth, list);
router.get("/:id", auth, get);
router.put("/:id/items", auth, addItems);
router.post("/:id/pay", auth, pay);
router.post("/:id/void", auth, voidOrderController);

export default router;

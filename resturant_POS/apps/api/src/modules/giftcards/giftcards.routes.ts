import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import { list, create, getByNumber, use, reload } from "./giftcards.controller.js";

const router = Router();

router.get("/", auth, list);
router.post("/", auth, create);
router.get("/:cardNumber", auth, getByNumber);
router.post("/:cardNumber/use", auth, use);
router.post("/:cardNumber/reload", auth, reload);

export default router;
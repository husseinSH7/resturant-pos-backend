import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import { open, close, current, history } from "./shifts.controller.js";

const router = Router();

router.post("/open", auth, open);
router.post("/:id/close", auth, close);
router.get("/current", auth, current);
router.get("/history", auth, history);

export default router;

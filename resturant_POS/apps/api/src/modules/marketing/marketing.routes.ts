import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import { list, create, send, getAnalytics } from "./marketing.controller.js";

const router = Router();

router.get("/", auth, list);
router.get("/analytics", auth, getAnalytics);
router.post("/", auth, create);
router.post("/:id/send", auth, send);

export default router;
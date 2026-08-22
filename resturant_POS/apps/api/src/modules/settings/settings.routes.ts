import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import { get, update } from "./settings.controller.js";

const router = Router();

router.get("/", auth, get);
router.put("/", auth, update);

export default router;
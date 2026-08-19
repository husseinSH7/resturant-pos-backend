import { Router } from "express";
import { get, update } from "./settings.controller.js";

const router = Router();

router.get("/", get);
router.put("/", update);

export default router;
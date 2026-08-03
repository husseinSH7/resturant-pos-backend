import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import { list, create } from "./customers.controller.js";

const router = Router();

router.get("/", auth, list);
router.post("/", auth, create);

export default router;

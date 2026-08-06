import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import { list, performance, create, update, remove } from "./staff.controller.js";

const router = Router();

router.get("/", auth, list);
router.get("/performance", auth, performance);
router.post("/", auth, create);
router.put("/:id", auth, update);
router.delete("/:id", auth, remove);

export default router;
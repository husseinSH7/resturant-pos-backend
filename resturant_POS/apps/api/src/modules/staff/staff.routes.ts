import { Router } from "express";
import { auth, requireManagerRole } from "../../middleware/auth.js";
import { list, performance, create, update, remove } from "./staff.controller.js";

const router = Router();

router.get("/", auth, list);
router.get("/performance", auth, performance);
router.post("/", auth, requireManagerRole, create);
router.patch("/:id", auth, requireManagerRole, update);
router.delete("/:id", auth, requireManagerRole, remove);

export default router;
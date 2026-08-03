import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import { listTickets, updateStatus } from "./kitchen.controller.js";

const router = Router();

router.get("/tickets", auth, listTickets);
router.patch("/tickets/:id/status", auth, updateStatus);

export default router;

import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import { checkSubscriptionStatus, checkTableLimit } from "../../middleware/license.js";
import { listTables, addTable, transfer, merge } from "./tables.controller.js";

const router = Router();

router.get("/", auth, checkSubscriptionStatus, listTables);
router.post("/", auth, checkSubscriptionStatus, checkTableLimit, addTable);
router.post("/:id/transfer", auth, checkSubscriptionStatus, transfer);
router.post("/merge", auth, checkSubscriptionStatus, merge);

export default router;

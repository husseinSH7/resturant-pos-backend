import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import { checkSubscriptionStatus, checkTableLimit } from "../../middleware/license.js";
import {
  listTables,
  createTableController,
  updateTableController,
  deleteTableController,
  transferController,
  mergeController,
  resetController,
} from "./tables.controller.js";

const router = Router();

router.get("/", auth, checkSubscriptionStatus, listTables);
router.post("/", auth, checkSubscriptionStatus, checkTableLimit, createTableController);
router.put("/:id", auth, checkSubscriptionStatus, updateTableController);
router.delete("/:id", auth, checkSubscriptionStatus, deleteTableController);
router.post("/:id/transfer", auth, checkSubscriptionStatus, transferController);
router.post("/merge", auth, checkSubscriptionStatus, mergeController);
router.post("/:id/reset", auth, checkSubscriptionStatus, resetController);

export default router;
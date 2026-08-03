import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import { listTables, addTable, transfer, merge } from "./tables.controller.js";

const router = Router();

router.get("/", auth, listTables);
router.post("/", auth, addTable);
router.post("/:id/transfer", auth, transfer);
router.post("/merge", auth, merge);

export default router;

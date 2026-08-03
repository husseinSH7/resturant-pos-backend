import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import { listCategories, listProducts } from "./menu.controller.js";

const router = Router();

router.get("/categories", auth, listCategories);
router.get("/products", auth, listProducts);

export default router;

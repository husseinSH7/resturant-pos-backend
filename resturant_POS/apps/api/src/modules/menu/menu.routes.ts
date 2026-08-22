import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import { upload } from "../../middleware/upload.js";
import {
  listCategories,
  listProducts,
  createCategoryController,
  updateCategoryController,
  deleteCategoryController,
  createProductController,
  updateProductController,
  deleteProductController,
  uploadProductImageController,
} from "./menu.controller.js";

const router = Router();

// GET
router.get("/categories", auth, listCategories);
router.get("/products", auth, listProducts);

// Category CRUD
router.post("/categories", auth, createCategoryController);
router.put("/categories/:id", auth, updateCategoryController);
router.delete("/categories/:id", auth, deleteCategoryController);

// Product CRUD
router.post("/products", auth, createProductController);
router.put("/products/:id", auth, updateProductController);
router.delete("/products/:id", auth, deleteProductController);

// Image upload
router.post("/products/:id/image", auth, upload.single("image"), uploadProductImageController);

export default router;
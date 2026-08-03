import { Router } from "express";
import {
  listIngredients,
  createIngredientController,
  updateIngredientController,
  adjustStockController,
  lowStockAlerts,
  listRecipes,
  createRecipeController,
} from "./inventory.controller.js";
import { auth } from "../../middleware/auth.js";

const router = Router();

router.use(auth);

// Ingredients
router.get("/ingredients", listIngredients);
router.post("/ingredients", createIngredientController);
router.put("/ingredients/:id", updateIngredientController);
router.post("/ingredients/:id/stock", adjustStockController);
router.get("/ingredients/low-stock", lowStockAlerts);

// Recipes
router.get("/recipes", listRecipes);
router.post("/recipes", createRecipeController);

export default router;

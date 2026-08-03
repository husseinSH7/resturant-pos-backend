import type { Request, Response } from "express";
import {
  getIngredients,
  createIngredient,
  updateIngredient,
  adjustStock,
  getLowStockAlerts,
  getRecipes,
  createRecipe,
} from "./inventory.service.js";

export async function listIngredients(req: Request, res: Response) {
  try {
    const data = await getIngredients(req.user!.restaurantId);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to load ingredients" });
  }
}

export async function createIngredientController(req: Request, res: Response) {
  try {
    const data = await createIngredient(req.user!.restaurantId, req.body);
    res.status(201).json(data);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to create ingredient" });
  }
}

export async function updateIngredientController(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (typeof id !== "string") return res.status(400).json({ message: "Ingredient ID is required" });
    const data = await updateIngredient(req.user!.restaurantId, id, req.body);
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to update ingredient" });
  }
}

export async function adjustStockController(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (typeof id !== "string") return res.status(400).json({ message: "Ingredient ID is required" });
    const data = await adjustStock(req.user!.restaurantId, id, req.body);
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to adjust stock" });
  }
}

export async function lowStockAlerts(req: Request, res: Response) {
  try {
    const data = await getLowStockAlerts(req.user!.restaurantId);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to load low stock alerts" });
  }
}

export async function listRecipes(req: Request, res: Response) {
  try {
    const data = await getRecipes(req.user!.restaurantId);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to load recipes" });
  }
}

export async function createRecipeController(req: Request, res: Response) {
  try {
    const data = await createRecipe(req.user!.restaurantId, req.body);
    res.status(201).json(data);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to create recipe" });
  }
}

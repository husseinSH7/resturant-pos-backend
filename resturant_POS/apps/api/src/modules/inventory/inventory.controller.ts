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
    const { name, unit, currentStock, minStock, costPerUnit, supplier } = req.body;
    if (!name || !unit || currentStock === undefined || minStock === undefined || costPerUnit === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const data = await createIngredient(req.user!.restaurantId, { 
      name, 
      unit, 
      currentStock: Number(currentStock), 
      minStock: Number(minStock), 
      costPerUnit: Number(costPerUnit), 
      supplier 
    });
    res.status(201).json(data);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to create ingredient" });
  }
}

export async function updateIngredientController(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (typeof id !== "string") return res.status(400).json({ message: "Ingredient ID is required" });
    const { name, unit, currentStock, minStock, costPerUnit, supplier } = req.body;
    const data = await updateIngredient(req.user!.restaurantId, id, { 
      name, 
      unit, 
      currentStock: currentStock !== undefined ? Number(currentStock) : undefined,
      minStock: minStock !== undefined ? Number(minStock) : undefined,
      costPerUnit: costPerUnit !== undefined ? Number(costPerUnit) : undefined,
      supplier 
    });
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to update ingredient" });
  }
}

export async function adjustStockController(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (typeof id !== "string") return res.status(400).json({ message: "Ingredient ID is required" });
    const { adjustment, reason } = req.body;
    if (adjustment === undefined || !reason) {
      return res.status(400).json({ message: "Adjustment amount and reason are required" });
    }
    const data = await adjustStock(req.user!.restaurantId, id, { 
      adjustment: Number(adjustment), 
      reason 
    });
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
    const { name, productId, items } = req.body;
    if (!name || !productId || !items || !Array.isArray(items)) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const data = await createRecipe(req.user!.restaurantId, { 
      name, 
      productId, 
      items 
    });
    res.status(201).json(data);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to create recipe" });
  }
}

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

/**
 * Helper: extracts and validates the restaurantId from the authenticated user.
 */
function getRestaurantId(req: Request): string {
  const id = req.user?.restaurantId;
  if (!id) {
    throw { status: 400, message: "User not associated with a restaurant" };
  }
  return id;
}

export async function listIngredients(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const data = await getIngredients(restaurantId);
    res.json(data);
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Failed to load ingredients" });
  }
}

export async function createIngredientController(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const { name, unit, currentStock, minStock, costPerUnit, supplier } = req.body;
    if (!name || !unit || currentStock === undefined || minStock === undefined || costPerUnit === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Only include optional fields if they are defined
    const ingredientData: Record<string, unknown> = {
      name,
      unit,
      currentStock: Number(currentStock),
      minStock: Number(minStock),
      costPerUnit: Number(costPerUnit),
    };
    if (supplier !== undefined) {
      ingredientData.supplier = supplier;
    }

    const data = await createIngredient(restaurantId, ingredientData as any);
    res.status(201).json(data);
  } catch (error: any) {
    const status = error.status || 400;
    res.status(status).json({ message: error.message || "Failed to create ingredient" });
  }
}

export async function updateIngredientController(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const id = req.params.id;
    if (typeof id !== "string") return res.status(400).json({ message: "Ingredient ID is required" });

    const { name, unit, currentStock, minStock, costPerUnit, supplier } = req.body;

    // Build data object only with provided fields
    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (unit !== undefined) data.unit = unit;
    if (currentStock !== undefined) data.currentStock = Number(currentStock);
    if (minStock !== undefined) data.minStock = Number(minStock);
    if (costPerUnit !== undefined) data.costPerUnit = Number(costPerUnit);
    if (supplier !== undefined) data.supplier = supplier;

    const result = await updateIngredient(restaurantId, id, data as any);
    res.json(result);
  } catch (error: any) {
    const status = error.status || 400;
    res.status(status).json({ message: error.message || "Failed to update ingredient" });
  }
}

export async function adjustStockController(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const id = req.params.id;
    if (typeof id !== "string") return res.status(400).json({ message: "Ingredient ID is required" });
    const { adjustment, reason } = req.body;
    if (adjustment === undefined || !reason) {
      return res.status(400).json({ message: "Adjustment amount and reason are required" });
    }
    const data = await adjustStock(restaurantId, id, {
      adjustment: Number(adjustment),
      reason,
    });
    res.json(data);
  } catch (error: any) {
    const status = error.status || 400;
    res.status(status).json({ message: error.message || "Failed to adjust stock" });
  }
}

export async function lowStockAlerts(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const data = await getLowStockAlerts(restaurantId);
    res.json(data);
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Failed to load low stock alerts" });
  }
}

export async function listRecipes(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const data = await getRecipes(restaurantId);
    res.json(data);
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Failed to load recipes" });
  }
}

export async function createRecipeController(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const { name, productId, items } = req.body;
    if (!name || !productId || !items || !Array.isArray(items)) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const data = await createRecipe(restaurantId, {
      name,
      productId,
      items,
    });
    res.status(201).json(data);
  } catch (error: any) {
    const status = error.status || 400;
    res.status(status).json({ message: error.message || "Failed to create recipe" });
  }
}
import type { Request, Response } from "express";
import { getCategories, getProducts } from "./menu.service.js";

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

export async function listCategories(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const data = await getCategories(restaurantId);
    res.json(data);
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Failed to load categories" });
  }
}

export async function listProducts(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const data = await getProducts(restaurantId);
    res.json(data);
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Failed to load products" });
  }
}
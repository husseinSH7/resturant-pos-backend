import type { Request, Response } from "express";
import { getCategories, getProducts } from "./menu.service.js";

export async function listCategories(req: Request, res: Response) {
  try {
    const data = await getCategories(req.user!.restaurantId);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to load categories" });
  }
}

export async function listProducts(req: Request, res: Response) {
  try {
    const data = await getProducts(req.user!.restaurantId);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to load products" });
  }
}

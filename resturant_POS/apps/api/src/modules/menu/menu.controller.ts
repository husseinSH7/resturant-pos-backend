import type { Request, Response } from "express";
import { getCategories, getProducts } from "./menu.service.js";
import { cache } from "../../services/redis.js";

function getRestaurantId(req: Request): string {
  const id = req.user?.restaurantId;
  if (!id) {
    throw { status: 400, message: "User not associated with a restaurant" };
  }
  return id;
}

// Helper to invalidate menu cache (categories & products)
async function invalidateMenuCache(restaurantId: string) {
  try {
    await cache.del(`restaurant:${restaurantId}:categories`);
    await cache.del(`restaurant:${restaurantId}:products`);
  } catch (_) {
    // ignore redis errors
  }
}

export async function listCategories(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const cacheKey = `restaurant:${restaurantId}:categories`;

    const cached = await cache.get<any[]>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const data = await getCategories(restaurantId);
    await cache.set(cacheKey, data, 3600);
    res.json(data);
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Failed to load categories" });
  }
}

export async function listProducts(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    // Cache key includes whether modifiers are included (if the query param changes, we want separate cache)
    const includeModifiers = req.query.includeModifiers === 'true';
    const cacheKey = `restaurant:${restaurantId}:products:${includeModifiers ? 'with_mods' : 'no_mods'}`;

    const cached = await cache.get<any[]>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const data = await getProducts(restaurantId);
    await cache.set(cacheKey, data, 3600);
    res.json(data);
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Failed to load products" });
  }
}
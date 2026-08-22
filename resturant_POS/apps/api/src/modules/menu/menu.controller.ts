import type { Request, Response } from "express";
import * as menuService from "./menu.service.js";
import { cache } from "../../services/redis.js";
import {
  createCategorySchema,
  updateCategorySchema,
  createProductSchema,
  updateProductSchema,
} from "./menu.schemas.js";

function getRestaurantId(req: Request): string {
  const id = req.user?.restaurantId;
  if (!id) {
    throw { status: 400, message: "User not associated with a restaurant" };
  }
  return id;
}

function getParamId(req: Request): string {
  const { id } = req.params;
  if (!id || typeof id !== "string") {
    throw { status: 400, message: "Invalid or missing ID" };
  }
  return id;
}

// Strip undefined values from object
function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const result = {} as T;
  for (const key in obj) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
}

async function invalidateMenuCache(restaurantId: string) {
  try {
    await cache.del(`restaurant:${restaurantId}:categories`);
    await cache.del(`restaurant:${restaurantId}:products:no_mods`);
    await cache.del(`restaurant:${restaurantId}:products:with_mods`);
  } catch (_) { /* ignore */ }
}

// ===== GET =====
export async function listCategories(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const cacheKey = `restaurant:${restaurantId}:categories`;
    const cached = await cache.get<any[]>(cacheKey);
    if (cached) return res.json(cached);
    const data = await menuService.getCategories(restaurantId);
    await cache.set(cacheKey, data, 3600);
    res.json(data);
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || "Failed to load categories" });
  }
}

export async function listProducts(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const includeModifiers = req.query.includeModifiers === 'true';
    const cacheKey = `restaurant:${restaurantId}:products:${includeModifiers ? 'with_mods' : 'no_mods'}`;
    const cached = await cache.get<any[]>(cacheKey);
    if (cached) return res.json(cached);
    const data = await menuService.getProducts(restaurantId);
    await cache.set(cacheKey, data, 3600);
    res.json(data);
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || "Failed to load products" });
  }
}

// ===== CATEGORY CRUD =====
export async function createCategoryController(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const parsed = createCategorySchema.parse(req.body);
    const data = stripUndefined(parsed) as any; // safe because we stripped undefined
    const category = await menuService.createCategory(restaurantId, data);
    await invalidateMenuCache(restaurantId);
    res.status(201).json(category);
  } catch (error: any) {
    res.status(error.status || 400).json({ message: error.message || "Failed to create category" });
  }
}

export async function updateCategoryController(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const id = getParamId(req);
    const parsed = updateCategorySchema.parse(req.body);
    const data = stripUndefined(parsed) as any;
    const category = await menuService.updateCategory(id, restaurantId, data);
    await invalidateMenuCache(restaurantId);
    res.json(category);
  } catch (error: any) {
    res.status(error.status || 400).json({ message: error.message || "Failed to update category" });
  }
}

export async function deleteCategoryController(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const id = getParamId(req);
    await menuService.deleteCategory(id, restaurantId);
    await invalidateMenuCache(restaurantId);
    res.status(204).send();
  } catch (error: any) {
    res.status(error.status || 400).json({ message: error.message || "Failed to delete category" });
  }
}

// ===== PRODUCT CRUD =====
export async function createProductController(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const parsed = createProductSchema.parse(req.body);
    const data = stripUndefined(parsed) as any;
    const product = await menuService.createProduct(restaurantId, data);
    await invalidateMenuCache(restaurantId);
    res.status(201).json(product);
  } catch (error: any) {
    res.status(error.status || 400).json({ message: error.message || "Failed to create product" });
  }
}

export async function updateProductController(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const id = getParamId(req);
    const parsed = updateProductSchema.parse(req.body);
    const data = stripUndefined(parsed) as any;
    const product = await menuService.updateProduct(id, restaurantId, data);
    await invalidateMenuCache(restaurantId);
    res.json(product);
  } catch (error: any) {
    res.status(error.status || 400).json({ message: error.message || "Failed to update product" });
  }
}

export async function deleteProductController(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const id = getParamId(req);
    await menuService.deleteProduct(id, restaurantId);
    await invalidateMenuCache(restaurantId);
    res.status(204).send();
  } catch (error: any) {
    res.status(error.status || 400).json({ message: error.message || "Failed to delete product" });
  }
}

// ===== IMAGE UPLOAD =====
export async function uploadProductImageController(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const id = getParamId(req);
    const file = req.file;
    if (!file) {
      throw { status: 400, message: "No image file provided" };
    }
    const imageUrl = await menuService.uploadProductImage(id, restaurantId, file);
    res.json({ imageUrl });
  } catch (error: any) {
    res.status(error.status || 400).json({ message: error.message || "Image upload failed" });
  }
}
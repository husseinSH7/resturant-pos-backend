import type { Request, Response } from "express";
import { getTables, createTable, transferTable, mergeTables } from "./tables.service.js";
import { cache } from "../../services/redis.js";

function getRestaurantId(req: Request): string {
  const id = req.user?.restaurantId;
  if (!id) {
    throw { status: 400, message: "User not associated with a restaurant" };
  }
  return id;
}

// Helper to invalidate table cache for a restaurant
async function invalidateTableCache(restaurantId: string) {
  try {
    await cache.del(`restaurant:${restaurantId}:tables`);
  } catch (_) {
    // ignore redis errors
  }
}

export async function listTables(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const cacheKey = `restaurant:${restaurantId}:tables`;

    // 1. Try cache
    const cached = await cache.get<any[]>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // 2. Cache miss – fetch from DB
    const data = await getTables(restaurantId);

    // 3. Store in cache (1 hour)
    await cache.set(cacheKey, data, 3600);

    res.json(data);
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Failed to load tables" });
  }
}

export async function addTable(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const table = await createTable(restaurantId, req.body);

    // Invalidate cache after creation
    await invalidateTableCache(restaurantId);

    res.status(201).json(table);
  } catch (error: any) {
    const status = error.status || 400;
    res.status(status).json({ message: error.message || "Failed to create table" });
  }
}

export async function transfer(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);

    const id = req.params.id;
    if (typeof id !== "string") {
      return res.status(400).json({ message: "Invalid table ID" });
    }

    const { targetTableId } = req.body;
    const result = await transferTable(restaurantId, id, targetTableId);

    // Invalidate cache after transfer
    await invalidateTableCache(restaurantId);

    res.json(result);
  } catch (error: any) {
    const status = error.status || 400;
    res.status(status).json({ message: error.message || "Transfer failed" });
  }
}

export async function merge(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const { sourceTableIds, targetTableId } = req.body;
    const result = await mergeTables(restaurantId, sourceTableIds, targetTableId);

    // Invalidate cache after merge
    await invalidateTableCache(restaurantId);

    res.json(result);
  } catch (error: any) {
    const status = error.status || 400;
    res.status(status).json({ message: error.message || "Merge failed" });
  }
}
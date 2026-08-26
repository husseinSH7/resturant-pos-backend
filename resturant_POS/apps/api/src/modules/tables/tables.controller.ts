import type { Request, Response } from "express";
import * as tableService from "./tables.service.js";
import { cache } from "../../services/redis.js";
import {
  createTableSchema,
  updateTableSchema,
} from "./tables.schemas.js";

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

function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const result = {} as T;
  for (const key in obj) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
}

async function invalidateTableCache(restaurantId: string) {
  try {
    await cache.del(`restaurant:${restaurantId}:tables`);
  } catch (_) { /* ignore */ }
}

// ===== GET =====
export async function listTables(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const cacheKey = `restaurant:${restaurantId}:tables`;
    const cached = await cache.get<any[]>(cacheKey);
    if (cached) return res.json(cached);
    const data = await tableService.getTables(restaurantId);
    await cache.set(cacheKey, data, 3600);
    res.json(data);
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || "Failed to load tables" });
  }
}

// ===== CREATE =====
export async function createTableController(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const parsed = createTableSchema.parse(req.body);
    const data = stripUndefined(parsed) as any;
    const table = await tableService.createTable(restaurantId, data);
    await invalidateTableCache(restaurantId);
    res.status(201).json(table);
  } catch (error: any) {
    res.status(error.status || 400).json({ message: error.message || "Failed to create table" });
  }
}

// ===== UPDATE =====
export async function updateTableController(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const id = getParamId(req);
    const parsed = updateTableSchema.parse(req.body);
    const data = stripUndefined(parsed) as any;
    const table = await tableService.updateTable(restaurantId, id, data);
    await invalidateTableCache(restaurantId);
    res.json(table);
  } catch (error: any) {
    res.status(error.status || 400).json({ message: error.message || "Failed to update table" });
  }
}

// ===== DELETE =====
export async function deleteTableController(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const id = getParamId(req);
    await tableService.deleteTable(restaurantId, id);
    await invalidateTableCache(restaurantId);
    res.status(204).send();
  } catch (error: any) {
    res.status(error.status || 400).json({ message: error.message || "Failed to delete table" });
  }
}

// ===== TRANSFER =====
export async function transferController(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const id = getParamId(req);
    const { targetTableId } = req.body;
    if (!targetTableId) throw { status: 400, message: "targetTableId is required" };
    const result = await tableService.transferTable(restaurantId, id, targetTableId);
    await invalidateTableCache(restaurantId);
    res.json(result);
  } catch (error: any) {
    res.status(error.status || 400).json({ message: error.message || "Transfer failed" });
  }
}

// ===== MERGE =====
export async function mergeController(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const { sourceTableIds, targetTableId } = req.body;
    if (!sourceTableIds || !Array.isArray(sourceTableIds) || sourceTableIds.length === 0) {
      throw { status: 400, message: "sourceTableIds must be a non-empty array" };
    }
    if (!targetTableId) throw { status: 400, message: "targetTableId is required" };
    const result = await tableService.mergeTables(restaurantId, sourceTableIds, targetTableId);
    await invalidateTableCache(restaurantId);
    res.json(result);
  } catch (error: any) {
    res.status(error.status || 400).json({ message: error.message || "Merge failed" });
  }
}

// ===== RESET =====
export async function resetController(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const id = getParamId(req);
    const table = await tableService.resetTable(restaurantId, id);
    await invalidateTableCache(restaurantId);
    res.json(table);
  } catch (error: any) {
    res.status(error.status || 400).json({ message: error.message || "Reset failed" });
  }
}
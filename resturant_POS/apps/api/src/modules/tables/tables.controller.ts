import type { Request, Response } from "express";
import { getTables, createTable, transferTable, mergeTables } from "./tables.service.js";

function getRestaurantId(req: Request): string {
  const id = req.user?.restaurantId;
  if (!id) {
    throw { status: 400, message: "User not associated with a restaurant" };
  }
  return id;
}

export async function listTables(req: Request, res: Response) {
  try {
    const data = await getTables(getRestaurantId(req));
    res.json(data);
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Failed to load tables" });
  }
}

export async function addTable(req: Request, res: Response) {
  try {
    const table = await createTable(getRestaurantId(req), req.body);
    res.status(201).json(table);
  } catch (error: any) {
    const status = error.status || 400;
    res.status(status).json({ message: error.message || "Failed to create table" });
  }
}

export async function transfer(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    
    // Ensure the route param is a single string (Express typing gives string | string[] | undefined)
    const id = req.params.id;
    if (typeof id !== "string") {
      return res.status(400).json({ message: "Invalid table ID" });
    }
    
    const { targetTableId } = req.body;
    const result = await transferTable(restaurantId, id, targetTableId);
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
    res.json(result);
  } catch (error: any) {
    const status = error.status || 400;
    res.status(status).json({ message: error.message || "Merge failed" });
  }
}
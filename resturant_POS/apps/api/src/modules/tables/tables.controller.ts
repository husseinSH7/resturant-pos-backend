import type { Request, Response } from "express";
import { getTables, createTable, transferTable, mergeTables } from "./tables.service.js";

export async function listTables(req: Request, res: Response) {
  try {
    const data = await getTables(req.user!.restaurantId);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to load tables" });
  }
}

export async function addTable(req: Request, res: Response) {
  try {
    const table = await createTable(req.user!.restaurantId, req.body);
    res.status(201).json(table);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to create table" });
  }
}

export async function transfer(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (typeof id !== "string") return res.status(400).json({ message: "Table ID is required" });
    const { targetTableId } = req.body;
    const result = await transferTable(req.user!.restaurantId, id, targetTableId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Transfer failed" });
  }
}

export async function merge(req: Request, res: Response) {
  try {
    const { sourceTableIds, targetTableId } = req.body;
    const result = await mergeTables(req.user!.restaurantId, sourceTableIds, targetTableId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Merge failed" });
  }
}

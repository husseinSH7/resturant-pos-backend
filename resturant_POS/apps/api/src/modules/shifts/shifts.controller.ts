import type { Request, Response } from "express";
import { openShift, closeShift, getCurrentShift, getShiftHistory } from "./shifts.service.js";

export async function open(req: Request, res: Response) {
  try {
    const shift = await openShift(req.user!.restaurantId, req.user!.userId, req.body);
    res.status(201).json(shift);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to open shift" });
  }
}

export async function close(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (typeof id !== "string") return res.status(400).json({ message: "Shift ID is required" });
    const shift = await closeShift(req.user!.restaurantId, req.user!.userId, id, req.body);
    res.json(shift);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to close shift" });
  }
}

export async function current(req: Request, res: Response) {
  try {
    const shift = await getCurrentShift(req.user!.restaurantId, req.user!.userId);
    if (!shift) return res.status(404).json({ message: "No open shift" });
    res.json(shift);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to fetch current shift" });
  }
}

export async function history(req: Request, res: Response) {
  try {
    const { userId } = req.query;
    const data = await getShiftHistory(req.user!.restaurantId, userId as string | undefined);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to fetch shift history" });
  }
}

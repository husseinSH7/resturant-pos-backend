// shifts.controller.ts
import type { Request, Response } from "express";
import { openShift, closeShift, getCurrentShift, getShiftHistory } from "./shifts.service.js";

/**
 * Helper: extract and validate restaurantId and userId from the authenticated user.
 */
function getShiftContext(req: Request) {
  const restaurantId = req.user?.restaurantId;
  if (!restaurantId) {
    throw { status: 400, message: "User not associated with a restaurant" };
  }
  const userId = req.user?.userId;  // assuming your auth attaches userId to req.user
  if (!userId) {
    throw { status: 400, message: "Invalid user ID" };
  }
  return { restaurantId, userId };
}

export async function open(req: Request, res: Response) {
  try {
    const { restaurantId, userId } = getShiftContext(req);
    const shift = await openShift(restaurantId, userId, req.body);
    res.status(201).json(shift);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to open shift" });
  }
}

export async function close(req: Request, res: Response) {
  try {
    const { restaurantId, userId } = getShiftContext(req);
    const id = req.params.id;
    if (typeof id !== "string") {
      return res.status(400).json({ message: "Shift ID is required" });
    }
    const shift = await closeShift(restaurantId, userId, id, req.body);
    res.json(shift);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to close shift" });
  }
}

export async function current(req: Request, res: Response) {
  try {
    const { restaurantId, userId } = getShiftContext(req);
    const shift = await getCurrentShift(restaurantId, userId);
    if (!shift) {
      return res.status(404).json({ message: "No open shift" });
    }
    res.json(shift);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to fetch current shift" });
  }
}

export async function history(req: Request, res: Response) {
  try {
    const { restaurantId } = getShiftContext(req);
    const { userId } = req.query;
    const data = await getShiftHistory(restaurantId, userId as string | undefined);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to fetch shift history" });
  }
}
import type { Request, Response } from "express";
import {
  getStaffMembers,
  getStaffPerformance,
  createStaffMember,
  updateStaffMember,
  deleteStaffMember,
} from "./staff.service.js";
import { createStaffSchema, updateStaffSchema } from "./staff.schemas.js";

export async function list(req: Request, res: Response) {
  try {
    const restaurantId = req.user!.restaurantId;
    if (!restaurantId) return res.status(400).json({ message: "Restaurant ID is required" });

    const staff = await getStaffMembers(restaurantId);
    res.json(staff);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to load staff" });
  }
}

export async function performance(req: Request, res: Response) {
  try {
    const restaurantId = req.user!.restaurantId;
    if (!restaurantId) return res.status(400).json({ message: "Restaurant ID is required" });

    const startDate = typeof req.query.startDate === "string" ? req.query.startDate : undefined;
    const endDate = typeof req.query.endDate === "string" ? req.query.endDate : undefined;
    const result = await getStaffPerformance(restaurantId, startDate, endDate);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to load staff performance" });
  }
}

export async function create(req: Request, res: Response) {
  try {
    const restaurantId = req.user!.restaurantId;
    const userId = req.user!.userId;
    if (!restaurantId || !userId) return res.status(400).json({ message: "Restaurant ID and User ID are required" });

    const validatedData = createStaffSchema.parse(req.body);
    const staff = await createStaffMember(restaurantId, validatedData, userId);
    res.status(201).json(staff);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ message: "Invalid input", errors: error.errors });
    } else {
      res.status(400).json({ message: error.message || "Failed to create staff member" });
    }
  }
}

export async function update(req: Request, res: Response) {
  try {
    const restaurantId = req.user!.restaurantId;
    const userId = req.user!.userId;
    if (!restaurantId || !userId) return res.status(400).json({ message: "Restaurant ID and User ID are required" });

    const id = req.params.id;
    if (typeof id !== "string") return res.status(400).json({ message: "Staff ID is required" });

    const validatedData = updateStaffSchema.parse(req.body);
    const staff = await updateStaffMember(restaurantId, id, validatedData, userId);
    res.json(staff);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ message: "Invalid input", errors: error.errors });
    } else {
      res.status(400).json({ message: error.message || "Failed to update staff member" });
    }
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const restaurantId = req.user!.restaurantId;
    const userId = req.user!.userId;
    if (!restaurantId || !userId) return res.status(400).json({ message: "Restaurant ID and User ID are required" });

    const id = req.params.id;
    if (typeof id !== "string") return res.status(400).json({ message: "Staff ID is required" });

    const result = await deleteStaffMember(restaurantId, id, userId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to delete staff member" });
  }
}
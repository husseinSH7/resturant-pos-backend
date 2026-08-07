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
    const staff = await getStaffMembers(req.user!.restaurantId);
    res.json(staff);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to load staff" });
  }
}

export async function performance(req: Request, res: Response) {
  try {
    const { startDate, endDate } = req.query;
    const performance = await getStaffPerformance(
      req.user!.restaurantId,
      startDate as string,
      endDate as string
    );
    res.json(performance);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to get staff performance" });
  }
}

export async function create(req: Request, res: Response) {
  try {
    const validatedData = createStaffSchema.parse(req.body);
    const staff = await createStaffMember(req.user!.restaurantId, validatedData, req.user!.userId);
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
    const id = req.params.id;
    if (typeof id !== "string") return res.status(400).json({ message: "Invalid staff ID" });
    const validatedData = updateStaffSchema.parse(req.body);
    const staff = await updateStaffMember(req.user!.restaurantId, id, validatedData, req.user!.userId);
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
    const id = req.params.id;
    if (typeof id !== "string") return res.status(400).json({ message: "Invalid staff ID" });
    const result = await deleteStaffMember(req.user!.restaurantId, id, req.user!.userId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to delete staff member" });
  }
}
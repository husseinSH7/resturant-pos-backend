import type { Request, Response } from "express";
import {
  getStaffMembers,
  getStaffPerformance,
  createStaffMember,
  updateStaffMember,
  deleteStaffMember,
} from "./staff.service.js";

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
    const { fullName, email, role, password } = req.body;
    if (!fullName || !email || !role || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const staff = await createStaffMember(req.user!.restaurantId, {
      fullName,
      email,
      role,
      password,
    });
    res.status(201).json(staff);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to create staff member" });
  }
}

export async function update(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const { fullName, email, role, isActive } = req.body;
    const staff = await updateStaffMember(req.user!.restaurantId, id, {
      fullName,
      email,
      role,
      isActive,
    });
    res.json(staff);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to update staff member" });
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const result = await deleteStaffMember(req.user!.restaurantId, id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to delete staff member" });
  }
}
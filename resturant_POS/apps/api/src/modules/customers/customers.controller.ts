import type { Request, Response } from "express";
import { getCustomers, createCustomer } from "./customers.service.js";

export async function list(req: Request, res: Response) {
  try {
    const data = await getCustomers(req.user!.restaurantId);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to load customers" });
  }
}

export async function create(req: Request, res: Response) {
  try {
    const customer = await createCustomer(req.user!.restaurantId, req.body);
    res.status(201).json(customer);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to create customer" });
  }
}

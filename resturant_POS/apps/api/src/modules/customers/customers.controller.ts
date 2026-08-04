import type { Request, Response } from "express";
import { getCustomers, createCustomer, addLoyaltyPoints, redeemLoyaltyPoints, getLoyaltyTier, getCustomerAnalytics } from "./customers.service.js";

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

export async function addPoints(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (typeof id !== "string") return res.status(400).json({ message: "Customer ID is required" });
    const { points, orderId } = req.body;
    if (typeof points !== "number") return res.status(400).json({ message: "Points is required" });
    const result = await addLoyaltyPoints(req.user!.restaurantId, id, points, orderId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to add points" });
  }
}

export async function redeemPoints(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (typeof id !== "string") return res.status(400).json({ message: "Customer ID is required" });
    const { points } = req.body;
    if (typeof points !== "number") return res.status(400).json({ message: "Points is required" });
    const result = await redeemLoyaltyPoints(req.user!.restaurantId, id, points);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to redeem points" });
  }
}

export async function getLoyaltyTier(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (typeof id !== "string") return res.status(400).json({ message: "Customer ID is required" });
    const tier = await getLoyaltyTier(req.user!.restaurantId, id);
    res.json(tier);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to get loyalty tier" });
  }
}

export async function getAnalytics(req: Request, res: Response) {
  try {
    const analytics = await getCustomerAnalytics(req.user!.restaurantId);
    res.json(analytics);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to get customer analytics" });
  }
}

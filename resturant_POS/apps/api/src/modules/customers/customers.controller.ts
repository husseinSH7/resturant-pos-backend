import type { Request, Response } from "express";
import {
  getCustomers,
  createCustomer,
  addLoyaltyPoints,
  redeemLoyaltyPoints,
  getLoyaltyTier as getLoyaltyTierService,
  getCustomerAnalytics,
} from "./customers.service.js";

/**
 * Helper: extract and validate restaurantId from the authenticated user.
 */
function getRestaurantId(req: Request): string {
  const id = req.user?.restaurantId;
  if (!id) {
    throw { status: 400, message: "User not associated with a restaurant" };
  }
  return id;
}

/**
 * Helper: extract and validate userId from the authenticated user.
 */
function getUserId(req: Request): string {
  const id = req.user?.userId;
  if (!id) {
    throw { status: 400, message: "Invalid user ID" };
  }
  return id;
}

export async function list(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const data = await getCustomers(restaurantId);
    res.json(data);
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Failed to load customers" });
  }
}

export async function create(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const customer = await createCustomer(restaurantId, req.body);
    res.status(201).json(customer);
  } catch (error: any) {
    const status = error.status || 400;
    res.status(status).json({ message: error.message || "Failed to create customer" });
  }
}

export async function addPoints(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const userId = getUserId(req);
    const id = req.params.id;
    if (typeof id !== "string") return res.status(400).json({ message: "Customer ID is required" });
    const { points, orderId } = req.body;
    if (typeof points !== "number") return res.status(400).json({ message: "Points is required" });
    if (!orderId) return res.status(400).json({ message: "Order ID is required" });

    const result = await addLoyaltyPoints(restaurantId, id, points, orderId, userId);
    res.json(result);
  } catch (error: any) {
    const status = error.status || 400;
    res.status(status).json({ message: error.message || "Failed to add points" });
  }
}

export async function redeemPoints(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const userId = getUserId(req);
    const id = req.params.id;
    if (typeof id !== "string") return res.status(400).json({ message: "Customer ID is required" });
    const { points, orderId } = req.body;
    if (typeof points !== "number") return res.status(400).json({ message: "Points is required" });
    if (!orderId) return res.status(400).json({ message: "Order ID is required" });

    const result = await redeemLoyaltyPoints(restaurantId, id, points, orderId, userId);
    res.json(result);
  } catch (error: any) {
    const status = error.status || 400;
    res.status(status).json({ message: error.message || "Failed to redeem points" });
  }
}

export async function getLoyaltyTier(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const id = req.params.id;
    if (typeof id !== "string") return res.status(400).json({ message: "Customer ID is required" });
    const tier = await getLoyaltyTierService(restaurantId, id);
    res.json(tier);
  } catch (error: any) {
    const status = error.status || 400;
    res.status(status).json({ message: error.message || "Failed to get loyalty tier" });
  }
}

export async function getAnalytics(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const analytics = await getCustomerAnalytics(restaurantId);
    res.json(analytics);
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Failed to get customer analytics" });
  }
}
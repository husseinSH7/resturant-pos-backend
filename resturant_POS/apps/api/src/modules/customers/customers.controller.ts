import type { Request, Response } from "express";
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  addLoyaltyPoints,
  redeemLoyaltyPoints,
  getLoyaltyTier as getLoyaltyTierService,
  getCustomerAnalytics,
} from "./customers.service.js";
import {
  createCustomerSchema,
  updateCustomerSchema,
  addLoyaltyPointsSchema,
  redeemLoyaltyPointsSchema,
} from "./customers.schemas.js";

function getRestaurantId(req: Request): string {
  const id = req.user?.restaurantId;
  if (!id) throw { status: 400, message: "User not associated with a restaurant" };
  return id;
}

function getUserId(req: Request): string {
  const id = req.user?.userId;
  if (!id) throw { status: 400, message: "Invalid user ID" };
  return id;
}

function getParamId(req: Request): string {
  const { id } = req.params;
  if (!id || typeof id !== "string") throw { status: 400, message: "Invalid ID" };
  return id;
}

function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const result = {} as T;
  for (const key in obj) {
    if (obj[key] !== undefined) result[key] = obj[key];
  }
  return result;
}

// ===== LIST =====
export async function list(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const data = await getCustomers(restaurantId);
    res.json(data);
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || "Failed to load customers" });
  }
}

// ===== CREATE =====
export async function create(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const parsed = createCustomerSchema.parse(req.body);
    const data = stripUndefined(parsed) as any;
    const customer = await createCustomer(restaurantId, data);
    res.status(201).json(customer);
  } catch (error: any) {
    res.status(error.status || 400).json({ message: error.message || "Failed to create customer" });
  }
}

// ===== UPDATE =====
export async function update(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const id = getParamId(req);
    const parsed = updateCustomerSchema.parse(req.body);
    const data = stripUndefined(parsed) as any;
    const customer = await updateCustomer(id, restaurantId, data);
    res.json(customer);
  } catch (error: any) {
    res.status(error.status || 400).json({ message: error.message || "Failed to update customer" });
  }
}

// ===== DELETE =====
export async function remove(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const id = getParamId(req);
    await deleteCustomer(id, restaurantId);
    res.status(204).send();
  } catch (error: any) {
    res.status(error.status || 400).json({ message: error.message || "Failed to delete customer" });
  }
}

// ===== POINTS =====
export async function addPoints(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const userId = getUserId(req);
    const id = getParamId(req);
    const parsed = addLoyaltyPointsSchema.parse(req.body);
    const { points, orderId } = parsed;
    const result = await addLoyaltyPoints(restaurantId, id, points, orderId, userId);
    res.json(result);
  } catch (error: any) {
    res.status(error.status || 400).json({ message: error.message || "Failed to add points" });
  }
}

export async function redeemPoints(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const userId = getUserId(req);
    const id = getParamId(req);
    const parsed = redeemLoyaltyPointsSchema.parse(req.body);
    const { points, orderId } = parsed;
    const result = await redeemLoyaltyPoints(restaurantId, id, points, orderId, userId);
    res.json(result);
  } catch (error: any) {
    res.status(error.status || 400).json({ message: error.message || "Failed to redeem points" });
  }
}

export async function getLoyaltyTier(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const id = getParamId(req);
    const tier = await getLoyaltyTierService(restaurantId, id);
    res.json(tier);
  } catch (error: any) {
    res.status(error.status || 400).json({ message: error.message || "Failed to get loyalty tier" });
  }
}

export async function getAnalytics(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const analytics = await getCustomerAnalytics(restaurantId);
    res.json(analytics);
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || "Failed to get customer analytics" });
  }
}
import type { Request, Response } from "express";
import { createOrder, getOrders, getOrderById, addOrderItems, payOrder, voidOrder } from "./orders.service.js";

export async function create(req: Request, res: Response) {
  try {
    const order = await createOrder(req.user!.restaurantId, req.user!.userId, req.body);
    res.status(201).json(order);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to create order" });
  }
}

export async function list(req: Request, res: Response) {
  try {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const data = await getOrders(req.user!.restaurantId, status ? { status } : undefined);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to load orders" });
  }
}

export async function get(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (typeof id !== "string") return res.status(400).json({ message: "Order ID is required" });
    const order = await getOrderById(req.user!.restaurantId, id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to load order" });
  }
}

export async function addItems(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (typeof id !== "string") return res.status(400).json({ message: "Order ID is required" });
    const items = await addOrderItems(req.user!.restaurantId, req.user!.userId, id, req.body.items);
    res.json(items);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to add items" });
  }
}

export async function pay(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (typeof id !== "string") return res.status(400).json({ message: "Order ID is required" });
    const order = await payOrder(req.user!.restaurantId, req.user!.userId, id, req.body);
    res.json({ success: true, order });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Payment failed" });
  }
}

export async function voidOrderController(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (typeof id !== "string") return res.status(400).json({ message: "Order ID is required" });
    const order = await voidOrder(req.user!.restaurantId, req.user!.userId, id, req.body.reason);
    res.json({ success: true, order });
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Void failed" });
  }
}

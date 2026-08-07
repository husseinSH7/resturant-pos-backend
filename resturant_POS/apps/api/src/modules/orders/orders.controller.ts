import type { Request, Response } from "express";
import { createOrder, getOrders, getOrderById, addOrderItems, payOrder, voidOrder, refundOrder } from "./orders.service.js";
import { createOrderSchema, addOrderItemsSchema, payOrderSchema, voidOrderSchema, refundOrderSchema } from "./orders.schemas.js";

export async function create(req: Request, res: Response) {
  try {
    const validatedData = createOrderSchema.parse(req.body);
    const order = await createOrder(req.user!.restaurantId, req.user!.userId, {
      tableId: validatedData.tableId ?? null,
      customerId: validatedData.customerId ?? null,
      orderType: validatedData.orderType,
      notes: validatedData.notes ?? null,
      items: validatedData.items.map(item => ({
        ...item,
        notes: item.notes ?? null,
        modifiers: item.modifiers?.map(m => ({
          ...m,
          priceDelta: m.priceDelta
        })) ?? []
      }))
    });
    res.status(201).json(order);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ message: "Invalid input", errors: error.errors });
    } else {
      res.status(400).json({ message: error.message || "Failed to create order" });
    }
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
    const validatedData = addOrderItemsSchema.parse(req.body);
    const items = await addOrderItems(req.user!.restaurantId, req.user!.userId, id, validatedData.items.map(item => ({
      ...item,
      notes: item.notes ?? null,
      modifiers: item.modifiers?.map(m => ({
        ...m,
        priceDelta: m.priceDelta
      })) ?? []
    })));
    res.json(items);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ message: "Invalid input", errors: error.errors });
    } else {
      res.status(400).json({ message: error.message || "Failed to add items" });
    }
  }
}

export async function pay(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (typeof id !== "string") return res.status(400).json({ message: "Order ID is required" });
    const validatedData = payOrderSchema.parse(req.body);
    const order = await payOrder(req.user!.restaurantId, req.user!.userId, id, {
      paymentMethod: validatedData.paymentMethod,
      terminalReference: validatedData.terminalReference ?? undefined
    });
    res.json({ success: true, order });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ message: "Invalid input", errors: error.errors });
    } else {
      res.status(400).json({ message: error.message || "Payment failed" });
    }
  }
}

export async function voidOrderController(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (typeof id !== "string") return res.status(400).json({ message: "Order ID is required" });
    const validatedData = voidOrderSchema.parse(req.body);
    const order = await voidOrder(req.user!.restaurantId, req.user!.userId, id, validatedData.reason);
    res.json({ success: true, order });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ message: "Invalid input", errors: error.errors });
    } else {
      res.status(400).json({ message: error.message || "Void failed" });
    }
  }
}

export async function refundOrderController(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (typeof id !== "string") return res.status(400).json({ message: "Order ID is required" });
    const validatedData = refundOrderSchema.parse(req.body);
    const result = await refundOrder(req.user!.restaurantId, req.user!.userId, id, {
      amount: validatedData.amount,
      reason: validatedData.reason,
      paymentId: validatedData.paymentId ?? undefined
    });
    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ message: "Invalid input", errors: error.errors });
    } else {
      res.status(400).json({ message: error.message || "Refund failed" });
    }
  }
}

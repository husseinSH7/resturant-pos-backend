import type { Request, Response } from "express";
import { createOrder, getOrders, getOrderById, addOrderItems, payOrder, voidOrder, refundOrder, createOrderSplit, createPaymentSplit, payOrderWithSplit } from "./orders.service.js";
import { createOrderSchema, addOrderItemsSchema, payOrderSchema, voidOrderSchema, refundOrderSchema, createOrderSplitSchema, payOrderWithSplitSchema } from "./orders.schemas.js";

export async function create(req: Request, res: Response) {
  try {
    const restaurantId = req.user!.restaurantId;
    const userId = req.user!.userId;
    if (!restaurantId || !userId) return res.status(400).json({ message: "Restaurant ID and User ID are required" });
    
    const validatedData = createOrderSchema.parse(req.body);
    const order = await createOrder(restaurantId, userId, {
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
    const restaurantId = req.user!.restaurantId;
    if (!restaurantId) return res.status(400).json({ message: "Restaurant ID is required" });
    
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const data = await getOrders(restaurantId, status ? { status } : undefined);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to load orders" });
  }
}

export async function get(req: Request, res: Response) {
  try {
    const restaurantId = req.user!.restaurantId;
    if (!restaurantId) return res.status(400).json({ message: "Restaurant ID is required" });
    
    const id = req.params.id;
    if (typeof id !== "string") return res.status(400).json({ message: "Order ID is required" });
    const order = await getOrderById(restaurantId, id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to load order" });
  }
}

export async function addItems(req: Request, res: Response) {
  try {
    const restaurantId = req.user!.restaurantId;
    const userId = req.user!.userId;
    if (!restaurantId || !userId) return res.status(400).json({ message: "Restaurant ID and User ID are required" });
    
    const id = req.params.id;
    if (typeof id !== "string") return res.status(400).json({ message: "Order ID is required" });
    const validatedData = addOrderItemsSchema.parse(req.body);
    const items = await addOrderItems(restaurantId, userId, id, validatedData.items.map(item => ({
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
    const restaurantId = req.user!.restaurantId;
    const userId = req.user!.userId;
    if (!restaurantId || !userId) return res.status(400).json({ message: "Restaurant ID and User ID are required" });
    
    const id = req.params.id;
    if (typeof id !== "string") return res.status(400).json({ message: "Order ID is required" });
    const validatedData = payOrderSchema.parse(req.body);

    // Build the payment input, excluding undefined optional fields
    const paymentInput: any = {
      paymentMethod: validatedData.paymentMethod,
      terminalReference: validatedData.terminalReference ?? null,
      cardLast4: validatedData.cardLast4 ?? null,
      giftCardId: validatedData.giftCardId ?? null,
    };
    // Only include tipAmount and cashTendered if they are provided (not undefined)
    if (validatedData.tipAmount !== undefined) paymentInput.tipAmount = validatedData.tipAmount;
    if (validatedData.cashTendered !== undefined) paymentInput.cashTendered = validatedData.cashTendered;

    // Handle payments array if present, with the same conditional logic
    if (validatedData.payments) {
      paymentInput.payments = validatedData.payments.map(p => {
        const payment: any = {
          amount: p.amount,
          paymentMethod: p.paymentMethod,
          terminalReference: p.terminalReference ?? null,
          cardLast4: p.cardLast4 ?? null,
          giftCardId: p.giftCardId ?? null,
        };
        if (p.tipAmount !== undefined) payment.tipAmount = p.tipAmount;
        if (p.cashTendered !== undefined) payment.cashTendered = p.cashTendered;
        return payment;
      });
    }

    const order = await payOrder(restaurantId, userId, id, paymentInput);
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
    const restaurantId = req.user!.restaurantId;
    const userId = req.user!.userId;
    if (!restaurantId || !userId) return res.status(400).json({ message: "Restaurant ID and User ID are required" });
    
    const id = req.params.id;
    if (typeof id !== "string") return res.status(400).json({ message: "Order ID is required" });
    const validatedData = voidOrderSchema.parse(req.body);
    const order = await voidOrder(restaurantId, userId, id, validatedData.reason);
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
    const restaurantId = req.user!.restaurantId;
    const userId = req.user!.userId;
    if (!restaurantId || !userId) return res.status(400).json({ message: "Restaurant ID and User ID are required" });
    
    const id = req.params.id;
    if (typeof id !== "string") return res.status(400).json({ message: "Order ID is required" });
    const validatedData = refundOrderSchema.parse(req.body);
    const result = await refundOrder(restaurantId, userId, id, {
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

export async function createSplit(req: Request, res: Response) {
  try {
    const restaurantId = req.user!.restaurantId;
    const userId = req.user!.userId;
    if (!restaurantId || !userId) return res.status(400).json({ message: "Restaurant ID and User ID are required" });
    
    const id = req.params.id;
    if (typeof id !== "string") return res.status(400).json({ message: "Order ID is required" });
    const validatedData = createOrderSplitSchema.parse(req.body);
    const split = await createOrderSplit(restaurantId, userId, id, {
      name: validatedData.name ?? undefined,
      amount: validatedData.amount,
      splitType: validatedData.splitType,
      customerId: validatedData.customerId ?? undefined,
    });
    res.status(201).json(split);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ message: "Invalid input", errors: error.errors });
    } else {
      res.status(400).json({ message: error.message || "Failed to create split" });
    }
  }
}

export async function payWithSplit(req: Request, res: Response) {
  try {
    const restaurantId = req.user!.restaurantId;
    const userId = req.user!.userId;
    if (!restaurantId || !userId) return res.status(400).json({ message: "Restaurant ID and User ID are required" });
    
    const id = req.params.id;
    if (typeof id !== "string") return res.status(400).json({ message: "Order ID is required" });
    const validatedData = payOrderWithSplitSchema.parse(req.body);
    const result = await payOrderWithSplit(restaurantId, userId, id, { splits: validatedData.splits });
    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ message: "Invalid input", errors: error.errors });
    } else {
      res.status(400).json({ message: error.message || "Split payment failed" });
    }
  }
}
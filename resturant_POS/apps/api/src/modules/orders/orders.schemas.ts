import { z } from "zod";

export const createOrderSchema = z.object({
  tableId: z.string().nullable().optional(),
  customerId: z.string().nullable().optional(),
  orderType: z.enum(["DINE_IN", "TAKEOUT", "DELIVERY"]).default("DINE_IN"),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
    unitPrice: z.number(),
    totalPrice: z.number(),
    notes: z.string().optional(),
    modifiers: z.array(z.object({
      modifierOptionId: z.string(),
      nameSnapshot: z.string(),
      priceDelta: z.number(),
    })).optional(),
  })).min(1),
});

export const addOrderItemsSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
    unitPrice: z.number(),
    totalPrice: z.number(),
    notes: z.string().optional(),
    modifiers: z.array(z.object({
      modifierOptionId: z.string(),
      nameSnapshot: z.string(),
      priceDelta: z.number(),
    })).optional(),
  })).min(1),
});

export const payOrderSchema = z.object({
  paymentMethod: z.enum(["CASH", "CARD", "MIXED", "GIFT_CARD"]),
  terminalReference: z.string().optional(),
});

export const voidOrderSchema = z.object({
  reason: z.string().min(1, "Reason is required"),
});

export const refundOrderSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  reason: z.string().min(1, "Reason is required"),
  paymentId: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type AddOrderItemsInput = z.infer<typeof addOrderItemsSchema>;
export type PayOrderInput = z.infer<typeof payOrderSchema>;
export type VoidOrderInput = z.infer<typeof voidOrderSchema>;
export type RefundOrderInput = z.infer<typeof refundOrderSchema>;

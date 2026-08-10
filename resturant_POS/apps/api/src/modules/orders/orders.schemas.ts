import { z } from "zod";
import { PaymentMethod } from "@prisma/client";

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
  paymentMethod: z.nativeEnum(PaymentMethod),
  terminalReference: z.string().optional(),
  cardLast4: z.string().optional(),
  tipAmount: z.number().nonnegative().optional(),
  cashTendered: z.number().positive().optional(),
  giftCardId: z.string().optional(),
  // For mixed payments
  payments: z.array(z.object({
    amount: z.number().positive("Amount must be positive"),
    paymentMethod: z.nativeEnum(PaymentMethod),
    terminalReference: z.string().optional(),
    cardLast4: z.string().optional(),
    tipAmount: z.number().nonnegative().optional(),
    cashTendered: z.number().positive().optional(),
    giftCardId: z.string().optional(),
  })).optional(),
});

export const voidOrderSchema = z.object({
  reason: z.string().min(1, "Reason is required"),
});

export const refundOrderSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  reason: z.string().min(1, "Reason is required"),
  paymentId: z.string().optional(),
});

export const createOrderSplitSchema = z.object({
  name: z.string().optional(),
  amount: z.number().positive("Amount must be positive"),
  splitType: z.enum(["EQUAL", "CUSTOM", "PER_ITEM", "PERCENTAGE"]),
  customerId: z.string().optional(),
});

export const payOrderWithSplitSchema = z.object({
  splits: z.array(z.object({
    amount: z.number().positive("Amount must be positive"),
    paymentMethod: z.nativeEnum(PaymentMethod),
    terminalReference: z.string().optional(),
    cardLast4: z.string().optional(),
    tipAmount: z.number().nonnegative().optional(),
    cashTendered: z.number().positive().optional(),
  })).min(1, "At least one split payment is required"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type AddOrderItemsInput = z.infer<typeof addOrderItemsSchema>;
export type PayOrderInput = z.infer<typeof payOrderSchema>;
export type VoidOrderInput = z.infer<typeof voidOrderSchema>;
export type RefundOrderInput = z.infer<typeof refundOrderSchema>;
export type CreateOrderSplitInput = z.infer<typeof createOrderSplitSchema>;
export type PayOrderWithSplitInput = z.infer<typeof payOrderWithSplitSchema>;

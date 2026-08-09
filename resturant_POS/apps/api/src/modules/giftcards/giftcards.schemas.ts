import { z } from "zod";

export const createGiftCardSchema = z.object({
  cardNumber: z.string().min(8, "Card number must be at least 8 characters").max(50),
  customerId: z.string().optional(),
  initialAmount: z.number().positive("Initial amount must be positive"),
  expiresAt: z.string().datetime().optional(),
});

export const updateGiftCardSchema = z.object({
  customerId: z.string().optional(),
  balance: z.number().min(0, "Balance cannot be negative").optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().datetime().optional(),
});

export const loadGiftCardSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
});

export const useGiftCardSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  orderId: z.string(),
});

export type CreateGiftCardInput = z.infer<typeof createGiftCardSchema>;
export type UpdateGiftCardInput = z.infer<typeof updateGiftCardSchema>;
export type LoadGiftCardInput = z.infer<typeof loadGiftCardSchema>;
export type UseGiftCardInput = z.infer<typeof useGiftCardSchema>;

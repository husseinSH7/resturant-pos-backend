import { z } from "zod";

export const createCustomerSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(100),
  phone: z.string().regex(/^\+?[\d\s-()]+$/, "Invalid phone number").optional(),
  email: z.string().email("Invalid email address").optional(),
  notes: z.string().max(1000).optional(),
});

export const updateCustomerSchema = z.object({
  fullName: z.string().min(1).max(100).optional(),
  phone: z.string().regex(/^\+?[\d\s-()]+$/).optional(),
  email: z.string().email().optional(),
  notes: z.string().max(1000).optional(),
  points: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const addLoyaltyPointsSchema = z.object({
  points: z.number().int().positive("Points must be positive"),
  orderId: z.string().optional(),
});

export const redeemLoyaltyPointsSchema = z.object({
  points: z.number().int().positive("Points must be positive"),
  orderId: z.string(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type AddLoyaltyPointsInput = z.infer<typeof addLoyaltyPointsSchema>;
export type RedeemLoyaltyPointsInput = z.infer<typeof redeemLoyaltyPointsSchema>;
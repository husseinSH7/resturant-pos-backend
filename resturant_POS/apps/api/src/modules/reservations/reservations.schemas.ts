import { z } from "zod";

export const createReservationSchema = z.object({
  customerName: z.string().min(1, "Customer name is required").max(100),
  customerPhone: z.string().regex(/^\+?[\d\s-()]+$/, "Invalid phone number").optional(),
  customerEmail: z.string().email("Invalid email address").optional(),
  customerId: z.string().optional(),
  guestCount: z.number().int().positive("Guest count must be positive").max(50),
  date: z.string().datetime("Invalid date format"),
  time: z.string().datetime("Invalid time format"),
  tableId: z.string().optional(),
  notes: z.string().max(500).optional(),
  specialRequests: z.string().max(500).optional(),
});

export const updateReservationSchema = z.object({
  customerName: z.string().min(1).max(100).optional(),
  customerPhone: z.string().regex(/^\+?[\d\s-()]+$/).optional(),
  customerEmail: z.string().email().optional(),
  customerId: z.string().optional(),
  guestCount: z.number().int().positive().max(50).optional(),
  date: z.string().datetime().optional(),
  time: z.string().datetime().optional(),
  tableId: z.string().optional(),
  notes: z.string().max(500).optional(),
  specialRequests: z.string().max(500).optional(),
  status: z.enum(["PENDING", "CONFIRMED", "SEATED", "CANCELLED", "NO_SHOW"]).optional(),
});

export const addToWaitlistSchema = z.object({
  customerName: z.string().min(1, "Customer name is required").max(100),
  customerPhone: z.string().regex(/^\+?[\d\s-()]+$/, "Invalid phone number").optional(),
  customerId: z.string().optional(),
  guestCount: z.number().int().positive("Guest count must be positive").max(50),
  notes: z.string().max(500).optional(),
});

export const updateWaitlistSchema = z.object({
  status: z.enum(["WAITING", "CALLED", "SEATED", "CANCELLED"]),
  estimatedWait: z.number().int().min(0).optional(),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type UpdateReservationInput = z.infer<typeof updateReservationSchema>;
export type AddToWaitlistInput = z.infer<typeof addToWaitlistSchema>;
export type UpdateWaitlistInput = z.infer<typeof updateWaitlistSchema>;

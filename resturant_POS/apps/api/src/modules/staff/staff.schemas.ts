import { z } from "zod";
import { UserRole } from "@prisma/client";

export const createStaffSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email"),
  role: z.nativeEnum(UserRole),
  pin: z.string().min(4).max(6, "PIN must be 4-6 digits"),
});

export const updateStaffSchema = z.object({
  fullName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.nativeEnum(UserRole).optional(),
  pin: z.string().min(4).max(6).optional(),
  isActive: z.boolean().optional(),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;

import { z } from "zod";

export const createTableSchema = z.object({
  name: z.string().min(1, "Table name is required").max(50),
  areaId: z.string().optional(),
  seats: z.number().int().min(1).max(20).default(2),
  x: z.number().int().optional(),
  y: z.number().int().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  shape: z.enum(["RECTANGLE", "SQUARE", "ROUND"]).optional(),
  rotation: z.number().int().min(0).max(360).default(0),
});

export const updateTableSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  areaId: z.string().optional(),
  seats: z.number().int().min(1).max(20).optional(),
  status: z.enum(["AVAILABLE", "OCCUPIED", "RESERVED", "DISABLED", "PAID", "NEEDS_ATTENTION"]).optional(),
  x: z.number().int().optional(),
  y: z.number().int().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  shape: z.enum(["RECTANGLE", "SQUARE", "ROUND"]).optional(),
  rotation: z.number().int().min(0).max(360).optional(),
  isActive: z.boolean().optional(),
  guestCount: z.number().int().min(0).optional(),
  notes: z.string().max(500).optional(),
});

export const createTableAreaSchema = z.object({
  name: z.string().min(1, "Area name is required").max(100),
  sortOrder: z.number().int().min(0).optional(),
});

export const updateTableAreaSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type CreateTableInput = z.infer<typeof createTableSchema>;
export type UpdateTableInput = z.infer<typeof updateTableSchema>;
export type CreateTableAreaInput = z.infer<typeof createTableAreaSchema>;
export type UpdateTableAreaInput = z.infer<typeof updateTableAreaSchema>;

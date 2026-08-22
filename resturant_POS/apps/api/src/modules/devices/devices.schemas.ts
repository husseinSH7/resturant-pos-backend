import { z } from "zod";

export const createDeviceSchema = z.object({
  name: z.string().min(1, "Device name is required").max(100),
  deviceType: z.enum(["POS", "KDS", "MANAGER_TABLET", "PRINTER"]),
  deviceId: z.string().min(1, "Device ID is required").max(100),
  ipAddress: z.string().optional(),
});

export const updateDeviceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  deviceType: z.enum(["POS", "KDS", "MANAGER_TABLET", "PRINTER"]).optional(),
  deviceId: z.string().min(1).max(100).optional(),
  ipAddress: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type CreateDeviceInput = z.infer<typeof createDeviceSchema>;
export type UpdateDeviceInput = z.infer<typeof updateDeviceSchema>;
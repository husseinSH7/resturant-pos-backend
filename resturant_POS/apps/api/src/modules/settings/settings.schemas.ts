import { z } from "zod";

export const updateSettingsSchema = z.object({
  restaurantName: z.string().optional(),
  restaurantAddress: z.string().optional(),
  restaurantPhone: z.string().optional(),
  restaurantEmail: z.string().optional(),
  website: z.string().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  taxIncluded: z.boolean().optional(),
  currency: z.string().optional(),
  locale: z.string().optional(),
  receiptHeader: z.string().nullable().optional(),
  receiptFooter: z.string().nullable().optional(),
  receiptShowCustomerInfo: z.boolean().optional(),
  receiptShowServerInfo: z.boolean().optional(),
  enableGratuity: z.boolean().optional(),
  gratuityRates: z.array(
    z.object({
      label: z.string(),
      percentage: z.number().min(0).max(100),
    })
  ).optional(),
  roundTo: z.enum(["NONE", "NEAREST_0_05", "NEAREST_0_10", "NEAREST_0_50", "NEAREST_1"]).optional(),
  printerType: z.string().optional(),
  printerIpAddress: z.string().optional(),
  operatingHours: z.record(
    z.string(),
    z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean(),
    })
  ).optional(),
}).passthrough();

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
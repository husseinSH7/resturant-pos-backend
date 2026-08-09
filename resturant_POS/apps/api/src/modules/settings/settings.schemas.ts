import { z } from "zod";

export const updateSettingsSchema = z.object({
  taxRate: z.number().min(0).max(100).optional(),
  taxIncluded: z.boolean().optional(),
  currency: z.string().length(3).optional(),
  locale: z.string().optional(),
  receiptHeader: z.string().nullable().optional(),
  receiptFooter: z.string().nullable().optional(),
  receiptShowCustomerInfo: z.boolean().optional(),
  receiptShowServerInfo: z.boolean().optional(),
  enableGratuity: z.boolean().optional(),
  gratuityRates: z.array(z.object({
    label: z.string(),
    percentage: z.number().min(0).max(100),
  })).optional(),
  roundTo: z.enum(["NONE", "NEAREST_0_05", "NEAREST_0_10", "NEAREST_0_50", "NEAREST_1"]).optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;

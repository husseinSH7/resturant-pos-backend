import { z } from "zod";

export const createCampaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required").max(200),
  type: z.enum(["SMS", "EMAIL", "PUSH"]),
  startDate: z.string().datetime("Invalid start date"),
  endDate: z.string().datetime("Invalid end date"),
  targetAudience: z.string().min(1, "Target audience is required"),
  budget: z.number().min(0, "Budget cannot be negative").default(0),
  message: z.string().min(1, "Message is required").max(1000),
});

export const updateCampaignSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  type: z.enum(["SMS", "EMAIL", "PUSH"]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  targetAudience: z.string().optional(),
  budget: z.number().min(0).optional(),
  message: z.string().min(1).max(1000).optional(),
  status: z.enum(["ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"]).optional(),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;

import type { Request, Response } from "express";
import { getCampaigns, createCampaign, sendCampaign, getMarketingAnalytics } from "./marketing.service.js";

/**
 * Helper: extracts and validates the restaurantId from the authenticated user.
 */
function getRestaurantId(req: Request): string {
  const id = req.user?.restaurantId;
  if (!id) {
    throw { status: 400, message: "User not associated with a restaurant" };
  }
  return id;
}

export async function list(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const data = await getCampaigns(restaurantId);
    res.json(data);
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Failed to load campaigns" });
  }
}

export async function create(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const { name, type, startDate, endDate, targetAudience, budget, message } = req.body;
    if (!name || !type || !startDate || !endDate || !targetAudience || !budget || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const campaign = await createCampaign(restaurantId, {
      name,
      type,
      startDate,
      endDate,
      targetAudience,
      budget: Number(budget),
      message,
    });
    res.status(201).json(campaign);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to create campaign" });
  }
}

export async function send(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const id = req.params.id;
    if (typeof id !== "string") return res.status(400).json({ message: "Campaign ID is required" });
    const result = await sendCampaign(restaurantId, id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to send campaign" });
  }
}

export async function getAnalytics(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const analytics = await getMarketingAnalytics(restaurantId);
    res.json(analytics);
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Failed to get marketing analytics" });
  }
}
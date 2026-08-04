import type { Request, Response } from "express";
import { getCampaigns, createCampaign, sendCampaign, getMarketingAnalytics } from "./marketing.service.js";

export async function list(req: Request, res: Response) {
  try {
    const data = await getCampaigns(req.user!.restaurantId);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to load campaigns" });
  }
}

export async function create(req: Request, res: Response) {
  try {
    const { name, type, startDate, endDate, targetAudience, budget, message } = req.body;
    if (!name || !type || !startDate || !endDate || !targetAudience || !budget || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const campaign = await createCampaign(req.user!.restaurantId, {
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
    const id = req.params.id;
    if (typeof id !== "string") return res.status(400).json({ message: "Campaign ID is required" });
    const result = await sendCampaign(req.user!.restaurantId, id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to send campaign" });
  }
}

export async function getAnalytics(req: Request, res: Response) {
  try {
    const analytics = await getMarketingAnalytics(req.user!.restaurantId);
    res.json(analytics);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to get marketing analytics" });
  }
}
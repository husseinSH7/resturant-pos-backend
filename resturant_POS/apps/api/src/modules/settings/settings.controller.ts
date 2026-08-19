import type { Request, Response } from "express";
import { getSettings, updateSettings } from "./settings.service.js";
import { updateSettingsSchema } from "./settings.schemas.js";

export async function get(req: Request, res: Response) {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ message: "Restaurant ID is required" });
    }

    const settings = await getSettings(restaurantId);
    res.json(settings);
  } catch (error: any) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ message: error.message || "Failed to load settings" });
  }
}

export async function update(req: Request, res: Response) {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ message: "Restaurant ID is required" });
    }

    // Validate request body
    const validatedData = updateSettingsSchema.parse(req.body);

    const settings = await updateSettings(restaurantId, validatedData);
    res.json(settings);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    console.error("Error updating settings:", error);
    res.status(500).json({ message: error.message || "Failed to update settings" });
  }
}
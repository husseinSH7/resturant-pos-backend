import type { Request, Response } from "express";
import {
  getRestaurantSettings,
  updateRestaurantSettings,
  getTaxSettings,
  updateTaxSettings,
  getReceiptSettings,
  updateReceiptSettings,
} from "./settings.service.js";

export async function getRestaurant(req: Request, res: Response) {
  try {
    const settings = await getRestaurantSettings(req.user!.restaurantId);
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to get restaurant settings" });
  }
}

export async function updateRestaurant(req: Request, res: Response) {
  try {
    const { name, address, phone, isActive } = req.body;
    const settings = await updateRestaurantSettings(req.user!.restaurantId, {
      name,
      address,
      phone,
      isActive,
    });
    res.json(settings);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to update restaurant settings" });
  }
}

export async function getTax(req: Request, res: Response) {
  try {
    const settings = await getTaxSettings(req.user!.restaurantId);
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to get tax settings" });
  }
}

export async function updateTax(req: Request, res: Response) {
  try {
    const { taxRate, taxEnabled, taxIncluded } = req.body;
    const settings = await updateTaxSettings(req.user!.restaurantId, {
      taxRate,
      taxEnabled,
      taxIncluded,
    });
    res.json(settings);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to update tax settings" });
  }
}

export async function getReceipt(req: Request, res: Response) {
  try {
    const settings = await getReceiptSettings(req.user!.restaurantId);
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to get receipt settings" });
  }
}

export async function updateReceipt(req: Request, res: Response) {
  try {
    const { showLogo, showAddress, showPhone, showThankYou, customMessage, footerText } = req.body;
    const settings = await updateReceiptSettings(req.user!.restaurantId, {
      showLogo,
      showAddress,
      showPhone,
      showThankYou,
      customMessage,
      footerText,
    });
    res.json(settings);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to update receipt settings" });
  }
}
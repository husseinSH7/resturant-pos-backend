import type { Request, Response } from "express";
import { getGiftCards, createGiftCard, getGiftCardByNumber, useGiftCard, reloadGiftCard } from "./giftcards.service.js";

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
    const data = await getGiftCards(restaurantId);
    res.json(data);
  } catch (error: any) {
    const status = error.status || 500;
    res.status(status).json({ message: error.message || "Failed to load gift cards" });
  }
}

export async function create(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const { cardNumber, initialAmount, customerId, expiresAt } = req.body;
    if (!cardNumber || !initialAmount) {
      return res.status(400).json({ message: "Card number and initial amount are required" });
    }

    // Build input object conditionally to avoid undefined properties
    const input: Record<string, unknown> = {
      cardNumber,
      initialAmount: Number(initialAmount),
    };
    if (customerId !== undefined) input.customerId = customerId;
    if (expiresAt !== undefined) input.expiresAt = expiresAt;

    const giftCard = await createGiftCard(restaurantId, input as any);
    res.status(201).json(giftCard);
  } catch (error: any) {
    const status = error.status || 400;
    res.status(status).json({ message: error.message || "Failed to create gift card" });
  }
}

export async function getByNumber(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const cardNumber = req.params.cardNumber;
    // Ensure it's a single string (Express params can be string | string[])
    if (typeof cardNumber !== "string") {
      return res.status(400).json({ message: "Card number is required" });
    }
    const giftCard = await getGiftCardByNumber(restaurantId, cardNumber);
    res.json(giftCard);
  } catch (error: any) {
    res.status(404).json({ message: error.message || "Gift card not found" });
  }
}

export async function use(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const cardNumber = req.params.cardNumber;
    if (typeof cardNumber !== "string") {
      return res.status(400).json({ message: "Card number is required" });
    }
    const { amount } = req.body;
    if (!amount) return res.status(400).json({ message: "Amount is required" });
    const result = await useGiftCard(restaurantId, cardNumber, Number(amount));
    res.json(result);
  } catch (error: any) {
    const status = error.status || 400;
    res.status(status).json({ message: error.message || "Failed to use gift card" });
  }
}

export async function reload(req: Request, res: Response) {
  try {
    const restaurantId = getRestaurantId(req);
    const cardNumber = req.params.cardNumber;
    if (typeof cardNumber !== "string") {
      return res.status(400).json({ message: "Card number is required" });
    }
    const { amount } = req.body;
    if (!amount) return res.status(400).json({ message: "Amount is required" });
    const result = await reloadGiftCard(restaurantId, cardNumber, Number(amount));
    res.json(result);
  } catch (error: any) {
    const status = error.status || 400;
    res.status(status).json({ message: error.message || "Failed to reload gift card" });
  }
}
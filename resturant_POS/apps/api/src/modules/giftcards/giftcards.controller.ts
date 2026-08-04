import type { Request, Response } from "express";
import { getGiftCards, createGiftCard, getGiftCardByNumber, useGiftCard, reloadGiftCard } from "./giftcards.service.js";

export async function list(req: Request, res: Response) {
  try {
    const data = await getGiftCards(req.user!.restaurantId);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to load gift cards" });
  }
}

export async function create(req: Request, res: Response) {
  try {
    const { cardNumber, initialAmount, customerId, expiresAt } = req.body;
    if (!cardNumber || !initialAmount) {
      return res.status(400).json({ message: "Card number and initial amount are required" });
    }
    const giftCard = await createGiftCard(req.user!.restaurantId, {
      cardNumber,
      initialAmount: Number(initialAmount),
      customerId,
      expiresAt,
    });
    res.status(201).json(giftCard);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to create gift card" });
  }
}

export async function getByNumber(req: Request, res: Response) {
  try {
    const { cardNumber } = req.params;
    if (!cardNumber) return res.status(400).json({ message: "Card number is required" });
    const giftCard = await getGiftCardByNumber(req.user!.restaurantId, cardNumber);
    res.json(giftCard);
  } catch (error: any) {
    res.status(404).json({ message: error.message || "Gift card not found" });
  }
}

export async function use(req: Request, res: Response) {
  try {
    const { cardNumber } = req.params;
    const { amount } = req.body;
    if (!cardNumber) return res.status(400).json({ message: "Card number is required" });
    if (!amount) return res.status(400).json({ message: "Amount is required" });
    const result = await useGiftCard(req.user!.restaurantId, cardNumber, Number(amount));
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to use gift card" });
  }
}

export async function reload(req: Request, res: Response) {
  try {
    const { cardNumber } = req.params;
    const { amount } = req.body;
    if (!cardNumber) return res.status(400).json({ message: "Card number is required" });
    if (!amount) return res.status(400).json({ message: "Amount is required" });
    const result = await reloadGiftCard(req.user!.restaurantId, cardNumber, Number(amount));
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to reload gift card" });
  }
}
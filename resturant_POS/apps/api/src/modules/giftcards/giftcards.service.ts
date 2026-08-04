import { prisma } from "../../prisma.js";
import { Prisma } from "@prisma/client";

export async function getGiftCards(restaurantId: string) {
  const giftCards = await prisma.giftCard.findMany({
    where: { restaurantId },
    include: { Customer: true },
    orderBy: { createdAt: "desc" },
  });

  return giftCards.map(card => ({
    id: card.id,
    cardNumber: card.cardNumber,
    balance: Number(card.balance),
    initialAmount: Number(card.initialAmount),
    isActive: card.isActive,
    expiresAt: card.expiresAt,
    customer: card.Customer ? {
      id: card.Customer.id,
      fullName: card.Customer.fullName,
    } : null,
    createdAt: card.createdAt,
  }));
}

export async function createGiftCard(restaurantId: string, data: {
  cardNumber: string;
  initialAmount: number;
  customerId?: string;
  expiresAt?: string;
}) {
  const giftCard = await prisma.giftCard.create({
    data: {
      id: crypto.randomUUID(),
      restaurantId,
      cardNumber: data.cardNumber,
      initialAmount: new Prisma.Decimal(data.initialAmount),
      balance: new Prisma.Decimal(data.initialAmount),
      customerId: data.customerId || null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    },
    include: { Customer: true },
  });

  return {
    id: giftCard.id,
    cardNumber: giftCard.cardNumber,
    balance: Number(giftCard.balance),
    initialAmount: Number(giftCard.initialAmount),
    isActive: giftCard.isActive,
    expiresAt: giftCard.expiresAt,
    customer: giftCard.Customer ? {
      id: giftCard.Customer.id,
      fullName: giftCard.Customer.fullName,
    } : null,
    createdAt: giftCard.createdAt,
  };
}

export async function getGiftCardByNumber(restaurantId: string, cardNumber: string) {
  const giftCard = await prisma.giftCard.findFirst({
    where: { restaurantId, cardNumber },
    include: { Customer: true },
  });

  if (!giftCard) throw new Error("Gift card not found");

  return {
    id: giftCard.id,
    cardNumber: giftCard.cardNumber,
    balance: Number(giftCard.balance),
    initialAmount: Number(giftCard.initialAmount),
    isActive: giftCard.isActive,
    expiresAt: giftCard.expiresAt,
    customer: giftCard.Customer ? {
      id: giftCard.Customer.id,
      fullName: giftCard.Customer.fullName,
    } : null,
    createdAt: giftCard.createdAt,
  };
}

export async function useGiftCard(restaurantId: string, cardNumber: string, amount: number) {
  const giftCard = await prisma.giftCard.findFirst({
    where: { restaurantId, cardNumber },
  });

  if (!giftCard) throw new Error("Gift card not found");
  if (!giftCard.isActive) throw new Error("Gift card is not active");
  if (giftCard.expiresAt && new Date() > giftCard.expiresAt) throw new Error("Gift card has expired");
  if (Number(giftCard.balance) < amount) throw new Error("Insufficient gift card balance");

  const updated = await prisma.giftCard.update({
    where: { id: giftCard.id },
    data: {
      balance: { decrement: amount },
    },
  });

  return {
    id: updated.id,
    cardNumber: updated.cardNumber,
    balance: Number(updated.balance),
    amountUsed: amount,
  };
}

export async function reloadGiftCard(restaurantId: string, cardNumber: string, amount: number) {
  const giftCard = await prisma.giftCard.findFirst({
    where: { restaurantId, cardNumber },
  });

  if (!giftCard) throw new Error("Gift card not found");
  if (!giftCard.isActive) throw new Error("Gift card is not active");

  const updated = await prisma.giftCard.update({
    where: { id: giftCard.id },
    data: {
      balance: { increment: amount },
      initialAmount: { increment: amount },
    },
  });

  return {
    id: updated.id,
    cardNumber: updated.cardNumber,
    balance: Number(updated.balance),
    amountAdded: amount,
  };
}
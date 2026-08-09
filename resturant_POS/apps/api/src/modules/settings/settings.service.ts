import { prisma } from "../../prisma.js";
import { Prisma } from "@prisma/client";

export async function getSettings(restaurantId: string) {
  let settings = await prisma.restaurantSettings.findUnique({
    where: { restaurantId },
  });

  // Create default settings if not exist
  if (!settings) {
    settings = await prisma.restaurantSettings.create({
      data: {
        restaurantId,
        taxRate: new Prisma.Decimal(8),
        taxIncluded: false,
        currency: "USD",
        locale: "en-US",
        receiptShowCustomerInfo: true,
        receiptShowServerInfo: true,
        enableGratuity: false,
        gratuityRates: [],
        roundTo: "NONE",
      },
    });
  }

  return {
    id: settings.id,
    restaurantId: settings.restaurantId,
    taxRate: Number(settings.taxRate),
    taxIncluded: settings.taxIncluded,
    currency: settings.currency,
    locale: settings.locale,
    receiptHeader: settings.receiptHeader,
    receiptFooter: settings.receiptFooter,
    receiptShowCustomerInfo: settings.receiptShowCustomerInfo,
    receiptShowServerInfo: settings.receiptShowServerInfo,
    enableGratuity: settings.enableGratuity,
    gratuityRates: settings.gratuityRates,
    roundTo: settings.roundTo,
  };
}

export async function updateSettings(restaurantId: string, data: {
  taxRate?: number | undefined;
  taxIncluded?: boolean | undefined;
  currency?: string | undefined;
  locale?: string | undefined;
  receiptHeader?: string | null | undefined;
  receiptFooter?: string | null | undefined;
  receiptShowCustomerInfo?: boolean | undefined;
  receiptShowServerInfo?: boolean | undefined;
  enableGratuity?: boolean | undefined;
  gratuityRates?: any[] | undefined;
  roundTo?: string | undefined;
}) {
  const settings = await prisma.restaurantSettings.upsert({
    where: { restaurantId },
    create: {
      restaurantId,
      taxRate: new Prisma.Decimal(data.taxRate ?? 8),
      taxIncluded: data.taxIncluded ?? false,
      currency: data.currency ?? "USD",
      locale: data.locale ?? "en-US",
      receiptHeader: data.receiptHeader ?? null,
      receiptFooter: data.receiptFooter ?? null,
      receiptShowCustomerInfo: data.receiptShowCustomerInfo ?? true,
      receiptShowServerInfo: data.receiptShowServerInfo ?? true,
      enableGratuity: data.enableGratuity ?? false,
      gratuityRates: data.gratuityRates ?? [],
      roundTo: (data.roundTo as any) ?? "NONE",
    },
    update: {
      ...(data.taxRate !== undefined && { taxRate: new Prisma.Decimal(data.taxRate) }),
      ...(data.taxIncluded !== undefined && { taxIncluded: data.taxIncluded }),
      ...(data.currency !== undefined && { currency: data.currency }),
      ...(data.locale !== undefined && { locale: data.locale }),
      ...(data.receiptHeader !== undefined && { receiptHeader: data.receiptHeader }),
      ...(data.receiptFooter !== undefined && { receiptFooter: data.receiptFooter }),
      ...(data.receiptShowCustomerInfo !== undefined && { receiptShowCustomerInfo: data.receiptShowCustomerInfo }),
      ...(data.receiptShowServerInfo !== undefined && { receiptShowServerInfo: data.receiptShowServerInfo }),
      ...(data.enableGratuity !== undefined && { enableGratuity: data.enableGratuity }),
      ...(data.gratuityRates !== undefined && { gratuityRates: data.gratuityRates }),
      ...(data.roundTo !== undefined && { roundTo: data.roundTo as any }),
    },
  });

  return {
    id: settings.id,
    restaurantId: settings.restaurantId,
    taxRate: Number(settings.taxRate),
    taxIncluded: settings.taxIncluded,
    currency: settings.currency,
    locale: settings.locale,
    receiptHeader: settings.receiptHeader,
    receiptFooter: settings.receiptFooter,
    receiptShowCustomerInfo: settings.receiptShowCustomerInfo,
    receiptShowServerInfo: settings.receiptShowServerInfo,
    enableGratuity: settings.enableGratuity,
    gratuityRates: settings.gratuityRates,
    roundTo: settings.roundTo,
  };
}

export async function calculateTax(restaurantId: string, subtotal: number) {
  const settings = await getSettings(restaurantId);
  
  if (settings.taxIncluded) {
    return {
      taxAmount: 0,
      taxRate: settings.taxRate,
      subtotal,
      total: subtotal,
    };
  }

  const taxAmount = (subtotal * settings.taxRate) / 100;
  const total = subtotal + taxAmount;

  return {
    taxAmount,
    taxRate: settings.taxRate,
    subtotal,
    total,
  };
}

export async function roundAmount(restaurantId: string, amount: number) {
  const settings = await getSettings(restaurantId);
  
  switch (settings.roundTo) {
    case "NEAREST_0_05":
      return Math.round(amount * 20) / 20;
    case "NEAREST_0_10":
      return Math.round(amount * 10) / 10;
    case "NEAREST_0_50":
      return Math.round(amount * 2) / 2;
    case "NEAREST_1":
      return Math.round(amount);
    case "NONE":
    default:
      return amount;
  }
}

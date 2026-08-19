import { prisma } from "../../prisma.js";
import { Prisma } from "@prisma/client";

const defaultOperatingHours = {
  monday: { open: "09:00", close: "22:00", closed: false },
  tuesday: { open: "09:00", close: "22:00", closed: false },
  wednesday: { open: "09:00", close: "22:00", closed: false },
  thursday: { open: "09:00", close: "22:00", closed: false },
  friday: { open: "09:00", close: "22:00", closed: false },
  saturday: { open: "09:00", close: "22:00", closed: false },
  sunday: { open: "09:00", close: "22:00", closed: false },
};

export async function getSettings(restaurantId: string) {
  // Fetch restaurant and settings in parallel
  const [restaurant, settings] = await Promise.all([
    prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { name: true, address: true, phone: true },
    }),
    prisma.restaurantSettings.findUnique({
      where: { restaurantId },
    }),
  ]);

  if (!restaurant) {
    throw new Error("Restaurant not found");
  }

  // If settings don't exist, create defaults
  const effectiveSettings = settings || (await prisma.restaurantSettings.create({
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
  }));

  return {
    restaurantName: restaurant.name,
    restaurantAddress: restaurant.address || "",
    restaurantPhone: restaurant.phone || "",
    restaurantEmail: "",  // not stored in DB yet
    website: "",          // not stored in DB yet
    taxRate: Number(effectiveSettings.taxRate),
    taxIncluded: effectiveSettings.taxIncluded,
    currency: effectiveSettings.currency,
    locale: effectiveSettings.locale,
    receiptHeader: effectiveSettings.receiptHeader,
    receiptFooter: effectiveSettings.receiptFooter,
    receiptShowCustomerInfo: effectiveSettings.receiptShowCustomerInfo,
    receiptShowServerInfo: effectiveSettings.receiptShowServerInfo,
    enableGratuity: effectiveSettings.enableGratuity,
    gratuityRates: effectiveSettings.gratuityRates,
    roundTo: effectiveSettings.roundTo,
    printerType: "thermal",      // default, not in DB
    printerIpAddress: "",        // default, not in DB
    operatingHours: defaultOperatingHours,
  };
}

export async function updateSettings(restaurantId: string, data: any) {
  // 1. Update restaurant basic info if provided
  if (data.restaurantName || data.restaurantAddress || data.restaurantPhone) {
    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        ...(data.restaurantName && { name: data.restaurantName }),
        ...(data.restaurantAddress && { address: data.restaurantAddress }),
        ...(data.restaurantPhone && { phone: data.restaurantPhone }),
      },
    });
  }

  // 2. Upsert RestaurantSettings with only known fields
  const settingsData: any = {};
  if (data.taxRate !== undefined) settingsData.taxRate = new Prisma.Decimal(data.taxRate);
  if (data.taxIncluded !== undefined) settingsData.taxIncluded = data.taxIncluded;
  if (data.currency !== undefined) settingsData.currency = data.currency;
  if (data.locale !== undefined) settingsData.locale = data.locale;
  if (data.receiptHeader !== undefined) settingsData.receiptHeader = data.receiptHeader;
  if (data.receiptFooter !== undefined) settingsData.receiptFooter = data.receiptFooter;
  if (data.receiptShowCustomerInfo !== undefined) settingsData.receiptShowCustomerInfo = data.receiptShowCustomerInfo;
  if (data.receiptShowServerInfo !== undefined) settingsData.receiptShowServerInfo = data.receiptShowServerInfo;
  if (data.enableGratuity !== undefined) settingsData.enableGratuity = data.enableGratuity;
  if (data.gratuityRates !== undefined) settingsData.gratuityRates = data.gratuityRates;
  if (data.roundTo !== undefined) settingsData.roundTo = data.roundTo;

  if (Object.keys(settingsData).length > 0) {
    await prisma.restaurantSettings.upsert({
      where: { restaurantId },
      update: settingsData,
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
        roundTo: data.roundTo ?? "NONE",
      },
    });
  }

  // 3. Return fresh settings with restaurant info
  return getSettings(restaurantId);
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
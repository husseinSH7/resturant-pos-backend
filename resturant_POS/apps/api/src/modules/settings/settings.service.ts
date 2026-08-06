import { prisma } from "../../prisma.js";

export async function getRestaurantSettings(restaurantId: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: {
      tables: true,
      TableArea: true,
    },
  });

  if (!restaurant) throw new Error("Restaurant not found");

  return {
    id: restaurant.id,
    name: restaurant.name,
    slug: restaurant.slug,
    address: restaurant.address,
    phone: restaurant.phone,
    isActive: restaurant.isActive,
    tables: restaurant.tables.length,
    areas: restaurant.TableArea.length,
  };
}

export async function updateRestaurantSettings(restaurantId: string, data: {
  name?: string;
  address?: string;
  phone?: string;
  isActive?: boolean;
}) {
  const restaurant = await prisma.restaurant.update({
    where: { id: restaurantId },
    data,
  });

  return {
    id: restaurant.id,
    name: restaurant.name,
    address: restaurant.address,
    phone: restaurant.phone,
    isActive: restaurant.isActive,
  };
}

export async function getTaxSettings(restaurantId: string) {
  // In a real implementation, this would fetch from a dedicated TaxSettings table
  return {
    taxRate: 0.08, // 8% default
    taxEnabled: true,
    taxIncluded: false,
  };
}

export async function updateTaxSettings(restaurantId: string, data: {
  taxRate: number;
  taxEnabled: boolean;
  taxIncluded: boolean;
}) {
  // In a real implementation, this would update a dedicated TaxSettings table
  return {
    taxRate: data.taxRate,
    taxEnabled: data.taxEnabled,
    taxIncluded: data.taxIncluded,
  };
}

export async function getReceiptSettings(restaurantId: string) {
  return {
    showLogo: true,
    showAddress: true,
    showPhone: true,
    showThankYou: true,
    customMessage: "Thank you for dining with us!",
    footerText: "Visit us again soon!",
  };
}

export async function updateReceiptSettings(restaurantId: string, data: {
  showLogo?: boolean;
  showAddress?: boolean;
  showPhone?: boolean;
  showThankYou?: boolean;
  customMessage?: string;
  footerText?: string;
}) {
  // In a real implementation, this would update a dedicated ReceiptSettings table
  return {
    showLogo: data.showLogo ?? true,
    showAddress: data.showAddress ?? true,
    showPhone: data.showPhone ?? true,
    showThankYou: data.showThankYou ?? true,
    customMessage: data.customMessage || "Thank you for dining with us!",
    footerText: data.footerText || "Visit us again soon!",
  };
}
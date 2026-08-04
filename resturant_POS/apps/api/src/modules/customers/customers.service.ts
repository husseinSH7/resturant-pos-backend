import { prisma } from "../../prisma.js";
import { OrderStatus } from "@prisma/client";

export async function getCustomers(restaurantId: string) {
  const customers = await prisma.customer.findMany({
    where: { restaurantId },
    orderBy: { createdAt: "desc" },
  });

  const enriched = await Promise.all(
    customers.map(async (c) => {
      const stats = await getCustomerStats(restaurantId, c.id);
      return {
        id: c.id,
        fullName: c.fullName,
        name: c.fullName,
        phone: c.phone,
        email: c.email,
        points: c.points,
        loyaltyPoints: c.points,
        totalSpent: stats.totalSpent,
        visitCount: stats.visitCount,
        notes: c.notes,
      };
    })
  );

  return enriched;
}

export async function createCustomer(
  restaurantId: string,
  data: { fullName: string; phone?: string; email?: string; notes?: string }
) {
  const customer = await prisma.customer.create({
    data: {
      restaurantId,
      fullName: data.fullName,
      phone: data.phone ?? null,
      email: data.email ?? null,
      notes: data.notes ?? null,
    },
  });

  const stats = await getCustomerStats(restaurantId, customer.id);

  return {
    id: customer.id,
    fullName: customer.fullName,
    name: customer.fullName,
    phone: customer.phone,
    email: customer.email,
    points: customer.points,
    loyaltyPoints: customer.points,
    totalSpent: stats.totalSpent,
    visitCount: stats.visitCount,
    notes: customer.notes,
  };
}

export async function getCustomerStats(restaurantId: string, customerId: string) {
  const orders = await prisma.order.findMany({
    where: { restaurantId, customerId, status: OrderStatus.PAID },
  });

  return {
    totalSpent: orders.reduce((sum, o) => sum + o.totalAmount.toNumber(), 0),
    visitCount: orders.length,
  };
}

export async function addLoyaltyPoints(
  restaurantId: string,
  customerId: string,
  points: number,
  orderId?: string
) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, restaurantId },
  });

  if (!customer) throw new Error("Customer not found");

  const updated = await prisma.customer.update({
    where: { id: customerId },
    data: {
      points: { increment: points },
    },
  });

  return {
    id: updated.id,
    fullName: updated.fullName,
    points: updated.points,
    pointsAdded: points,
  };
}

export async function redeemLoyaltyPoints(
  restaurantId: string,
  customerId: string,
  pointsToRedeem: number
) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, restaurantId },
  });

  if (!customer) throw new Error("Customer not found");
  if (customer.points < pointsToRedeem) throw new Error("Insufficient loyalty points");

  const updated = await prisma.customer.update({
    where: { id: customerId },
    data: {
      points: { decrement: pointsToRedeem },
    },
  });

  return {
    id: updated.id,
    fullName: updated.fullName,
    points: updated.points,
    pointsRedeemed: pointsToRedeem,
  };
}

export async function getLoyaltyTier(restaurantId: string, customerId: string) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, restaurantId },
  });

  if (!customer) throw new Error("Customer not found");

  const points = customer.points;
  let tier = "BRONZE";
  let benefits = [];

  if (points >= 1000) {
    tier = "GOLD";
    benefits = ["10% discount", "Priority seating", "Free birthday item"];
  } else if (points >= 500) {
    tier = "SILVER";
    benefits = ["5% discount", "Priority seating"];
  } else {
    benefits = ["Loyalty points on purchases"];
  }

  return {
    tier,
    points,
    benefits,
    nextTier: tier === "BRONZE" ? "SILVER" : tier === "SILVER" ? "GOLD" : null,
    pointsToNextTier: tier === "BRONZE" ? 500 - points : tier === "SILVER" ? 1000 - points : 0,
  };
}

export async function getCustomerAnalytics(restaurantId: string) {
  const customers = await prisma.customer.findMany({
    where: { restaurantId },
    include: {
      orders: {
        where: { status: "PAID" },
      },
    },
  });

  const totalCustomers = customers.length;
  const totalSpent = customers.reduce((sum, c) => sum + Number(c.totalSpent), 0);
  const totalPoints = customers.reduce((sum, c) => sum + c.points, 0);
  const averageSpent = totalCustomers > 0 ? totalSpent / totalCustomers : 0;

  const customerTiers = {
    BRONZE: 0,
    SILVER: 0,
    GOLD: 0,
  };

  customers.forEach((customer) => {
    if (customer.points >= 1000) customerTiers.GOLD++;
    else if (customer.points >= 500) customerTiers.SILVER++;
    else customerTiers.BRONZE++;
  });

  const topCustomers = customers
    .sort((a, b) => Number(b.totalSpent) - Number(a.totalSpent))
    .slice(0, 10)
    .map((c) => ({
      id: c.id,
      fullName: c.fullName,
      totalSpent: Number(c.totalSpent),
      visitCount: c.visitCount,
      points: c.points,
    }));

  const recentCustomers = customers
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10)
    .map((c) => ({
      id: c.id,
      fullName: c.fullName,
      createdAt: c.createdAt,
    }));

  return {
    totalCustomers,
    totalSpent,
    totalPoints,
    averageSpent,
    customerTiers,
    topCustomers,
    recentCustomers,
  };
}

import { prisma } from "../../prisma.js";
import { OrderStatus } from "@prisma/client";
import { createAuditLog } from "../../services/audit.service.js";

// ---------- Get all customers ----------
export async function getCustomers(restaurantId: string) {
  const customers = await prisma.customer.findMany({
    where: { restaurantId, isActive: true },
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
        loyaltyTier: getTier(c.points),
        totalSpent: stats.totalSpent,
        visitCount: stats.visitCount,
        lastVisit: stats.lastVisit,
        notes: c.notes,
        memberSince: c.createdAt.toISOString().split('T')[0],
        isActive: c.isActive,
      };
    })
  );

  return enriched;
}

// ---------- Create ----------
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
      points: 0,
      totalSpent: 0,
      visitCount: 0,
      isActive: true,
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
    loyaltyTier: getTier(customer.points),
    totalSpent: stats.totalSpent,
    visitCount: stats.visitCount,
    lastVisit: stats.lastVisit,
    notes: customer.notes,
    memberSince: customer.createdAt.toISOString().split('T')[0],
  };
}

// ---------- Update ----------
export async function updateCustomer(
  id: string,
  restaurantId: string,
  data: { fullName?: string; phone?: string; email?: string; notes?: string; points?: number; isActive?: boolean }
) {
  const customer = await prisma.customer.findFirst({
    where: { id, restaurantId },
  });
  if (!customer) throw new Error("Customer not found");

  const updateData: any = {};
  if (data.fullName !== undefined) updateData.fullName = data.fullName;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.points !== undefined) updateData.points = data.points;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  const updated = await prisma.customer.update({
    where: { id },
    data: updateData,
  });

  const stats = await getCustomerStats(restaurantId, updated.id);

  return {
    id: updated.id,
    fullName: updated.fullName,
    name: updated.fullName,
    phone: updated.phone,
    email: updated.email,
    points: updated.points,
    loyaltyPoints: updated.points,
    loyaltyTier: getTier(updated.points),
    totalSpent: stats.totalSpent,
    visitCount: stats.visitCount,
    lastVisit: stats.lastVisit,
    notes: updated.notes,
    memberSince: updated.createdAt.toISOString().split('T')[0],
    isActive: updated.isActive,
  };
}

// ---------- Delete (soft delete) ----------
export async function deleteCustomer(id: string, restaurantId: string) {
  const customer = await prisma.customer.findFirst({
    where: { id, restaurantId },
  });
  if (!customer) throw new Error("Customer not found");

  await prisma.customer.update({
    where: { id },
    data: { isActive: false },
  });
  return { success: true };
}

// ---------- Stats ----------
export async function getCustomerStats(restaurantId: string, customerId: string) {
  const orders = await prisma.order.findMany({
    where: { restaurantId, customerId, status: OrderStatus.PAID },
    orderBy: { createdAt: "desc" },
  });

  // ✅ Fix: safely compute totalSpent and lastVisit
  const totalSpent = orders.reduce((sum, o) => sum + o.totalAmount.toNumber(), 0);
  const visitCount = orders.length;
  const lastVisit = orders.length > 0 ? orders[0]?.createdAt.toISOString().split('T')[0] : null;

  return { totalSpent, visitCount, lastVisit };
}

// ---------- Loyalty tiers ----------
function getTier(points: number): "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" {
  if (points >= 2000) return "PLATINUM";
  if (points >= 1000) return "GOLD";
  if (points >= 500) return "SILVER";
  return "BRONZE";
}

// ---------- Loyalty points (existing) ----------
export async function addLoyaltyPoints(
  restaurantId: string,
  customerId: string,
  points: number,
  orderId?: string,
  userId?: string
) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, restaurantId },
  });
  if (!customer) throw new Error("Customer not found");

  const updated = await prisma.customer.update({
    where: { id: customerId },
    data: { points: { increment: points } },
  });

  if (userId) {
    await createAuditLog({
      restaurantId,
      userId,
      action: "LOYALTY_POINTS_ADDED",
      entityType: "CUSTOMER",
      entityId: customerId,
      details: `Added ${points} loyalty points to customer ${customer.fullName}${orderId ? ` for order ${orderId}` : ''}`,
    });
  }

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
  pointsToRedeem: number,
  orderId: string,
  userId: string
) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, restaurantId },
  });
  if (!customer) throw new Error("Customer not found");
  if (customer.points < pointsToRedeem) throw new Error("Insufficient loyalty points");

  const updated = await prisma.customer.update({
    where: { id: customerId },
    data: { points: { decrement: pointsToRedeem } },
  });

  await createAuditLog({
    restaurantId,
    userId,
    action: "LOYALTY_POINTS_REDEEMED",
    entityType: "CUSTOMER",
    entityId: customerId,
    details: `Redeemed ${pointsToRedeem} loyalty points from customer ${customer.fullName} for order ${orderId}`,
  });

  return {
    id: updated.id,
    fullName: updated.fullName,
    points: updated.points,
    pointsRedeemed: pointsToRedeem,
  };
}

export async function calculateLoyaltyPoints(orderAmount: number, restaurantId: string) {
  const pointsPerDollar = 1;
  return Math.floor(orderAmount * pointsPerDollar);
}

export async function awardLoyaltyPointsForOrder(
  restaurantId: string,
  orderId: string,
  userId: string
) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, restaurantId },
  });
  if (!order || !order.customerId) return null;

  const points = await calculateLoyaltyPoints(Number(order.totalAmount), restaurantId);
  if (points > 0) {
    return await addLoyaltyPoints(restaurantId, order.customerId, points, orderId, userId);
  }
  return null;
}

export async function getLoyaltyTier(restaurantId: string, customerId: string) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, restaurantId },
  });
  if (!customer) throw new Error("Customer not found");

  const points = customer.points;
  const tier = getTier(points);
  let benefits = [];
  if (tier === "PLATINUM") benefits = ["15% discount", "Priority seating", "Free dessert on birthday", "VIP events"];
  else if (tier === "GOLD") benefits = ["10% discount", "Priority seating", "Free birthday item"];
  else if (tier === "SILVER") benefits = ["5% discount", "Priority seating"];
  else benefits = ["Loyalty points on purchases"];

  const tierOrder = { BRONZE: 0, SILVER: 1, GOLD: 2, PLATINUM: 3 };
  const nextTier = tierOrder[tier] < 3 ? Object.keys(tierOrder)[tierOrder[tier] + 1] : null;
  const pointsToNextTier = nextTier
    ? (tier === "BRONZE" ? 500 : tier === "SILVER" ? 1000 : 2000) - points
    : 0;

  return { tier, points, benefits, nextTier, pointsToNextTier: Math.max(0, pointsToNextTier) };
}

export async function getCustomerAnalytics(restaurantId: string) {
  const customers = await prisma.customer.findMany({
    where: { restaurantId, isActive: true },
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

  const customerTiers = { BRONZE: 0, SILVER: 0, GOLD: 0, PLATINUM: 0 };
  customers.forEach((c) => {
    const tier = getTier(c.points);
    customerTiers[tier] = (customerTiers[tier] || 0) + 1;
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
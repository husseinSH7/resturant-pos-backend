import { prisma } from "../../prisma.js";

export async function getStaffMembers(restaurantId: string) {
  const staff = await prisma.user.findMany({
    where: { restaurantId },
    orderBy: { createdAt: "desc" },
  });

  return staff.map((user) => ({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  }));
}

export async function getStaffPerformance(restaurantId: string, startDate?: string, endDate?: string) {
  const where: any = { restaurantId, status: "PAID" };
  
  if (startDate) {
    where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
  }
  if (endDate) {
    where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      User: true,
    },
  });

  const staffPerformance = new Map<string, any>();
  
  orders.forEach((order) => {
    const staffId = order.userId;
    const existing = staffPerformance.get(staffId) || {
      staffId,
      staffName: order.User?.fullName || "Unknown",
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      ordersPerHour: 0,
    };
    existing.totalOrders += 1;
    existing.totalRevenue += order.totalAmount.toNumber();
    staffPerformance.set(staffId, existing);
  });

  const performance = Array.from(staffPerformance.values()).map((stats) => ({
    ...stats,
    averageOrderValue: stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0,
  })).sort((a, b) => b.totalRevenue - a.totalRevenue);

  return {
    staffPerformance: performance,
    totalStaff: performance.length,
  };
}

export async function createStaffMember(restaurantId: string, data: {
  fullName: string;
  email: string;
  role: string;
  password: string;
}) {
  const staff = await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      restaurantId,
      fullName: data.fullName,
      email: data.email,
      role: data.role,
      password: data.password, // In production, this should be hashed
      isActive: true,
    },
  });

  return {
    id: staff.id,
    fullName: staff.fullName,
    email: staff.email,
    role: staff.role,
    isActive: staff.isActive,
  };
}

export async function updateStaffMember(restaurantId: string, staffId: string, data: {
  fullName?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
}) {
  const staff = await prisma.user.findFirst({
    where: { id: staffId, restaurantId },
  });

  if (!staff) throw new Error("Staff member not found");

  const updated = await prisma.user.update({
    where: { id: staffId },
    data,
  });

  return {
    id: updated.id,
    fullName: updated.fullName,
    email: updated.email,
    role: updated.role,
    isActive: updated.isActive,
  };
}

export async function deleteStaffMember(restaurantId: string, staffId: string) {
  const staff = await prisma.user.findFirst({
    where: { id: staffId, restaurantId },
  });

  if (!staff) throw new Error("Staff member not found");

  await prisma.user.delete({
    where: { id: staffId },
  });

  return { success: true, message: "Staff member deleted" };
}
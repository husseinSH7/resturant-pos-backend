import { prisma } from "../../prisma.js";
import bcrypt from "bcrypt";
import { UserRole } from "@prisma/client";
import { createAuditLog } from "../../services/audit.service.js";

const SALT_ROUNDS = 10;

async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, SALT_ROUNDS);
}

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
      user: true,
    },
  });

  const staffPerformance = new Map<string, any>();
  
  orders.forEach((order) => {
    const staffId = order.userId;
    const existing = staffPerformance.get(staffId) || {
      staffId,
      staffName: order.user?.fullName || "Unknown",
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
  role: UserRole;
  pin: string;
}, actorUserId: string) {
  const hashedPin = await hashPin(data.pin);
  
  const staff = await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      restaurantId,
      fullName: data.fullName,
      email: data.email,
      role: data.role,
      pin: hashedPin,
      isActive: true,
    },
  });

  await createAuditLog({
    restaurantId,
    userId: actorUserId,
    action: "STAFF_CREATED",
    entityType: "USER",
    entityId: staff.id,
    details: `Created staff member ${data.fullName} with role ${data.role}`,
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
  fullName?: string | undefined;
  email?: string | undefined;
  role?: UserRole | undefined;
  pin?: string | undefined;
  isActive?: boolean | undefined;
}, actorUserId: string) {
  const staff = await prisma.user.findFirst({
    where: { id: staffId, restaurantId },
  });

  if (!staff) throw new Error("Staff member not found");

  const updateData: any = {};
  const changes: string[] = [];
  
  if (data.fullName !== undefined) {
    updateData.fullName = data.fullName;
    changes.push(`fullName: ${staff.fullName} -> ${data.fullName}`);
  }
  if (data.email !== undefined) {
    updateData.email = data.email;
    changes.push(`email: ${staff.email} -> ${data.email}`);
  }
  if (data.role !== undefined) {
    updateData.role = data.role;
    changes.push(`role: ${staff.role} -> ${data.role}`);
  }
  if (data.pin !== undefined) {
    updateData.pin = await hashPin(data.pin);
    changes.push(`pin: updated`);
  }
  if (data.isActive !== undefined) {
    updateData.isActive = data.isActive;
    changes.push(`isActive: ${staff.isActive} -> ${data.isActive}`);
  }

  const updated = await prisma.user.update({
    where: { id: staffId },
    data: updateData,
  });

  await createAuditLog({
    restaurantId,
    userId: actorUserId,
    action: "STAFF_UPDATED",
    entityType: "USER",
    entityId: staffId,
    details: `Updated staff member ${staff.fullName}: ${changes.join(", ")}`,
  });

  return {
    id: updated.id,
    fullName: updated.fullName,
    email: updated.email,
    role: updated.role,
    isActive: updated.isActive,
  };
}

export async function deleteStaffMember(restaurantId: string, staffId: string, actorUserId: string) {
  const staff = await prisma.user.findFirst({
    where: { id: staffId, restaurantId },
  });

  if (!staff) throw new Error("Staff member not found");

  await prisma.user.delete({
    where: { id: staffId },
  });

  await createAuditLog({
    restaurantId,
    userId: actorUserId,
    action: "STAFF_DELETED",
    entityType: "USER",
    entityId: staffId,
    details: `Deleted staff member ${staff.fullName} (${staff.role})`,
  });

  return { success: true, message: "Staff member deleted" };
}
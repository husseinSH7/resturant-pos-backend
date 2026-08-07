import { prisma } from "../prisma.js";

export async function createAuditLog(data: {
  restaurantId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    await prisma.auditLog.create({
      data,
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}

export async function getAuditLogs(restaurantId: string, filters?: {
  userId?: string;
  action?: string;
  entityType?: string;
  limit?: number;
  offset?: number;
}) {
  const where: any = { restaurantId };
  if (filters?.userId) where.userId = filters.userId;
  if (filters?.action) where.action = filters.action;
  if (filters?.entityType) where.entityType = filters.entityType;

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: filters?.limit || 100,
    skip: filters?.offset || 0,
    include: {
      Restaurant: { select: { name: true } },
    },
  });

  return logs.map(log => ({
    id: log.id,
    restaurantId: log.restaurantId,
    restaurantName: log.Restaurant?.name,
    userId: log.userId,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    details: log.details,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    createdAt: log.createdAt.toISOString(),
  }));
}

import { prisma } from "../../prisma.js";
import { ShiftStatus, OrderStatus, PaymentMethod, Prisma } from "@prisma/client";

export async function openShift(
  restaurantId: string,
  userId: string,
  data: { openingCash?: number; notes?: string }
) {
  const existing = await prisma.shift.findFirst({
    where: { restaurantId, userId, status: ShiftStatus.OPEN },
  });

  if (existing) throw new Error("Shift already open for this user");

  const shift = await prisma.shift.create({
    data: {
      restaurantId,
      userId,
      openingCash: data.openingCash !== undefined ? new Prisma.Decimal(data.openingCash) : null,
      notes: data.notes ?? null,
      status: ShiftStatus.OPEN,
    },
    include: { user: true },
  });

  return mapShift(shift);
}

export async function closeShift(
  restaurantId: string,
  userId: string,
  shiftId: string,
  data: { closingCash: number; notes?: string }
) {
  const shift = await prisma.shift.findFirst({
    where: { id: shiftId, restaurantId, status: ShiftStatus.OPEN },
    include: { user: true },
  });

  if (!shift) throw new Error("Open shift not found");

  const summary = await calculateShiftSummary(restaurantId, shift.userId, shift.openedAt);

  const updated = await prisma.shift.update({
    where: { id: shiftId },
    data: {
      status: ShiftStatus.CLOSED,
      closedAt: new Date(),
      closingCash: new Prisma.Decimal(data.closingCash),
      notes: data.notes ?? null,
    },
    include: { user: true },
  });

  return { ...mapShift(updated), summary };
}

export async function getCurrentShift(restaurantId: string, userId: string) {
  const shift = await prisma.shift.findFirst({
    where: { restaurantId, userId, status: ShiftStatus.OPEN },
    include: { user: true },
  });

  return shift ? mapShift(shift) : null;
}

export async function getShiftHistory(restaurantId: string, userId?: string) {
  const shifts = await prisma.shift.findMany({
    where: { restaurantId, ...(userId ? { userId } : {}) },
    orderBy: { openedAt: "desc" },
    include: { user: true },
  });

  return Promise.all(
    shifts.map(async (shift) => {
      const summary = shift.status === ShiftStatus.CLOSED && shift.closedAt
        ? await calculateShiftSummary(restaurantId, shift.userId, shift.openedAt, shift.closedAt)
        : undefined;
      return { ...mapShift(shift), summary };
    })
  );
}

async function calculateShiftSummary(
  restaurantId: string,
  userId: string,
  openedAt: Date,
  closedAt?: Date
) {
  const end = closedAt ?? new Date();

  const orders = await prisma.order.findMany({
    where: {
      restaurantId,
      userId,
      status: OrderStatus.PAID,
      createdAt: { gte: openedAt, lte: end },
    },
  });

  const totalSales = orders.reduce((sum, o) => sum + o.totalAmount.toNumber(), 0);
  const cashOrders = orders.filter((o) => o.paymentMethod === PaymentMethod.CASH || o.paymentMethod === PaymentMethod.MIXED);
  const cardOrders = orders.filter((o) => o.paymentMethod === PaymentMethod.CARD || o.paymentMethod === PaymentMethod.MIXED);

  const totalCash = cashOrders.reduce((sum, o) => sum + o.totalAmount.toNumber(), 0);
  const totalCard = cardOrders.reduce((sum, o) => sum + o.totalAmount.toNumber(), 0);

  return {
    totalSales,
    totalCash,
    totalCard,
    transactionCount: orders.length,
    expectedCash: totalCash,
    actualCash: null as number | null,
    variance: null as number | null,
  };
}

function mapShift(shift: any) {
  return {
    id: shift.id,
    restaurantId: shift.restaurantId,
    userId: shift.userId,
    status: shift.status,
    openedAt: shift.openedAt.toISOString(),
    closedAt: shift.closedAt?.toISOString() ?? null,
    openingCash: shift.openingCash?.toNumber() ?? null,
    closingCash: shift.closingCash?.toNumber() ?? null,
    notes: shift.notes,
    user: shift.user ? { fullName: shift.user.fullName, role: shift.user.role } : undefined,
  };
}

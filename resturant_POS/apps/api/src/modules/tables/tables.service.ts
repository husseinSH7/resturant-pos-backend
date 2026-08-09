import { prisma } from "../../prisma.js";
import { TableStatus, OrderStatus, Prisma } from "@prisma/client";
import crypto from "crypto";

export async function getTables(restaurantId: string) {
  const tables = await prisma.table.findMany({
    where: { restaurantId, isActive: true },
    orderBy: { name: "asc" },
    include: {
      orders: { where: { status: { in: [OrderStatus.OPEN, OrderStatus.PAID] } }, orderBy: { createdAt: "desc" }, take: 1 },
      TableArea: true,
    },
  });

  return tables.map(mapTable);
}

export async function createTable(
  restaurantId: string,
  data: { name: string; seats?: number; area?: string; shape?: string; x?: number; y?: number; width?: number; height?: number; rotation?: number }
) {
  const areaRecord = data.area
    ? await prisma.tableArea.upsert({
        where: { restaurantId_name: { restaurantId, name: data.area } },
        update: {},
        create: { id: crypto.randomUUID(), restaurantId, name: data.area, updatedAt: new Date() },
      })
    : null;

  const table = await prisma.table.create({
    data: {
      id: crypto.randomUUID(),
      restaurantId,
      name: data.name,
      seats: data.seats ?? 4,
      areaId: areaRecord?.id ?? null,
      shape: normalizeShape(data.shape),
      x: data.x ?? 0,
      y: data.y ?? 0,
      width: data.width ?? 80,
      height: data.height ?? 80,
      rotation: data.rotation ?? 0,
      status: TableStatus.AVAILABLE,
    },
    include: { orders: { where: { status: OrderStatus.OPEN }, take: 1 }, TableArea: true },
  });

  return mapTable(table);
}

export async function updateTablePosition(
  restaurantId: string,
  tableId: string,
  data: { x?: number; y?: number; width?: number; height?: number; rotation?: number }
) {
  const table = await prisma.table.findFirst({
    where: { id: tableId, restaurantId },
  });

  if (!table) throw new Error("Table not found");

  const updated = await prisma.table.update({
    where: { id: tableId },
    data: {
      ...(data.x !== undefined && { x: data.x }),
      ...(data.y !== undefined && { y: data.y }),
      ...(data.width !== undefined && { width: data.width }),
      ...(data.height !== undefined && { height: data.height }),
      ...(data.rotation !== undefined && { rotation: data.rotation }),
    },
    include: { TableArea: true },
  });

  return mapTable(updated);
}

export async function updateTable(
  restaurantId: string,
  tableId: string,
  data: { name?: string; seats?: number; areaId?: string; shape?: string; isActive?: boolean }
) {
  const table = await prisma.table.findFirst({
    where: { id: tableId, restaurantId },
  });

  if (!table) throw new Error("Table not found");

  const updated = await prisma.table.update({
    where: { id: tableId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.seats !== undefined && { seats: data.seats }),
      ...(data.areaId !== undefined && { areaId: data.areaId }),
      ...(data.shape !== undefined && { shape: normalizeShape(data.shape) }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    include: { TableArea: true },
  });

  return mapTable(updated);
}

export async function deleteTable(restaurantId: string, tableId: string) {
  const table = await prisma.table.findFirst({
    where: { id: tableId, restaurantId },
    include: { orders: { where: { status: OrderStatus.OPEN } } },
  });

  if (!table) throw new Error("Table not found");
  if (table.orders.length > 0) throw new Error("Cannot delete table with open orders");

  await prisma.table.delete({
    where: { id: tableId },
  });

  return { success: true };
}

export async function transferTable(
  restaurantId: string,
  tableId: string,
  targetTableId: string
) {
  const [source, target] = await Promise.all([
    prisma.table.findFirst({ where: { id: tableId, restaurantId }, include: { orders: { where: { status: OrderStatus.OPEN } } } }),
    prisma.table.findFirst({ where: { id: targetTableId, restaurantId } }),
  ]);

  if (!source || !target) throw new Error("Table not found");

  const sourceOrder = source.orders[0];
  if (!sourceOrder) throw new Error("No open order on source table");

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.order.update({
      where: { id: sourceOrder.id },
      data: { tableId: target.id, notes: sourceOrder.notes ? `${sourceOrder.notes} (transferred)` : "Transferred" },
    });
    await tx.table.update({ where: { id: source.id }, data: { status: TableStatus.AVAILABLE } });
    await tx.table.update({ where: { id: target.id }, data: { status: TableStatus.OCCUPIED } });
  });

  return { success: true };
}

export async function mergeTables(
  restaurantId: string,
  sourceTableIds: string[],
  targetTableId: string
) {
  const [sources, target] = await Promise.all([
    prisma.table.findMany({ where: { id: { in: sourceTableIds }, restaurantId }, include: { orders: { where: { status: OrderStatus.OPEN } } } }),
    prisma.table.findFirst({ where: { id: targetTableId, restaurantId }, include: { orders: { where: { status: OrderStatus.OPEN } } } }),
  ]);

  if (!target) throw new Error("Target table not found");

  const sourceOrders = sources.flatMap((t) => t.orders);
  const targetOrder = target.orders[0];
  if (sourceOrders.length === 0) throw new Error("No open orders to merge");

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    for (const order of sourceOrders) {
      if (targetOrder && order.id !== targetOrder.id) {
        const items = await tx.orderItem.findMany({ where: { orderId: order.id } });
        for (const item of items) {
          await tx.orderItem.create({
            data: {
              orderId: targetOrder.id,
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              notes: item.notes,
            },
          });
        }
        await tx.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.VOIDED, notes: order.notes ? `${order.notes} (merged into ${targetOrder.id})` : `Merged into ${targetOrder.id}` },
        });
      } else if (!targetOrder) {
        await tx.order.update({ where: { id: order.id }, data: { tableId: target.id } });
      }
    }

    await tx.table.updateMany({ where: { id: { in: sourceTableIds } }, data: { status: TableStatus.AVAILABLE } });
    await tx.table.update({ where: { id: target.id }, data: { status: TableStatus.OCCUPIED } });

    if (targetOrder) {
      await recalcOrderTotals(tx, targetOrder.id);
    }
  });

  return { success: true };
}

async function recalcOrderTotals(tx: Prisma.TransactionClient, orderId: string) {
  const items = await tx.orderItem.findMany({ where: { orderId } });
  const subtotal = items.reduce((sum, i) => sum.plus(i.totalPrice), new Prisma.Decimal(0));
  await tx.order.update({
    where: { id: orderId },
    data: { subtotal, taxAmount: new Prisma.Decimal(0), totalAmount: subtotal },
  });
}

function normalizeShape(shape?: string) {
  const upper = shape?.toUpperCase();
  if (upper === "RECTANGLE" || upper === "SQUARE" || upper === "ROUND") {
    return upper as "RECTANGLE" | "SQUARE" | "ROUND";
  }
  return null;
}

function mapTable(t: any) {
  const openOrderId = t.orders?.find((o: any) => o.status === OrderStatus.OPEN)?.id ?? null;
  return {
    id: t.id,
    name: t.name,
    seats: t.seats,
    area: t.TableArea?.name ?? null,
    areaName: t.TableArea?.name ?? null,
    areaId: t.TableArea?.id ?? null,
    shape: t.shape,
    x: t.x,
    y: t.y,
    width: t.width,
    height: t.height,
    rotation: t.rotation,
    status: t.status,
    isActive: t.isActive,
    hasOpenOrder: !!openOrderId,
    openOrderId,
  };
}

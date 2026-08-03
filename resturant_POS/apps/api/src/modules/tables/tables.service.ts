import { prisma } from "../../prisma.js";
import { TableStatus, OrderStatus, Prisma } from "@prisma/client";

export async function getTables(restaurantId: string) {
  const tables = await prisma.table.findMany({
    where: { restaurantId, isActive: true },
    orderBy: { name: "asc" },
    include: { orders: { where: { status: { in: [OrderStatus.OPEN, OrderStatus.PAID] } }, orderBy: { createdAt: "desc" }, take: 1 } },
  });

  return tables.map(mapTable);
}

export async function createTable(
  restaurantId: string,
  data: { name: string; seats?: number; area?: string; shape?: string; x?: number; y?: number }
) {
  const table = await prisma.table.create({
    data: {
      restaurantId,
      name: data.name,
      seats: data.seats ?? 4,
      area: data.area ?? "Main Hall",
      shape: data.shape ?? "circle",
      x: data.x ?? 0,
      y: data.y ?? 0,
      status: TableStatus.AVAILABLE,
    },
    include: { orders: { where: { status: OrderStatus.OPEN }, take: 1 } },
  });

  return mapTable(table);
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
    await tx.orderChangeLog.create({
      data: { orderId: sourceOrder.id, userId: "system", action: "TRANSFER", payload: { fromTableId: source.id, toTableId: target.id } as any },
    });
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
      if (targetOrder) {
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
              course: item.course,
            },
          });
        }
        await tx.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.VOIDED, notes: order.notes ? `${order.notes} (merged into ${targetOrder.id})` : `Merged into ${targetOrder.id}` },
        });
      } else {
        await tx.order.update({ where: { id: order.id }, data: { tableId: target.id } });
      }
    }

    await tx.table.updateMany({ where: { id: { in: sourceTableIds } }, data: { status: TableStatus.AVAILABLE } });
    await tx.table.update({ where: { id: target.id }, data: { status: TableStatus.OCCUPIED } });

    const logOrderId = targetOrder ? targetOrder.id : sourceOrders[0]!.id;
    await tx.orderChangeLog.create({
      data: { orderId: logOrderId, userId: "system", action: "MERGE", payload: { sourceTableIds, targetTableId } as any },
    });

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

function mapTable(t: any) {
  const openOrderId = t.orders?.find((o: any) => o.status === OrderStatus.OPEN)?.id ?? null;
  return {
    id: t.id,
    name: t.name,
    seats: t.seats,
    area: t.area,
    areaName: t.area,
    shape: t.shape,
    x: t.x,
    y: t.y,
    status: t.status,
    isActive: t.isActive,
    hasOpenOrder: !!openOrderId,
    openOrderId,
  };
}

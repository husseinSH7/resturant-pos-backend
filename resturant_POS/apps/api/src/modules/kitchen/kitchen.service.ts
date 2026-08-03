import { prisma } from "../../prisma.js";
import { KitchenStatus, OrderStatus } from "@prisma/client";

export async function getTickets(restaurantId: string) {
  const orders = await prisma.order.findMany({
    where: {
      restaurantId,
      status: { in: [OrderStatus.OPEN, OrderStatus.PAID] },
      kitchenStatus: { in: [KitchenStatus.PENDING, KitchenStatus.PREPARING, KitchenStatus.READY] },
    },
    orderBy: { createdAt: "asc" },
    include: {
      table: true,
      items: {
        include: { product: true, modifiers: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return orders.map((o) => ({
    id: o.id,
    status: o.kitchenStatus,
    createdAt: o.createdAt.toISOString(),
    order: {
      id: o.id,
      orderNumber: o.orderNumber,
      orderType: o.orderType,
      table: o.table ? { name: o.table.name } : null,
      items: o.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        product: { name: item.product?.name ?? item.productId },
        modifiers: item.modifiers.map((m) => ({
          nameSnapshot: m.nameSnapshot,
          priceDelta: m.priceSnapshot.toNumber(),
        })),
      })),
    },
  }));
}

export async function updateTicketStatus(
  restaurantId: string,
  userId: string,
  ticketId: string,
  status: string
) {
  const order = await prisma.order.findFirst({
    where: { id: ticketId, restaurantId },
  });

  if (!order) throw new Error("Ticket not found");

  const updated = await prisma.order.update({
    where: { id: ticketId },
    data: { kitchenStatus: status as KitchenStatus },
    include: {
      table: true,
      items: { include: { product: true, modifiers: true }, orderBy: { createdAt: "asc" } },
    },
  });

  await prisma.orderChangeLog.create({
    data: { orderId: ticketId, userId, action: "KITCHEN_STATUS", payload: { status } as any },
  });

  return {
    id: updated.id,
    status: updated.kitchenStatus,
    createdAt: updated.createdAt.toISOString(),
    order: {
      id: updated.id,
      orderNumber: updated.orderNumber,
      orderType: updated.orderType,
      table: updated.table ? { name: updated.table.name } : null,
      items: updated.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        product: { name: item.product?.name ?? item.productId },
        modifiers: item.modifiers.map((m) => ({
          nameSnapshot: m.nameSnapshot,
          priceDelta: m.priceSnapshot.toNumber(),
        })),
      })),
    },
  };
}

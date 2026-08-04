import { prisma } from "../../prisma.js";
import { KitchenStatus } from "@prisma/client";

export async function getTickets(restaurantId: string) {
  const tickets = await prisma.kitchenTicket.findMany({
    where: {
      restaurantId,
      status: { in: [KitchenStatus.PENDING, KitchenStatus.PREPARING, KitchenStatus.READY] },
    },
    orderBy: { createdAt: "asc" },
    include: {
      Order: {
        include: {
          table: true,
          items: { include: { product: true, modifiers: true }, orderBy: { createdAt: "asc" } },
        },
      },
    },
  });

  return tickets.map((t) => ({
    id: t.id,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
    order: t.Order
      ? {
          id: t.Order.id,
          orderNumber: t.Order.orderNumber,
          orderType: t.Order.orderType,
          notes: t.Order.notes,
          table: t.Order.table ? { name: t.Order.table.name } : null,
          items: t.Order.items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            product: { name: item.product?.name ?? item.productId },
            modifiers: item.modifiers.map((m) => ({
              nameSnapshot: m.nameSnapshot,
              priceDelta: m.priceDelta.toNumber(),
            })),
          })),
        }
      : null,
  }));
}

export async function updateTicketStatus(
  restaurantId: string,
  userId: string,
  ticketId: string,
  status: string
) {
  const ticket = await prisma.kitchenTicket.findFirst({
    where: { id: ticketId, restaurantId },
  });

  if (!ticket) throw new Error("Ticket not found");

  const updated = await prisma.kitchenTicket.update({
    where: { id: ticketId },
    data: { status: status as KitchenStatus },
    include: {
      Order: {
        include: {
          table: true,
          items: { include: { product: true, modifiers: true }, orderBy: { createdAt: "asc" } },
        },
      },
    },
  });

  return {
    id: updated.id,
    status: updated.status,
    createdAt: updated.createdAt.toISOString(),
    order: updated.Order
      ? {
          id: updated.Order.id,
          orderNumber: updated.Order.orderNumber,
          orderType: updated.Order.orderType,
          notes: updated.Order.notes,
          table: updated.Order.table ? { name: updated.Order.table.name } : null,
          items: updated.Order.items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            product: { name: item.product?.name ?? item.productId },
            modifiers: item.modifiers.map((m) => ({
              nameSnapshot: m.nameSnapshot,
              priceDelta: m.priceDelta.toNumber(),
            })),
          })),
        }
      : null,
  };
}

export async function createKitchenTicketForOrder(restaurantId: string, orderId: string) {
  const existing = await prisma.kitchenTicket.findUnique({ where: { orderId } });
  if (existing) return existing;

  return prisma.kitchenTicket.create({
    data: {
      id: orderId,
      restaurantId,
      orderId,
      status: KitchenStatus.PENDING,
      updatedAt: new Date(),
    },
  });
}

import { prisma } from "../../prisma.js";
import { KitchenStatus } from "@prisma/client";
import { broadcastToRestaurant } from "../../websocket/index.js";
import { createAuditLog } from "../../services/audit.service.js";
import crypto from "crypto";

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
          items: { 
            include: { product: true, modifiers: true }, 
            orderBy: { createdAt: "asc" } 
          },
        },
      },
    },
  });

  return tickets.map((t) => ({
    id: t.id,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
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
            unitPrice: item.unitPrice.toNumber(),
            notes: item.notes,
            modifiers: item.modifiers.map((m) => ({
              id: m.id,
              nameSnapshot: m.nameSnapshot,
              priceDelta: m.priceDelta.toNumber(),
            })),
            // Highlight if item was added after ticket creation
            isModified: item.createdAt > t.createdAt,
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
    include: {
      Order: true,
    },
  });

  if (!ticket) throw new Error("Ticket not found");

  // Validate status transitions
  const validTransitions: Record<string, string[]> = {
    PENDING: ["PREPARING"],
    PREPARING: ["READY"],
    READY: [], // READY is the final state in current schema
  };

  const currentStatus = ticket.status as KitchenStatus;
  const newStatus = status as KitchenStatus;

  if (!validTransitions[currentStatus]?.includes(newStatus)) {
    throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
  }

  const updated = await prisma.kitchenTicket.update({
    where: { id: ticketId },
    data: { status: newStatus, updatedAt: new Date() },
    include: {
      Order: {
        include: {
          table: true,
          items: { include: { product: true, modifiers: true }, orderBy: { createdAt: "asc" } },
        },
      },
    },
  });

  // Log the status change
  await createAuditLog({
    restaurantId,
    userId,
    action: "KITCHEN_TICKET_STATUS_CHANGED",
    entityType: "KITCHEN_TICKET",
    entityId: ticketId,
    details: `Updated kitchen ticket for order #${ticket.Order?.orderNumber} from ${currentStatus} to ${newStatus}`,
  });

  // Broadcast status update to connected clients
  broadcastToRestaurant(restaurantId, 'kitchen-ticket-updated', {
    ticketId: updated.id,
    status: updated.status,
    orderNumber: updated.Order?.orderNumber,
  });

  return {
    id: updated.id,
    status: updated.status,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
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
            unitPrice: item.unitPrice.toNumber(),
            notes: item.notes,
            modifiers: item.modifiers.map((m) => ({
              id: m.id,
              nameSnapshot: m.nameSnapshot,
              priceDelta: m.priceDelta.toNumber(),
            })),
            // Highlight if item was added after ticket creation
            isModified: item.createdAt > updated.createdAt,
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

import { prisma } from "../../prisma.js";
import { OrderStatus, TableStatus, OrderType, PaymentMethod, Prisma } from "@prisma/client";
import { createKitchenTicketForOrder } from "../kitchen/kitchen.service.js";

type OrderInputItem = {
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  modifiers?: { modifierOptionId?: string; nameSnapshot?: string; priceDelta?: number }[];
};

export async function createOrder(
  restaurantId: string,
  userId: string,
  data: {
    tableId?: string | null;
    customerId?: string | null;
    orderType?: string;
    subtotal?: number;
    taxAmount?: number;
    totalAmount?: number;
    notes?: string;
    items: OrderInputItem[];
  }
) {
  const orderNumber = await nextOrderNumber(restaurantId);
  const orderType = (data.orderType as OrderType | undefined) ?? OrderType.DINE_IN;

  const order = await prisma.$transaction(async (tx) => {
    if (data.tableId) {
      await tx.table.updateMany({
        where: { id: data.tableId, restaurantId },
        data: { status: TableStatus.OCCUPIED },
      });
    }

    const computedSubtotal = data.items.reduce(
      (sum, i) => sum + (i.totalPrice ?? 0),
      0
    );
    const subtotal = data.subtotal ?? computedSubtotal;
    const tax = data.taxAmount ?? 0;
    const total = data.totalAmount ?? subtotal + tax;

    const created = await tx.order.create({
      data: {
        restaurantId,
        userId,
        tableId: data.tableId ?? null,
        customerId: data.customerId ?? null,
        orderNumber,
        orderType,
        status: OrderStatus.OPEN,
        subtotal: new Prisma.Decimal(subtotal),
        taxAmount: new Prisma.Decimal(tax),
        totalAmount: new Prisma.Decimal(total),
        notes: data.notes ?? null,
      },
      include: { table: true },
    });

    for (const item of data.items) {
      const createdItem = await tx.orderItem.create({
        data: {
          orderId: created.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: new Prisma.Decimal(item.unitPrice),
          totalPrice: new Prisma.Decimal(item.totalPrice),
          notes: item.notes ?? null,
        },
        include: { product: true },
      });

      const validModifiers = (item.modifiers ?? []).filter((m) => m.modifierOptionId);
      if (validModifiers.length > 0) {
        await tx.orderItemModifier.createMany({
          data: validModifiers.map((m) => ({
            orderItemId: createdItem.id,
            modifierOptionId: m.modifierOptionId!,
            nameSnapshot: m.nameSnapshot ?? "Modifier",
            priceDelta: new Prisma.Decimal(m.priceDelta ?? 0),
          })),
        });
      }
    }

    return created;
  });

  const full = await prisma.order.findFirst({
    where: { id: order.id, restaurantId },
    include: {
      table: true,
      items: { include: { product: true, modifiers: true }, orderBy: { createdAt: "asc" } },
    },
  });

  await createKitchenTicketForOrder(restaurantId, order.id);

  // Broadcast new order to connected clients
  broadcastToRestaurant(restaurantId, 'order-created', mapOrder(full!));

  return mapOrder(full!);
}

export async function getOrders(restaurantId: string, filters?: { status?: string }) {
  const where: Prisma.OrderWhereInput = { restaurantId };
  if (filters?.status) {
    where.status = filters.status as OrderStatus;
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      table: true,
      items: { include: { product: true, modifiers: true }, orderBy: { createdAt: "asc" } },
    },
  });

  return orders.map(mapOrder);
}

export async function getOrderById(restaurantId: string, id: string) {
  const order = await prisma.order.findFirst({
    where: { id, restaurantId },
    include: {
      table: true,
      items: { include: { product: true, modifiers: true }, orderBy: { createdAt: "asc" } },
    },
  });

  return order ? mapOrder(order) : null;
}

export async function addOrderItems(
  restaurantId: string,
  userId: string,
  orderId: string,
  items: OrderInputItem[]
) {
  const order = await prisma.order.findFirst({ where: { id: orderId, restaurantId } });
  if (!order) throw new Error("Order not found");

  const createdItems = await prisma.$transaction(async (tx) => {
    const result = [];
    for (const item of items) {
      const newItem = await tx.orderItem.create({
        data: {
          orderId,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: new Prisma.Decimal(item.unitPrice),
          totalPrice: new Prisma.Decimal(item.totalPrice),
          notes: item.notes ?? null,
        },
        include: { product: true },
      });

      const validModifiers = (item.modifiers ?? []).filter((m) => m.modifierOptionId);
      if (validModifiers.length > 0) {
        await tx.orderItemModifier.createMany({
          data: validModifiers.map((m) => ({
            orderItemId: newItem.id,
            modifierOptionId: m.modifierOptionId!,
            nameSnapshot: m.nameSnapshot ?? "Modifier",
            priceDelta: new Prisma.Decimal(m.priceDelta ?? 0),
          })),
        });
      }

      const withModifiers = await tx.orderItem.findFirst({
        where: { id: newItem.id },
        include: { product: true, modifiers: true },
      });
      if (withModifiers) result.push(withModifiers);
    }

    await recalcOrderTotals(tx, orderId);
    return result;
  });

  return createdItems.map(mapItem);
}

export async function payOrder(
  restaurantId: string,
  userId: string,
  orderId: string,
  data: {
    paymentMethod: string;
    terminalReference?: string;
  }
) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, restaurantId },
    include: { table: true },
  });

  if (!order) throw new Error("Order not found");
  if (order.status !== OrderStatus.OPEN) throw new Error("Order is not open");

  const updated = await prisma.$transaction(async (tx) => {
    if (order.tableId) {
      await tx.table.updateMany({
        where: { id: order.tableId, restaurantId },
        data: { status: TableStatus.PAID },
      });
    }

    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.PAID,
        paymentMethod: data.paymentMethod as PaymentMethod,
        terminalReference: data.terminalReference ?? null,
      },
      include: {
        table: true,
        items: { include: { product: true, modifiers: true }, orderBy: { createdAt: "asc" } },
      },
    });

    return updatedOrder;
  });

  return mapOrder(updated);
}

export async function voidOrder(restaurantId: string, userId: string, orderId: string, reason?: string) {
  const order = await prisma.order.findFirst({ where: { id: orderId, restaurantId } });
  if (!order) throw new Error("Order not found");
  if (order.status === OrderStatus.VOIDED) throw new Error("Order already voided");

  const updated = await prisma.$transaction(async (tx) => {
    if (order.tableId) {
      await tx.table.updateMany({
        where: { id: order.tableId, restaurantId },
        data: { status: TableStatus.AVAILABLE },
      });
    }

    return tx.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.VOIDED,
        notes: reason ? `Voided: ${reason}` : order.notes,
      },
      include: {
        table: true,
        items: { include: { product: true, modifiers: true }, orderBy: { createdAt: "asc" } },
      },
    });
  });

  return mapOrder(updated);
}

export async function refundOrder(
  restaurantId: string,
  userId: string,
  orderId: string,
  data: {
    amount: number;
    reason: string;
    paymentId?: string;
  }
) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, restaurantId },
    include: { payments: true },
  });

  if (!order) throw new Error("Order not found");
  if (order.status !== OrderStatus.PAID) throw new Error("Order must be paid to refund");

  const payment = data.paymentId
    ? order.payments.find((p) => p.id === data.paymentId)
    : order.payments[0];

  if (!payment) throw new Error("Payment not found");
  if (data.amount > Number(payment.amount)) throw new Error("Refund amount exceeds payment amount");

  const refund = await prisma.$transaction(async (tx) => {
    const createdRefund = await tx.refund.create({
      data: {
        restaurantId,
        userId,
        paymentId: payment.id,
        amount: new Prisma.Decimal(data.amount),
        reason: data.reason,
        reference: `REF-${Date.now()}`,
      },
    });

    const totalRefunded = await tx.refund.aggregate({
      where: { paymentId: payment.id },
      _sum: { amount: true },
    });

    const refundTotal = Number(totalRefunded._sum.amount || 0);
    if (refundTotal >= Number(payment.amount)) {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "REFUNDED" },
      });
    }

    return createdRefund;
  });

  return {
    success: true,
    refund: {
      id: refund.id,
      amount: Number(refund.amount),
      reason: refund.reason,
      reference: refund.reference,
    },
  };
}

async function nextOrderNumber(restaurantId: string) {
  const result = await prisma.order.aggregate({
    where: { restaurantId },
    _max: { orderNumber: true },
  });
  return (result._max.orderNumber ?? 999) + 1;
}

async function recalcOrderTotals(tx: Prisma.TransactionClient, orderId: string) {
  const items = await tx.orderItem.findMany({ where: { orderId } });
  const subtotal = items.reduce(
    (sum, i) => sum.plus(i.totalPrice),
    new Prisma.Decimal(0)
  );
  const tax = new Prisma.Decimal(0);
  const total = subtotal.plus(tax);

  await tx.order.update({
    where: { id: orderId },
    data: { subtotal, taxAmount: tax, totalAmount: total },
  });
}

function mapOrder(order: any) {
  return {
    id: order.id,
    restaurantId: order.restaurantId,
    userId: order.userId,
    customerId: order.customerId,
    tableId: order.tableId,
    orderNumber: order.orderNumber,
    orderType: order.orderType,
    status: order.status,
    paymentMethod: order.paymentMethod,
    subtotal: order.subtotal.toNumber(),
    taxAmount: order.taxAmount.toNumber(),
    totalAmount: order.totalAmount.toNumber(),
    terminalReference: order.terminalReference,
    notes: order.notes,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    table: order.table ? { id: order.table.id, name: order.table.name } : null,
    items: order.items.map(mapItem),
  };
}

function mapItem(item: any) {
  return {
    id: item.id,
    productId: item.productId,
    name: item.product?.name ?? item.productId,
    quantity: item.quantity,
    unitPrice: item.unitPrice.toNumber(),
    totalPrice: item.totalPrice.toNumber(),
    notes: item.notes,
    product: item.product ? { id: item.product.id, name: item.product.name, price: item.product.price.toNumber() } : undefined,
    modifiers: item.modifiers.map((m: any) => ({
      id: m.id,
      modifierOptionId: m.modifierOptionId,
      name: m.nameSnapshot,
      nameSnapshot: m.nameSnapshot,
      priceDelta: m.priceDelta.toNumber(),
      priceSnapshot: m.priceDelta.toNumber(),
      quantity: 1,
      totalPrice: m.priceDelta.toNumber(),
    })),
  };
}

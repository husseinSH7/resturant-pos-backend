import { prisma } from "../../prisma.js";
import { OrderStatus, TableStatus, OrderType, PaymentMethod, Prisma, SplitType } from "@prisma/client";
import { createKitchenTicketForOrder } from "../kitchen/kitchen.service.js";
import { broadcastToRestaurant } from "../../websocket/index.js";
import { createAuditLog } from "../../services/audit.service.js";
import { deductInventoryForOrder, refundInventoryForOrder } from "../inventory/inventory.service.js";
import { calculateTax, roundAmount } from "../settings/settings.service.js";
import { awardLoyaltyPointsForOrder } from "../customers/customers.service.js";
import crypto from "crypto";

type OrderInputItem = {
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string | null;
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
    notes?: string | null;
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
    
    // Calculate tax using restaurant settings
    const taxCalculation = await calculateTax(restaurantId, subtotal);
    const tax = data.taxAmount ?? taxCalculation.taxAmount;
    const total = data.totalAmount ?? taxCalculation.total;

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

// Split payment functions
export async function createOrderSplit(
  restaurantId: string,
  userId: string,
  orderId: string,
  data: {
    name?: string | undefined;
    amount: number;
    splitType: SplitType;
    customerId?: string | undefined;
  }
) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, restaurantId },
  });

  if (!order) throw new Error("Order not found");
  if (order.status !== OrderStatus.OPEN) throw new Error("Order must be open to create splits");

  const orderSplit = await prisma.orderSplit.create({
    data: {
      orderId,
      name: data.name || "Split",
      amount: new Prisma.Decimal(data.amount),
      splitType: data.splitType,
      customerId: data.customerId || null,
    },
    include: { customer: true },
  });

  await createAuditLog({
    restaurantId,
    userId,
    action: "ORDER_SPLIT_CREATED",
    entityType: "ORDER_SPLIT",
    entityId: orderSplit.id,
    details: `Created ${data.splitType} split of $${data.amount} for order #${order.orderNumber}`,
  });

  return orderSplit;
}

export async function createPaymentSplit(
  restaurantId: string,
  userId: string,
  paymentId: string,
  orderSplitId: string,
  amount: number
) {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, restaurantId },
  });

  if (!payment) throw new Error("Payment not found");

  const orderSplit = await prisma.orderSplit.findFirst({
    where: { id: orderSplitId },
    include: { order: true },
  });

  if (!orderSplit) throw new Error("Order split not found");
  if (orderSplit.order.restaurantId !== restaurantId) throw new Error("Order split does not belong to this restaurant");

  const paymentSplit = await prisma.paymentSplit.create({
    data: {
      orderSplitId,
      paymentId,
      amount: new Prisma.Decimal(amount),
    },
  });

  await createAuditLog({
    restaurantId,
    userId,
    action: "PAYMENT_SPLIT_CREATED",
    entityType: "PAYMENT_SPLIT",
    entityId: paymentSplit.id,
    details: `Created payment split of $${amount} for payment ${paymentId}`,
  });

  return paymentSplit;
}

export async function payOrderWithSplit(
  restaurantId: string,
  userId: string,
  orderId: string,
  data: {
    splits: Array<{
      amount: number;
      paymentMethod: PaymentMethod;
      terminalReference?: string | undefined;
      cardLast4?: string | undefined;
      tipAmount?: number | undefined;
      cashTendered?: number | undefined;
    }>;
  }
) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, restaurantId },
    include: { table: true },
  });

  if (!order) throw new Error("Order not found");
  if (order.status !== OrderStatus.OPEN) throw new Error("Order is not open");

  const totalSplitAmount = data.splits.reduce((sum, split) => sum + split.amount, 0);
  if (totalSplitAmount !== Number(order.totalAmount)) {
    throw new Error(`Split amounts must equal order total. Order: $${order.totalAmount}, Splits: $${totalSplitAmount}`);
  }

  const result = await prisma.$transaction(async (tx) => {
    if (order.tableId) {
      await tx.table.updateMany({
        where: { id: order.tableId, restaurantId },
        data: { status: TableStatus.AVAILABLE },
      });
    }

    // Create payments for each split
    const payments = [];
    for (const split of data.splits) {
      const payment = await tx.payment.create({
        data: {
          id: crypto.randomUUID(),
          restaurantId,
          userId,
          orderId,
          amount: new Prisma.Decimal(split.amount),
          method: split.paymentMethod,
          terminalReference: split.terminalReference || null,
          cardLast4: split.cardLast4 || null,
          tipAmount: new Prisma.Decimal(split.tipAmount || 0),
          cashTendered: split.cashTendered ? new Prisma.Decimal(split.cashTendered) : null,
          changeAmount: split.cashTendered && split.cashTendered > split.amount
            ? new Prisma.Decimal(split.cashTendered - split.amount)
            : null,
          status: "COMPLETED",
          updatedAt: new Date(),
        },
      });
      payments.push(payment);
    }

    // Update order status
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.PAID,
        paymentMethod: PaymentMethod.CARD, // Set to CARD as default for split payments
      },
      include: {
        table: true,
        items: { include: { product: true, modifiers: true }, orderBy: { createdAt: "asc" } },
        Payment: true,
      },
    });

    return { order: updatedOrder, payments };
  });

  await createAuditLog({
    restaurantId,
    userId,
    action: "ORDER_PAID_SPLIT",
    entityType: "ORDER",
    entityId: orderId,
    details: `Paid order #${order.orderNumber} with ${data.splits.length} split payments totaling $${totalSplitAmount}`,
  });

  // Award loyalty points after successful payment
  try {
    await awardLoyaltyPointsForOrder(restaurantId, orderId, userId);
  } catch (error) {
    console.error("Failed to award loyalty points:", error);
    // Don't fail the payment if loyalty points awarding fails
  }

  broadcastToRestaurant(restaurantId, 'order-paid', mapOrder(result.order));

  return {
    order: mapOrder(result.order),
    payments: result.payments,
  };
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

    await recalcOrderTotals(tx, orderId, restaurantId);
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
    terminalReference?: string | null | undefined;
    cardLast4?: string | null;
    tipAmount?: number;
    cashTendered?: number;
    giftCardId?: string | null;
    payments?: Array<{
      amount: number;
      paymentMethod: PaymentMethod;
      terminalReference?: string | null;
      cardLast4?: string | null;
      tipAmount?: number;
      cashTendered?: number;
      giftCardId?: string | null;
    }>;
  }
) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, restaurantId },
    include: { table: true },
  });

  if (!order) throw new Error("Order not found");
  if (order.status !== OrderStatus.OPEN) throw new Error("Order is not open");

  // Handle mixed payments
  if (data.paymentMethod === PaymentMethod.MIXED && data.payments && data.payments.length > 0) {
    const convertedSplits = data.payments.map(p => ({
      amount: p.amount,
      paymentMethod: p.paymentMethod,
      terminalReference: p.terminalReference ?? undefined,
      cardLast4: p.cardLast4 ?? undefined,
      tipAmount: p.tipAmount ?? undefined,
      cashTendered: p.cashTendered ?? undefined,
    }));
    return payOrderWithSplit(restaurantId, userId, orderId, { splits: convertedSplits });
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (order.tableId) {
      await tx.table.updateMany({
        where: { id: order.tableId, restaurantId },
        data: { status: TableStatus.AVAILABLE },
      });
    }

    // Create single payment record
    const payment = await tx.payment.create({
      data: {
        id: crypto.randomUUID(),
        restaurantId,
        userId,
        orderId,
        amount: order.totalAmount,
        method: data.paymentMethod as PaymentMethod,
        terminalReference: data.terminalReference ?? null,
        cardLast4: data.cardLast4 ?? null,
        tipAmount: new Prisma.Decimal(data.tipAmount || 0),
        cashTendered: data.cashTendered ? new Prisma.Decimal(data.cashTendered) : null,
        changeAmount: data.cashTendered && data.cashTendered > Number(order.totalAmount)
          ? new Prisma.Decimal(data.cashTendered - Number(order.totalAmount))
          : null,
        giftCardId: data.giftCardId ?? null,
        status: "COMPLETED",
        updatedAt: new Date(),
      },
    });

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
        Payment: true,
      },
    });

    return { order: updatedOrder, payment };
  });

  // Deduct inventory after successful payment
  try {
    await deductInventoryForOrder(restaurantId, orderId);
  } catch (error) {
    console.error("Failed to deduct inventory:", error);
    // Don't fail the payment if inventory deduction fails
  }

  // Award loyalty points after successful payment
  try {
    await awardLoyaltyPointsForOrder(restaurantId, orderId, userId);
  } catch (error) {
    console.error("Failed to award loyalty points:", error);
    // Don't fail the payment if loyalty points awarding fails
  }

  return mapOrder(updated.order);
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

  await createAuditLog({
    restaurantId,
    userId,
    action: "ORDER_VOIDED",
    entityType: "ORDER",
    entityId: orderId,
    details: `Voided order #${order.orderNumber} for $${order.totalAmount}. Reason: ${reason || "No reason provided"}`,
  });

  // Restore inventory for voided order
  try {
    await refundInventoryForOrder(restaurantId, orderId);
  } catch (error) {
    console.error("Failed to restore inventory:", error);
    // Don't fail the void if inventory restoration fails
  }

  broadcastToRestaurant(restaurantId, 'order-voided', mapOrder(updated));

  return mapOrder(updated);
}

export async function refundOrder(
  restaurantId: string,
  userId: string,
  orderId: string,
  data: {
    amount: number;
    reason: string;
    paymentId?: string | undefined;
  }
) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, restaurantId },
    include: { Payment: true },
  });

  if (!order) throw new Error("Order not found");
  if (order.status !== OrderStatus.PAID) throw new Error("Order must be paid to refund");

  const payment = data.paymentId
    ? order.Payment.find((p: any) => p.id === data.paymentId)
    : order.Payment[0];

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
        updatedAt: new Date(),
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

  await createAuditLog({
    restaurantId,
    userId,
    action: "ORDER_REFUNDED",
    entityType: "REFUND",
    entityId: refund.id,
    details: `Refunded $${data.amount} for order #${order.orderNumber}. Reason: ${data.reason}`,
  });

  // Restore inventory for refunded order
  try {
    await refundInventoryForOrder(restaurantId, orderId);
  } catch (error) {
    console.error("Failed to restore inventory:", error);
    // Don't fail the refund if inventory restoration fails
  }

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

async function recalcOrderTotals(tx: Prisma.TransactionClient, orderId: string, restaurantId: string) {
  const items = await tx.orderItem.findMany({ where: { orderId } });
  const subtotal = items.reduce(
    (sum, i) => sum.plus(i.totalPrice),
    new Prisma.Decimal(0)
  );
  
  // Get tax calculation from settings
  const taxCalculation = await calculateTax(restaurantId, Number(subtotal));
  const tax = new Prisma.Decimal(taxCalculation.taxAmount);
  const total = new Prisma.Decimal(taxCalculation.total);

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

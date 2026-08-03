import { prisma } from "../../prisma.js";
import { OrderStatus, TableStatus, OrderType, PaymentMethod, Prisma } from "@prisma/client";

type OrderInputItem = {
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  course?: string;
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
          course: item.course ?? null,
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
            priceSnapshot: new Prisma.Decimal(m.priceDelta ?? 0),
            quantity: 1,
            totalPrice: new Prisma.Decimal(m.priceDelta ?? 0),
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

  await prisma.orderChangeLog.create({
    data: {
      orderId: order.id,
      userId,
      action: "CREATE",
      payload: { tableId: data.tableId, itemCount: data.items.length } as any,
    },
  });

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
          course: item.course ?? null,
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
            priceSnapshot: new Prisma.Decimal(m.priceDelta ?? 0),
            quantity: 1,
            totalPrice: new Prisma.Decimal(m.priceDelta ?? 0),
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

  await prisma.orderChangeLog.create({
    data: { orderId, userId, action: "ADD_ITEMS", payload: { itemCount: items.length } as any },
  });

  return createdItems.map(mapItem);
}

export async function payOrder(
  restaurantId: string,
  userId: string,
  orderId: string,
  data: {
    paymentMethod: string;
    amountTendered?: number;
    changeDue?: number;
    tipAmount?: number;
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

    return tx.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.PAID,
        paymentMethod: data.paymentMethod as PaymentMethod,
        amountTendered: data.amountTendered !== undefined ? new Prisma.Decimal(data.amountTendered) : null,
        changeDue: data.changeDue !== undefined ? new Prisma.Decimal(data.changeDue) : null,
        tipAmount: data.tipAmount !== undefined ? new Prisma.Decimal(data.tipAmount) : null,
        terminalReference: data.terminalReference ?? null,
      },
      include: {
        table: true,
        items: { include: { product: true, modifiers: true }, orderBy: { createdAt: "asc" } },
      },
    });
  });

  await prisma.orderChangeLog.create({
    data: { orderId, userId, action: "PAY", payload: data as any },
  });

  return mapOrder(updated);
}

export async function voidOrder(restaurantId: string, userId: string, orderId: string, reason?: string) {
  const order = await prisma.order.findFirst({ where: { id: orderId, restaurantId } });
  if (!order) throw new Error("Order not found");

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

  await prisma.orderChangeLog.create({
    data: { orderId, userId, action: "VOID", payload: { reason } as any },
  });

  return mapOrder(updated);
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
    kitchenStatus: order.kitchenStatus,
    paymentMethod: order.paymentMethod,
    subtotal: order.subtotal.toNumber(),
    taxAmount: order.taxAmount.toNumber(),
    totalAmount: order.totalAmount.toNumber(),
    amountTendered: order.amountTendered?.toNumber() ?? null,
    changeDue: order.changeDue?.toNumber() ?? null,
    tipAmount: order.tipAmount?.toNumber() ?? null,
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
    course: item.course,
    product: item.product ? { id: item.product.id, name: item.product.name, price: item.product.price.toNumber() } : undefined,
    modifiers: item.modifiers.map((m: any) => ({
      id: m.id,
      modifierOptionId: m.modifierOptionId,
      name: m.nameSnapshot,
      nameSnapshot: m.nameSnapshot,
      priceSnapshot: m.priceSnapshot.toNumber(),
      quantity: m.quantity,
      totalPrice: m.totalPrice.toNumber(),
    })),
  };
}

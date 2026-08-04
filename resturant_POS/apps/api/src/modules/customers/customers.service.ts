import { prisma } from "../../prisma.js";
import { OrderStatus } from "@prisma/client";

export async function getCustomers(restaurantId: string) {
  const customers = await prisma.customer.findMany({
    where: { restaurantId },
    orderBy: { createdAt: "desc" },
  });

  const enriched = await Promise.all(
    customers.map(async (c) => {
      const stats = await getCustomerStats(restaurantId, c.id);
      return {
        id: c.id,
        fullName: c.fullName,
        name: c.fullName,
        phone: c.phone,
        email: c.email,
        points: c.points,
        loyaltyPoints: c.points,
        totalSpent: stats.totalSpent,
        visitCount: stats.visitCount,
        notes: c.notes,
      };
    })
  );

  return enriched;
}

export async function createCustomer(
  restaurantId: string,
  data: { fullName: string; phone?: string; email?: string; notes?: string }
) {
  const customer = await prisma.customer.create({
    data: {
      restaurantId,
      fullName: data.fullName,
      phone: data.phone ?? null,
      email: data.email ?? null,
      notes: data.notes ?? null,
    },
  });

  const stats = await getCustomerStats(restaurantId, customer.id);

  return {
    id: customer.id,
    fullName: customer.fullName,
    name: customer.fullName,
    phone: customer.phone,
    email: customer.email,
    points: customer.points,
    loyaltyPoints: customer.points,
    totalSpent: stats.totalSpent,
    visitCount: stats.visitCount,
    notes: customer.notes,
  };
}

export async function getCustomerStats(restaurantId: string, customerId: string) {
  const orders = await prisma.order.findMany({
    where: { restaurantId, customerId, status: OrderStatus.PAID },
  });

  return {
    totalSpent: orders.reduce((sum, o) => sum + o.totalAmount.toNumber(), 0),
    visitCount: orders.length,
  };
}

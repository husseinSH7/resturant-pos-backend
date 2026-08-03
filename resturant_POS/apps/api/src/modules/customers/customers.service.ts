import { prisma } from "../../prisma.js";
import { OrderStatus } from "@prisma/client";

export async function getCustomers(restaurantId: string) {
  const customers = await prisma.customer.findMany({
    where: { restaurantId },
    orderBy: { createdAt: "desc" },
  });

  return customers.map((c) => ({
    id: c.id,
    fullName: c.name,
    name: c.name,
    phone: c.phone,
    email: c.email,
    points: c.loyaltyPoints,
    loyaltyPoints: c.loyaltyPoints,
    totalSpent: 0,
    visitCount: 0,
    notes: c.notes,
  }));
}

export async function createCustomer(
  restaurantId: string,
  data: { fullName: string; phone?: string; email?: string; notes?: string }
) {
  const customer = await prisma.customer.create({
    data: {
      restaurantId,
      name: data.fullName,
      phone: data.phone ?? null,
      email: data.email ?? null,
      notes: data.notes ?? null,
    },
  });

  return {
    id: customer.id,
    fullName: customer.name,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    points: customer.loyaltyPoints,
    loyaltyPoints: customer.loyaltyPoints,
    totalSpent: 0,
    visitCount: 0,
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

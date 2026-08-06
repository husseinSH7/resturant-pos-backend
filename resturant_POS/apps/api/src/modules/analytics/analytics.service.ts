import { prisma } from "../../prisma.js";
import { OrderStatus } from "@prisma/client";

export async function getSalesAnalytics(restaurantId: string, startDate?: string, endDate?: string) {
  const where: any = { restaurantId, status: OrderStatus.PAID };
  
  if (startDate) {
    where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
  }
  if (endDate) {
    where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      OrderItem: true,
      Payment: true,
    },
  });

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount.toNumber(), 0);
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Sales by hour
  const salesByHour = new Array(24).fill(0);
  orders.forEach((order) => {
    const hour = order.createdAt.getHours();
    salesByHour[hour] += order.totalAmount.toNumber();
  });

  // Sales by day
  const salesByDay = new Array(7).fill(0);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  orders.forEach((order) => {
    const day = order.createdAt.getDay();
    salesByDay[day] += order.totalAmount.toNumber();
  });

  // Payment method breakdown
  const paymentMethods = await prisma.payment.groupBy({
    by: ['method'],
    where: { restaurantId },
    _sum: { amount: true },
    _count: true,
  });

  return {
    totalRevenue,
    totalOrders,
    averageOrderValue,
    salesByHour,
    salesByDay: salesByDay.map((amount, index) => ({ day: dayNames[index], amount })),
    paymentMethods: paymentMethods.map(pm => ({
      method: pm.method,
      totalAmount: Number(pm._sum.amount || 0),
      count: pm._count,
    })),
  };
}

export async function getMenuPerformance(restaurantId: string, startDate?: string, endDate?: string) {
  const where: any = { restaurantId, status: OrderStatus.PAID };
  
  if (startDate) {
    where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
  }
  if (endDate) {
    where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      OrderItem: {
        include: {
          Modifier: true,
        },
      },
    },
  });

  // Calculate item performance
  const itemPerformance = new Map<string, any>();
  
  orders.forEach((order) => {
    order.OrderItem.forEach((item) => {
      const existing = itemPerformance.get(item.productId) || {
        name: item.name,
        quantity: 0,
        revenue: 0,
        orderCount: 0,
      };
      existing.quantity += item.quantity;
      existing.revenue += Number(item.price) * item.quantity;
      existing.orderCount += 1;
      itemPerformance.set(item.productId, existing);
    });
  });

  const topItems = Array.from(itemPerformance.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 20);

  return {
    topItems,
    totalMenuItems: itemPerformance.size,
  };
}

export async function getServerPerformance(restaurantId: string, startDate?: string, endDate?: string) {
  const where: any = { restaurantId, status: OrderStatus.PAID };
  
  if (startDate) {
    where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
  }
  if (endDate) {
    where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      User: true,
      Payment: true,
    },
  });

  const serverStats = new Map<string, any>();
  
  orders.forEach((order) => {
    const serverId = order.userId;
    const existing = serverStats.get(serverId) || {
      serverId,
      serverName: order.User?.fullName || 'Unknown',
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
    };
    existing.totalOrders += 1;
    existing.totalRevenue += order.totalAmount.toNumber();
    serverStats.set(serverId, existing);
  });

  const serverPerformance = Array.from(serverStats.values()).map((stats) => ({
    ...stats,
    averageOrderValue: stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0,
  })).sort((a, b) => b.totalRevenue - a.totalRevenue);

  return {
    serverPerformance,
    totalServers: serverPerformance.length,
  };
}

export async function getPeakHours(restaurantId: string, startDate?: string, endDate?: string) {
  const where: any = { restaurantId, status: OrderStatus.PAID };
  
  if (startDate) {
    where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
  }
  if (endDate) {
    where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
  }

  const orders = await prisma.order.findMany({
    where,
  });

  const hourlyStats = new Array(24).fill(0).map(() => ({
    hour: 0,
    orderCount: 0,
    revenue: 0,
    averageOrderValue: 0,
  }));

  orders.forEach((order) => {
    const hour = order.createdAt.getHours();
    hourlyStats[hour].hour = hour;
    hourlyStats[hour].orderCount += 1;
    hourlyStats[hour].revenue += order.totalAmount.toNumber();
  });

  hourlyStats.forEach((stat) => {
    if (stat.orderCount > 0) {
      stat.averageOrderValue = stat.revenue / stat.orderCount;
    }
  });

  const peakHours = hourlyStats
    .filter((stat) => stat.orderCount > 0)
    .sort((a, b) => b.orderCount - a.orderCount)
    .slice(0, 5);

  return {
    hourlyStats,
    peakHours,
  };
}

export async function getLaborCostAnalysis(restaurantId: string, startDate?: string, endDate?: string) {
  const where: any = { restaurantId, status: OrderStatus.PAID };
  
  if (startDate) {
    where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
  }
  if (endDate) {
    where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
  }

  const orders = await prisma.order.findMany({
    where,
  });

  const shifts = await prisma.shift.findMany({
    where: { restaurantId },
    include: {
      User: true,
    },
  });

  // Calculate labor cost (simplified - in real implementation, this would use actual hourly rates)
  const totalLaborCost = shifts.reduce((sum, shift) => {
    const duration = shift.endTime.getTime() - shift.startTime.getTime();
    const hours = duration / (1000 * 60 * 60);
    // Assuming $15/hour average - in real implementation, use actual rates
    return sum + (hours * 15);
  }, 0);

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount.toNumber(), 0);
  const laborCostPercentage = totalRevenue > 0 ? (totalLaborCost / totalRevenue) * 100 : 0;

  return {
    totalLaborCost,
    totalRevenue,
    laborCostPercentage,
    totalShifts: shifts.length,
    averageShiftsPerDay: shifts.length > 0 ? shifts.length / 7 : 0,
  };
}

export async function getSalesForecast(restaurantId: string, days: number = 7) {
  // Get historical data for the past 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const historicalOrders = await prisma.order.findMany({
    where: {
      restaurantId,
      status: OrderStatus.PAID,
      createdAt: { gte: thirtyDaysAgo },
    },
  });

  // Calculate daily averages
  const dailySales = new Map<string, number>();
  historicalOrders.forEach((order) => {
    const dateKey = order.createdAt.toISOString().split('T')[0];
    const existing = dailySales.get(dateKey) || 0;
    dailySales.set(dateKey, existing + order.totalAmount.toNumber());
  });

  const dailyAverages = Array.from(dailySales.values());
  const averageDailySales = dailyAverages.length > 0 
    ? dailyAverages.reduce((sum, val) => sum + val, 0) / dailyAverages.length 
    : 0;

  // Simple forecast based on historical average
  const forecast = [];
  for (let i = 1; i <= days; i++) {
    const forecastDate = new Date();
    forecastDate.setDate(forecastDate.getDate() + i);
    forecast.push({
      date: forecastDate.toISOString().split('T')[0],
      predictedRevenue: averageDailySales,
      dayOfWeek: forecastDate.toLocaleDateString('en-US', { weekday: 'long' }),
    });
  }

  return {
    historicalAverage: averageDailySales,
    forecast,
    confidence: 0.7, // 70% confidence for simple average model
  };
}

export async function getRealTimeMetrics(restaurantId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayOrders = await prisma.order.findMany({
    where: {
      restaurantId,
      createdAt: { gte: today, lt: tomorrow },
    },
    include: {
      OrderItem: true,
    },
  });

  const activeOrders = await prisma.order.findMany({
    where: {
      restaurantId,
      status: { in: [OrderStatus.OPEN, OrderStatus.IN_PROGRESS] },
    },
  });

  const totalRevenue = todayOrders
    .filter(o => o.status === OrderStatus.PAID)
    .reduce((sum, order) => sum + order.totalAmount.toNumber(), 0);

  const totalOrders = todayOrders.length;
  const paidOrders = todayOrders.filter(o => o.status === OrderStatus.PAID).length;

  const activeTables = await prisma.table.count({
    where: {
      restaurantId,
      status: 'OCCUPIED',
    },
  });

  const waitlistCount = await prisma.waitlistEntry.count({
    where: {
      restaurantId,
      status: 'WAITING',
    },
  });

  return {
    totalRevenue,
    totalOrders,
    paidOrders,
    activeOrders: activeOrders.length,
    activeTables,
    waitlistCount,
    averageOrderValue: paidOrders > 0 ? totalRevenue / paidOrders : 0,
    timestamp: new Date(),
  };
}
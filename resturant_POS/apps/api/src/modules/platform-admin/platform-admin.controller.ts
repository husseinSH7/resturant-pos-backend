import type { Request, Response } from "express";
import { prisma } from "../../prisma.js";
import { SubscriptionStatus } from "@prisma/client";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

function getStringParam(params: Record<string, string | string[] | undefined>, key: string): string {
  const value = params[key];
  if (typeof value !== "string") {
    throw { status: 400, message: `Invalid or missing parameter: ${key}` };
  }
  return value;
}

export async function getRestaurants(req: Request, res: Response) {
  try {
    const restaurants = await prisma.restaurant.findMany({
      include: {
        subscription: {
          include: { plan: true },
        },
        _count: {
          select: {
            tables: true,
            users: true,
            devices: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(restaurants);
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    res.status(500).json({ message: "Failed to fetch restaurants" });
  }
}

export async function getRestaurant(req: Request, res: Response) {
  try {
    const id = getStringParam(req.params, "id");
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        subscription: {
          include: { plan: true },
        },
        tables: true,
        users: true,
        devices: true,
      },
    });

    if (!restaurant) {
      res.status(404).json({ message: "Restaurant not found" });
      return;
    }

    res.json(restaurant);
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    console.error("Error fetching restaurant:", error);
    res.status(500).json({ message: "Failed to fetch restaurant" });
  }
}

export async function createRestaurant(req: Request, res: Response) {
  try {
    const { name, slug, address, phone, ownerEmail, ownerPassword, planId } = req.body as {
      name: string;
      slug: string;
      address?: string;
      phone?: string;
      ownerEmail: string;
      ownerPassword: string;
      planId: string;
    };

    // Check if slug already exists
    const existing = await prisma.restaurant.findUnique({ where: { slug } });
    if (existing) {
      res.status(400).json({ message: "Restaurant slug already exists" });
      return;
    }

    // Create restaurant
    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        slug,
        address: address || null,
        phone: phone || null,
        isActive: true,
      },
    });

    // Create subscription
    const subscription = await prisma.subscription.create({
      data: {
        restaurantId: restaurant.id,
        planId,
        status: SubscriptionStatus.TRIAL,
        trialUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
      },
    });

    // Create owner account
    const passwordHash = await bcrypt.hash(ownerPassword, SALT_ROUNDS);
    const owner = await prisma.user.create({
      data: {
        restaurantId: restaurant.id,
        fullName: name + " Owner",
        email: ownerEmail,
        passwordHash,
        role: "OWNER",
        isActive: true,
      },
    });

    res.status(201).json({
      restaurant,
      subscription,
      owner: {
        id: owner.id,
        fullName: owner.fullName,
        email: owner.email,
        role: owner.role,
      },
    });
  } catch (error) {
    console.error("Error creating restaurant:", error);
    res.status(500).json({ message: "Failed to create restaurant" });
  }
}

export async function updateRestaurant(req: Request, res: Response) {
  try {
    const id = getStringParam(req.params, "id");
    const { name, address, phone, isActive } = req.body as {
      name?: string;
      address?: string;
      phone?: string;
      isActive?: boolean;
    };

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address || null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: updateData,
    });

    res.json(restaurant);
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    console.error("Error updating restaurant:", error);
    res.status(500).json({ message: "Failed to update restaurant" });
  }
}

export async function getPlans(req: Request, res: Response) {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { basePrice: "asc" },
    });

    res.json(plans);
  } catch (error) {
    console.error("Error fetching plans:", error);
    res.status(500).json({ message: "Failed to fetch plans" });
  }
}

export async function createPlan(req: Request, res: Response) {
  try {
    const { name, basePrice, maxTables, maxScreens, maxStaff, maxLocations, features } = req.body as {
      name: string;
      basePrice: number;
      maxTables: number;
      maxScreens: number;
      maxStaff: number;
      maxLocations: number;
      features?: any;
    };

    const plan = await prisma.plan.create({
      data: {
        name,
        basePrice,
        maxTables,
        maxScreens,
        maxStaff,
        maxLocations,
        features: features || {},
        isActive: true,
      },
    });

    res.status(201).json(plan);
  } catch (error) {
    console.error("Error creating plan:", error);
    res.status(500).json({ message: "Failed to create plan" });
  }
}

export async function updatePlan(req: Request, res: Response) {
  try {
    const id = getStringParam(req.params, "id");
    const { name, basePrice, maxTables, maxScreens, maxStaff, maxLocations, features, isActive } = req.body as {
      name?: string;
      basePrice?: number;
      maxTables?: number;
      maxScreens?: number;
      maxStaff?: number;
      maxLocations?: number;
      features?: any;
      isActive?: boolean;
    };

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (basePrice !== undefined) updateData.basePrice = basePrice;
    if (maxTables !== undefined) updateData.maxTables = maxTables;
    if (maxScreens !== undefined) updateData.maxScreens = maxScreens;
    if (maxStaff !== undefined) updateData.maxStaff = maxStaff;
    if (maxLocations !== undefined) updateData.maxLocations = maxLocations;
    if (features !== undefined) updateData.features = features;
    if (isActive !== undefined) updateData.isActive = isActive;

    const plan = await prisma.plan.update({
      where: { id },
      data: updateData,
    });

    res.json(plan);
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    console.error("Error updating plan:", error);
    res.status(500).json({ message: "Failed to update plan" });
  }
}

export async function updateSubscription(req: Request, res: Response) {
  try {
    const restaurantId = getStringParam(req.params, "restaurantId");
    const { planId, status, trialUntil, paidUntil, maxScreens, maxTables, maxStaff, maxLocations } = req.body;

    const subscription = await prisma.subscription.update({
      where: { restaurantId },
      data: {
        planId,
        status,
        trialUntil: trialUntil ? new Date(trialUntil) : null,
        paidUntil: paidUntil ? new Date(paidUntil) : null,
        maxScreens,
        maxTables,
        maxStaff,
        maxLocations,
      },
      include: { plan: true },
    });

    res.json(subscription);
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    console.error("Error updating subscription:", error);
    res.status(500).json({ message: "Failed to update subscription" });
  }
}

export async function getGlobalAnalytics(req: Request, res: Response) {
  try {
    const [
      totalRestaurants,
      activeRestaurants,
      totalRevenue,
      totalActiveScreens,
      plansCount,
      subscriptionsByStatus,
    ] = await Promise.all([
      prisma.restaurant.count(),
      prisma.restaurant.count({ where: { isActive: true } }),
      prisma.order.aggregate({
        where: { status: "PAID" },
        _sum: { totalAmount: true },
      }),
      prisma.device.count({ where: { isActive: true } }),
      prisma.plan.count({ where: { isActive: true } }),
      prisma.subscription.groupBy({
        by: ["status"],
        _count: true,
      }),
    ]);

    const mrr = subscriptionsByStatus
      .filter((s) => s.status === "ACTIVE")
      .reduce((sum, s) => {
        // This would need actual calculation based on plan prices
        return sum; // Placeholder
      }, 0);

    res.json({
      totalRestaurants,
      activeRestaurants,
      totalRevenue: totalRevenue._sum.totalAmount?.toNumber() || 0,
      totalActiveScreens,
      plansCount,
      subscriptionsByStatus,
      mrr,
    });
  } catch (error) {
    console.error("Error fetching global analytics:", error);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
}

export async function getAuditLogs(req: Request, res: Response) {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const logs = await prisma.auditLog.findMany({
      take: Number(limit),
      skip: Number(offset),
      orderBy: { createdAt: "desc" },
      include: {
        Restaurant: {
          select: { name: true },
        },
      },
    });

    const total = await prisma.auditLog.count();

    res.json({ logs, total });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({ message: "Failed to fetch audit logs" });
  }
}
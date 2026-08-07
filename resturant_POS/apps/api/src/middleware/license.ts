import type { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma.js";
import { SubscriptionStatus } from "@prisma/client";

export async function checkSubscriptionStatus(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.restaurantId) {
    // Platform admin doesn't need subscription check
    if (req.user?.role === "PLATFORM_ADMIN") {
      return next();
    }
    res.status(401).json({ message: "Unauthorized: no restaurant context" });
    return;
  }

  const subscription = await prisma.subscription.findUnique({
    where: { restaurantId: req.user.restaurantId },
    include: { plan: true },
  });

  if (!subscription) {
    res.status(403).json({ message: "No subscription found" });
    return;
  }

  // Check if subscription is active or in trial
  if (subscription.status !== SubscriptionStatus.ACTIVE && subscription.status !== SubscriptionStatus.TRIAL) {
    res.status(403).json({ 
      message: "Subscription is not active",
      status: subscription.status 
    });
    return;
  }

  // Check if trial has expired
  if (subscription.status === SubscriptionStatus.TRIAL && subscription.trialUntil && subscription.trialUntil < new Date()) {
    res.status(403).json({ message: "Trial period has expired" });
    return;
  }

  // Check if paid period has expired
  if (subscription.status === SubscriptionStatus.ACTIVE && subscription.paidUntil && subscription.paidUntil < new Date()) {
    res.status(403).json({ message: "Subscription has expired" });
    return;
  }

  req.subscription = {
    id: subscription.id,
    status: subscription.status,
    planId: subscription.planId,
    maxScreens: subscription.maxScreens ?? subscription.plan.maxScreens,
    maxTables: subscription.maxTables ?? subscription.plan.maxTables,
    maxStaff: subscription.maxStaff ?? subscription.plan.maxStaff,
    maxLocations: subscription.maxLocations ?? subscription.plan.maxLocations,
  };

  next();
}

export async function checkTableLimit(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.restaurantId || !req.subscription) {
    return next();
  }

  const currentTableCount = await prisma.table.count({
    where: { 
      restaurantId: req.user.restaurantId,
      isActive: true 
    },
  });

  if (currentTableCount >= req.subscription.maxTables) {
    res.status(403).json({ 
      message: "Table limit reached",
      current: currentTableCount,
      max: req.subscription.maxTables 
    });
    return;
  }

  next();
}

export async function checkDeviceLimit(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.restaurantId || !req.subscription) {
    return next();
  }

  const currentDeviceCount = await prisma.device.count({
    where: { 
      restaurantId: req.user.restaurantId,
      isActive: true 
    },
  });

  if (currentDeviceCount >= req.subscription.maxScreens) {
    res.status(403).json({ 
      message: "Device/screen limit reached",
      current: currentDeviceCount,
      max: req.subscription.maxScreens 
    });
    return;
  }

  next();
}

export async function checkStaffLimit(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.restaurantId || !req.subscription) {
    return next();
  }

  const currentStaffCount = await prisma.user.count({
    where: { 
      restaurantId: req.user.restaurantId,
      isActive: true,
      role: { in: ["MANAGER", "CASHIER", "KITCHEN"] }
    },
  });

  if (currentStaffCount >= req.subscription.maxStaff) {
    res.status(403).json({ 
      message: "Staff limit reached",
      current: currentStaffCount,
      max: req.subscription.maxStaff 
    });
    return;
  }

  next();
}

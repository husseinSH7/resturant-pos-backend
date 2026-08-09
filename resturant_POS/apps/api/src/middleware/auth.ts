import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma.js";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function auth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      restaurantId: string | null;
      role: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, restaurantId: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ message: "User not found or inactive" });
      return;
    }

    // Platform admin doesn't need restaurant context
    if (user.role === "PLATFORM_ADMIN") {
      req.user = {
        userId: user.id,
        restaurantId: null,
        role: user.role,
      };
      return next();
    }

    // For non-platform admins, verify restaurant context
    if (user.restaurantId !== decoded.restaurantId) {
      res.status(401).json({ message: "Restaurant mismatch" });
      return;
    }

    req.user = {
      userId: user.id,
      restaurantId: user.restaurantId,
      role: user.role as "OWNER" | "MANAGER" | "CASHIER" | "KITCHEN",
    };

    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}

export function requireRole(...allowedRoles: ("PLATFORM_ADMIN" | "OWNER" | "MANAGER" | "CASHIER" | "KITCHEN")[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ message: "User not found or inactive" });
      return;
    }

    if (!allowedRoles.includes(user.role as any)) {
      res.status(403).json({ message: "Forbidden: insufficient permissions" });
      return;
    }

    req.user.role = user.role as any;
    next();
  };
}

// Middleware for operations that require manager or owner role (void, refund, etc.)
export function requireManagerRole(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const allowedRoles = ["PLATFORM_ADMIN", "OWNER", "MANAGER"];
  if (!allowedRoles.includes(req.user.role as any)) {
    res.status(403).json({ message: "Forbidden: Only managers and owners can perform this action" });
    return;
  }

  next();
}

import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET!;

export function auth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      restaurantId: string;
      role: string;
    };

    req.user = {
      userId: decoded.userId,
      restaurantId: decoded.restaurantId,
      role: decoded.role as "OWNER" | "MANAGER" | "CASHIER" | "KITCHEN",
    };

    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}

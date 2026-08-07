import type { UserRole } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        restaurantId: string | null;
        role: UserRole;
      };
      subscription?: {
        id: string;
        status: string;
        planId: string;
        maxScreens: number;
        maxTables: number;
        maxStaff: number;
        maxLocations: number;
      };
    }
  }
}

export {};

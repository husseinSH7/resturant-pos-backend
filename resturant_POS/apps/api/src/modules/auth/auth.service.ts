import "dotenv/config";
import { PrismaClient, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import jwt from "jsonwebtoken";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const JWT_SECRET = process.env.JWT_SECRET!;

export async function loginWithPin(pin: string) {
  const user = await prisma.user.findFirst({
    where: {
      pin,
      isActive: true,
    },
    include: {
      restaurant: true,
    },
  });

  if (!user) {
    throw new Error("Invalid PIN");
  }

  const token = jwt.sign(
    {
      userId: user.id,
      restaurantId: user.restaurantId,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "1d" }
  );

  return {
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      role: user.role,
    },
    restaurantId: user.restaurantId,
  };
}
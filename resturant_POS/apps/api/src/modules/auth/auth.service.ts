import jwt from "jsonwebtoken";
import { prisma } from "../../prisma.js";

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

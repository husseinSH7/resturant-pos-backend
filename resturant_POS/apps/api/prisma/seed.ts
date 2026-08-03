import "dotenv/config";
import { PrismaClient, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const restaurant = await prisma.restaurant.upsert({
    where: { slug: "demo-restaurant" },
    update: {
      name: "Demo Restaurant",
      address: "Beirut, Lebanon",
      phone: "+96170000000",
      isActive: true,
    },
    create: {
      name: "Demo Restaurant",
      slug: "demo-restaurant",
      address: "Beirut, Lebanon",
      phone: "+96170000000",
      isActive: true,
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: "owner@demo.com" },
    update: {
      fullName: "Demo Owner",
      pin: "1111",
      role: UserRole.OWNER,
      restaurantId: restaurant.id,
      isActive: true,
    },
    create: {
      fullName: "Demo Owner",
      pin: "1111",
      email: "owner@demo.com",
      role: UserRole.OWNER,
      restaurantId: restaurant.id,
      isActive: true,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@demo.com" },
    update: {
      fullName: "Demo Manager",
      pin: "1234",
      role: UserRole.MANAGER,
      restaurantId: restaurant.id,
      isActive: true,
    },
    create: {
      fullName: "Demo Manager",
      pin: "1234",
      email: "manager@demo.com",
      role: UserRole.MANAGER,
      restaurantId: restaurant.id,
      isActive: true,
    },
  });

  const cashier = await prisma.user.upsert({
    where: { email: "cashier@demo.com" },
    update: {
      fullName: "Demo Cashier",
      pin: "2222",
      role: UserRole.CASHIER,
      restaurantId: restaurant.id,
      isActive: true,
    },
    create: {
      fullName: "Demo Cashier",
      pin: "2222",
      email: "cashier@demo.com",
      role: UserRole.CASHIER,
      restaurantId: restaurant.id,
      isActive: true,
    },
  });

  const kitchenUser = await prisma.user.upsert({
    where: { email: "kitchen@demo.com" },
    update: {
      fullName: "Demo Kitchen",
      pin: "3333",
      role: UserRole.KITCHEN,
      restaurantId: restaurant.id,
      isActive: true,
    },
    create: {
      fullName: "Demo Kitchen",
      pin: "3333",
      email: "kitchen@demo.com",
      role: UserRole.KITCHEN,
      restaurantId: restaurant.id,
      isActive: true,
    },
  });

  const burgers = await prisma.category.upsert({
    where: {
      restaurantId_name: {
        restaurantId: restaurant.id,
        name: "Burgers",
      },
    },
    update: {
      sortOrder: 1,
      isActive: true,
    },
    create: {
      restaurantId: restaurant.id,
      name: "Burgers",
      sortOrder: 1,
      isActive: true,
    },
  });

  const drinks = await prisma.category.upsert({
    where: {
      restaurantId_name: {
        restaurantId: restaurant.id,
        name: "Drinks",
      },
    },
    update: {
      sortOrder: 2,
      isActive: true,
    },
    create: {
      restaurantId: restaurant.id,
      name: "Drinks",
      sortOrder: 2,
      isActive: true,
    },
  });

  const sides = await prisma.category.upsert({
    where: {
      restaurantId_name: {
        restaurantId: restaurant.id,
        name: "Sides",
      },
    },
    update: {
      sortOrder: 3,
      isActive: true,
    },
    create: {
      restaurantId: restaurant.id,
      name: "Sides",
      sortOrder: 3,
      isActive: true,
    },
  });

  await prisma.product.upsert({
    where: {
      restaurantId_name: {
        restaurantId: restaurant.id,
        name: "Classic Burger",
      },
    },
    update: {
      categoryId: burgers.id,
      description: "Beef patty, lettuce, tomato, onion",
      price: "8.50",
      sku: "BURG-001",
      isActive: true,
    },
    create: {
      restaurantId: restaurant.id,
      categoryId: burgers.id,
      name: "Classic Burger",
      description: "Beef patty, lettuce, tomato, onion",
      price: "8.50",
      sku: "BURG-001",
      isActive: true,
    },
  });

  await prisma.product.upsert({
    where: {
      restaurantId_name: {
        restaurantId: restaurant.id,
        name: "Cheese Burger",
      },
    },
    update: {
      categoryId: burgers.id,
      description: "Beef patty, cheese, pickles",
      price: "9.50",
      sku: "BURG-002",
      isActive: true,
    },
    create: {
      restaurantId: restaurant.id,
      categoryId: burgers.id,
      name: "Cheese Burger",
      description: "Beef patty, cheese, pickles",
      price: "9.50",
      sku: "BURG-002",
      isActive: true,
    },
  });

  await prisma.product.upsert({
    where: {
      restaurantId_name: {
        restaurantId: restaurant.id,
        name: "Fries",
      },
    },
    update: {
      categoryId: sides.id,
      description: "Crispy golden fries",
      price: "3.00",
      sku: "SIDE-001",
      isActive: true,
    },
    create: {
      restaurantId: restaurant.id,
      categoryId: sides.id,
      name: "Fries",
      description: "Crispy golden fries",
      price: "3.00",
      sku: "SIDE-001",
      isActive: true,
    },
  });

  await prisma.product.upsert({
    where: {
      restaurantId_name: {
        restaurantId: restaurant.id,
        name: "Cola",
      },
    },
    update: {
      categoryId: drinks.id,
      description: "Soft drink",
      price: "2.00",
      sku: "DRNK-001",
      isActive: true,
    },
    create: {
      restaurantId: restaurant.id,
      categoryId: drinks.id,
      name: "Cola",
      description: "Soft drink",
      price: "2.00",
      sku: "DRNK-001",
      isActive: true,
    },
  });

  await prisma.product.upsert({
    where: {
      restaurantId_name: {
        restaurantId: restaurant.id,
        name: "Water",
      },
    },
    update: {
      categoryId: drinks.id,
      description: "Mineral water",
      price: "1.00",
      sku: "DRNK-002",
      isActive: true,
    },
    create: {
      restaurantId: restaurant.id,
      categoryId: drinks.id,
      name: "Water",
      description: "Mineral water",
      price: "1.00",
      sku: "DRNK-002",
      isActive: true,
    },
  });

  await prisma.shift.create({
    data: {
      restaurantId: restaurant.id,
      userId: cashier.id,
      openingCash: "100.00",
      notes: "Demo open shift",
    },
  });

  await prisma.table.upsert({
    where: {
      restaurantId_name: {
        restaurantId: restaurant.id,
        name: "1",
      },
    },
    update: {},
    create: {
      restaurantId: restaurant.id,
      name: "1",
      seats: 4,
      area: "Main Hall",
      shape: "circle",
      status: "AVAILABLE",
    },
  });

  console.log("Seed completed successfully");
  console.log({
    restaurant: {
      id: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
    },
    users: [
      { email: owner.email, pin: owner.pin, role: owner.role },
      { email: manager.email, pin: manager.pin, role: manager.role },
      { email: cashier.email, pin: cashier.pin, role: cashier.role },
      { email: kitchenUser.email, pin: kitchenUser.pin, role: kitchenUser.role },
    ],
  });
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
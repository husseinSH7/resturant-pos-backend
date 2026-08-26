import "dotenv/config";
import { PrismaClient, UserRole, TableStatus, OrderStatus, OrderType, PaymentMethod, KitchenStatus, SubscriptionStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";
import crypto from "crypto";

const SALT_ROUNDS = 10;

async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, SALT_ROUNDS);
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create default plans
  const starterPlan = await prisma.plan.upsert({
    where: { name: "Starter" },
    update: {},
    create: {
      name: "Starter",
      basePrice: 29.99,
      maxTables: 5,
      maxScreens: 2,
      maxStaff: 5,
      maxLocations: 1,
      features: {
        basicPOS: true,
        inventory: false,
        reservations: false,
        analytics: true,
        loyalty: false,
      },
      isActive: true,
    },
  });

  const growthPlan = await prisma.plan.upsert({
    where: { name: "Growth" },
    update: {},
    create: {
      name: "Growth",
      basePrice: 79.99,
      maxTables: 20,
      maxScreens: 5,
      maxStaff: 15,
      maxLocations: 2,
      features: {
        basicPOS: true,
        inventory: true,
        reservations: true,
        analytics: true,
        loyalty: true,
      },
      isActive: true,
    },
  });

  const enterprisePlan = await prisma.plan.upsert({
    where: { name: "Enterprise" },
    update: {},
    create: {
      name: "Enterprise",
      basePrice: 199.99,
      maxTables: 50,
      maxScreens: 15,
      maxStaff: 50,
      maxLocations: 5,
      features: {
        basicPOS: true,
        inventory: true,
        reservations: true,
        analytics: true,
        loyalty: true,
        multiLocation: true,
        customIntegrations: true,
      },
      isActive: true,
    },
  });

  // Create platform admin
  const adminPasswordHash = await bcrypt.hash("admin123", SALT_ROUNDS);
  const platformAdmin = await prisma.user.upsert({
    where: { email: "admin@platform.com" },
    update: { 
      fullName: "Platform Admin", 
      passwordHash: adminPasswordHash, 
      role: UserRole.PLATFORM_ADMIN, 
      restaurantId: null, 
      isActive: true 
    },
    create: { 
      fullName: "Platform Admin", 
      passwordHash: adminPasswordHash, 
      email: "admin@platform.com", 
      role: UserRole.PLATFORM_ADMIN, 
      restaurantId: null, 
      isActive: true 
    },
  });

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

  // Create subscription for demo restaurant
  const subscription = await prisma.subscription.upsert({
    where: { restaurantId: restaurant.id },
    update: {
      planId: growthPlan.id,
      status: SubscriptionStatus.TRIAL,
      trialUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
    create: {
      restaurantId: restaurant.id,
      planId: growthPlan.id,
      status: SubscriptionStatus.TRIAL,
      trialUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  });

  const ownerPin = await hashPin("1111");
  const ownerPasswordHash = await bcrypt.hash("owner123", SALT_ROUNDS);
  const owner = await prisma.user.upsert({
    where: { email: "owner@demo.com" },
    update: { fullName: "Demo Owner", pin: ownerPin, passwordHash: ownerPasswordHash, role: UserRole.OWNER, restaurantId: restaurant.id, isActive: true },
    create: { fullName: "Demo Owner", pin: ownerPin, passwordHash: ownerPasswordHash, email: "owner@demo.com", role: UserRole.OWNER, restaurantId: restaurant.id, isActive: true },
  });

  const managerPin = await hashPin("1234");
  const managerPasswordHash = await bcrypt.hash("manager123", SALT_ROUNDS);
  const manager = await prisma.user.upsert({
    where: { email: "manager@demo.com" },
    update: { fullName: "Demo Manager", pin: managerPin, passwordHash: managerPasswordHash, role: UserRole.MANAGER, restaurantId: restaurant.id, isActive: true },
    create: { fullName: "Demo Manager", pin: managerPin, passwordHash: managerPasswordHash, email: "manager@demo.com", role: UserRole.MANAGER, restaurantId: restaurant.id, isActive: true },
  });

  const cashierPin = await hashPin("2222");
  const cashierPasswordHash = await bcrypt.hash("cashier123", SALT_ROUNDS);
  const cashier = await prisma.user.upsert({
    where: { email: "cashier@demo.com" },
    update: { fullName: "Demo Cashier", pin: cashierPin, passwordHash: cashierPasswordHash, role: UserRole.CASHIER, restaurantId: restaurant.id, isActive: true },
    create: { fullName: "Demo Cashier", pin: cashierPin, passwordHash: cashierPasswordHash, email: "cashier@demo.com", role: UserRole.CASHIER, restaurantId: restaurant.id, isActive: true },
  });

  const kitchenPin = await hashPin("3333");
  const kitchenPasswordHash = await bcrypt.hash("kitchen123", SALT_ROUNDS);
  const kitchenUser = await prisma.user.upsert({
    where: { email: "kitchen@demo.com" },
    update: { fullName: "Demo Kitchen", pin: kitchenPin, passwordHash: kitchenPasswordHash, role: UserRole.KITCHEN, restaurantId: restaurant.id, isActive: true },
    create: { fullName: "Demo Kitchen", pin: kitchenPin, passwordHash: kitchenPasswordHash, email: "kitchen@demo.com", role: UserRole.KITCHEN, restaurantId: restaurant.id, isActive: true },
  });

  const burgers = await prisma.category.upsert({
    where: { restaurantId_name: { restaurantId: restaurant.id, name: "Burgers" } },
    update: { sortOrder: 1, isActive: true },
    create: { restaurantId: restaurant.id, name: "Burgers", sortOrder: 1, isActive: true },
  });

  const drinks = await prisma.category.upsert({
    where: { restaurantId_name: { restaurantId: restaurant.id, name: "Drinks" } },
    update: { sortOrder: 2, isActive: true },
    create: { restaurantId: restaurant.id, name: "Drinks", sortOrder: 2, isActive: true },
  });

  const sides = await prisma.category.upsert({
    where: { restaurantId_name: { restaurantId: restaurant.id, name: "Sides" } },
    update: { sortOrder: 3, isActive: true },
    create: { restaurantId: restaurant.id, name: "Sides", sortOrder: 3, isActive: true },
  });

  const classicBurger = await prisma.product.upsert({
    where: { restaurantId_name: { restaurantId: restaurant.id, name: "Classic Burger" } },
    update: { categoryId: burgers.id, description: "Beef patty, lettuce, tomato, onion", price: "8.50", sku: "BURG-001", isActive: true },
    create: { restaurantId: restaurant.id, categoryId: burgers.id, name: "Classic Burger", description: "Beef patty, lettuce, tomato, onion", price: "8.50", sku: "BURG-001", isActive: true },
  });

  const cheeseBurger = await prisma.product.upsert({
    where: { restaurantId_name: { restaurantId: restaurant.id, name: "Cheese Burger" } },
    update: { categoryId: burgers.id, description: "Beef patty, cheese, pickles", price: "9.50", sku: "BURG-002", isActive: true },
    create: { restaurantId: restaurant.id, categoryId: burgers.id, name: "Cheese Burger", description: "Beef patty, cheese, pickles", price: "9.50", sku: "BURG-002", isActive: true },
  });

  const fries = await prisma.product.upsert({
    where: { restaurantId_name: { restaurantId: restaurant.id, name: "Fries" } },
    update: { categoryId: sides.id, description: "Crispy golden fries", price: "3.00", sku: "SIDE-001", isActive: true },
    create: { restaurantId: restaurant.id, categoryId: sides.id, name: "Fries", description: "Crispy golden fries", price: "3.00", sku: "SIDE-001", isActive: true },
  });

  const cola = await prisma.product.upsert({
    where: { restaurantId_name: { restaurantId: restaurant.id, name: "Cola" } },
    update: { categoryId: drinks.id, description: "Soft drink", price: "2.00", sku: "DRNK-001", isActive: true },
    create: { restaurantId: restaurant.id, categoryId: drinks.id, name: "Cola", description: "Soft drink", price: "2.00", sku: "DRNK-001", isActive: true },
  });

  await prisma.product.upsert({
    where: { restaurantId_name: { restaurantId: restaurant.id, name: "Water" } },
    update: { categoryId: drinks.id, description: "Mineral water", price: "1.00", sku: "DRNK-002", isActive: true },
    create: { restaurantId: restaurant.id, categoryId: drinks.id, name: "Water", description: "Mineral water", price: "1.00", sku: "DRNK-002", isActive: true },
  });

  // Delete modifier options and groups in correct order to avoid foreign key constraints
  await prisma.orderItemModifier.deleteMany({ 
    where: { 
      orderItem: { 
        order: { restaurantId: restaurant.id } 
      } 
    } 
  });
  
  await prisma.modifierOption.deleteMany({ 
    where: { 
      modifierGroup: { restaurantId: restaurant.id } 
    } 
  });
  
  await prisma.modifierGroup.deleteMany({ where: { restaurantId: restaurant.id } });

  const extrasGroup = await prisma.modifierGroup.create({
    data: {
      restaurantId: restaurant.id,
      name: "Extras",
      isRequired: false,
      minSelect: 0,
      maxSelect: 3,
      sortOrder: 1,
      options: {
        create: [
          { name: "Extra Cheese", priceDelta: "1.00" },
          { name: "Extra Patty", priceDelta: "2.50" },
          { name: "Bacon", priceDelta: "1.50" },
        ],
      },
    },
    include: { options: true },
  });

  const sizeGroup = await prisma.modifierGroup.create({
    data: {
      restaurantId: restaurant.id,
      name: "Size",
      isRequired: true,
      minSelect: 1,
      maxSelect: 1,
      sortOrder: 1,
      options: {
        create: [
          { name: "Regular", priceDelta: "0.00" },
          { name: "Large", priceDelta: "0.75" },
        ],
      },
    },
    include: { options: true },
  });

  await prisma.productModifierGroup.createMany({
    data: [
      { id: crypto.randomUUID(), productId: classicBurger.id, modifierGroupId: extrasGroup.id, sortOrder: 1 },
      { id: crypto.randomUUID(), productId: cheeseBurger.id, modifierGroupId: extrasGroup.id, sortOrder: 1 },
      { id: crypto.randomUUID(), productId: cola.id, modifierGroupId: sizeGroup.id, sortOrder: 1 },
    ],
  });

  const extraCheeseOption = extrasGroup.options.find((o) => o.name === "Extra Cheese")!;
  const largeColaOption = sizeGroup.options.find((o) => o.name === "Large")!;

  const tableArea = await prisma.tableArea.upsert({
    where: { restaurantId_name: { restaurantId: restaurant.id, name: "Main Hall" } },
    update: {},
    create: { id: crypto.randomUUID(), restaurantId: restaurant.id, name: "Main Hall", updatedAt: new Date() },
  });

  const table1 = await prisma.table.upsert({
    where: { restaurantId_name: { restaurantId: restaurant.id, name: "1" } },
    update: {},
    create: { restaurantId: restaurant.id, name: "1", seats: 4, areaId: tableArea.id, shape: "ROUND", status: TableStatus.AVAILABLE },
  });

  const table2 = await prisma.table.upsert({
    where: { restaurantId_name: { restaurantId: restaurant.id, name: "2" } },
    update: {},
    create: { restaurantId: restaurant.id, name: "2", seats: 2, areaId: tableArea.id, shape: "SQUARE", status: TableStatus.AVAILABLE },
  });

  // Create virtual printer for testing
  const virtualPrinter = await prisma.device.upsert({
    where: { deviceId: "VIRTUAL-PRINTER-001" },
    update: {
      name: "Virtual Test Printer",
      ipAddress: "127.0.0.1",
      isActive: true,
      lastSeenAt: new Date(),
    },
    create: {
      id: crypto.randomUUID(),
      restaurantId: restaurant.id,
      deviceId: "VIRTUAL-PRINTER-001",
      deviceType: "PRINTER",
      name: "Virtual Test Printer",
      ipAddress: "127.0.0.1",
      isActive: true,
      lastSeenAt: new Date(),
    },
  });

  const customer = await prisma.customer.upsert({
    where: { id: "demo-customer-john-doe" },
    update: {},
    create: {
      id: "demo-customer-john-doe",
      restaurantId: restaurant.id,
      fullName: "John Doe",
      phone: "+96171234567",
      email: "john.doe@example.com",
      points: 25,
      notes: "Regular customer, prefers window seating",
    },
  });

  const existingShift = await prisma.shift.findFirst({ where: { restaurantId: restaurant.id, userId: cashier.id, status: "OPEN" } });
  if (!existingShift) {
    await prisma.shift.create({
      data: { restaurantId: restaurant.id, userId: cashier.id, openingCash: "100.00", notes: "Demo open shift" },
    });
  }

  const order1Exists = await prisma.order.findUnique({ where: { restaurantId_orderNumber: { restaurantId: restaurant.id, orderNumber: 1001 } } });
  if (!order1Exists) {
    const order1 = await prisma.order.create({
      data: {
        restaurantId: restaurant.id,
        userId: cashier.id,
        customerId: customer.id,
        tableId: table1.id,
        orderNumber: 1001,
        orderType: OrderType.DINE_IN,
        status: OrderStatus.PAID,
        paymentMethod: PaymentMethod.CARD,
        subtotal: "35.25",
        taxAmount: "3.88",
        totalAmount: "39.13",
        notes: "Dine-in order, table 1",
        items: {
          create: [
            {
              productId: classicBurger.id,
              quantity: 2,
              unitPrice: "8.50",
              totalPrice: "18.00",
              modifiers: {
                create: [
                  { modifierOptionId: extraCheeseOption.id, nameSnapshot: "Extra Cheese", priceDelta: "1.00" },
                ],
              },
            },
            {
              productId: cheeseBurger.id,
              quantity: 1,
              unitPrice: "9.50",
              totalPrice: "9.50",
            },
            {
              productId: fries.id,
              quantity: 1,
              unitPrice: "3.00",
              totalPrice: "3.00",
            },
            {
              productId: cola.id,
              quantity: 2,
              unitPrice: "2.00",
              totalPrice: "4.75",
              modifiers: {
                create: [
                  { modifierOptionId: largeColaOption.id, nameSnapshot: "Large", priceDelta: "0.75" },
                ],
              },
            },
          ],
        },
      },
      include: { items: true },
    });

    await prisma.kitchenTicket.create({
      data: { id: order1.id, restaurantId: restaurant.id, orderId: order1.id, status: KitchenStatus.READY, updatedAt: new Date() },
    });
  }

  const order2Exists = await prisma.order.findUnique({ where: { restaurantId_orderNumber: { restaurantId: restaurant.id, orderNumber: 1002 } } });
  if (!order2Exists) {
    const order2 = await prisma.order.create({
      data: {
        restaurantId: restaurant.id,
        userId: cashier.id,
        orderNumber: 1002,
        orderType: OrderType.TAKEOUT,
        status: OrderStatus.VOIDED,
        subtotal: "3.00",
        taxAmount: "0.33",
        totalAmount: "3.33",
        notes: "Customer cancelled before payment",
        items: {
          create: [
            { productId: fries.id, quantity: 1, unitPrice: "3.00", totalPrice: "3.00" },
          ],
        },
      },
    });

    await prisma.kitchenTicket.create({
      data: { id: order2.id, restaurantId: restaurant.id, orderId: order2.id, status: KitchenStatus.PENDING, updatedAt: new Date() },
    });
  }

  console.log("Seed completed successfully");
  console.log({
    restaurant: { id: restaurant.id, name: restaurant.name, slug: restaurant.slug },
    users: [
      { email: owner.email, role: owner.role, note: "PIN: 1111" },
      { email: manager.email, role: manager.role, note: "PIN: 1234" },
      { email: cashier.email, role: cashier.role, note: "PIN: 2222" },
      { email: kitchenUser.email, role: kitchenUser.role, note: "PIN: 3333" },
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

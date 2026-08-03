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
  // ─── Restaurant ────────────────────────────────────────────────
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

  // ─── Users ─────────────────────────────────────────────────────
  const owner = await prisma.user.upsert({
    where: { email: "owner@demo.com" },
    update: { fullName: "Demo Owner", pin: "1111", role: UserRole.OWNER, restaurantId: restaurant.id, isActive: true },
    create: { fullName: "Demo Owner", pin: "1111", email: "owner@demo.com", role: UserRole.OWNER, restaurantId: restaurant.id, isActive: true },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@demo.com" },
    update: { fullName: "Demo Manager", pin: "1234", role: UserRole.MANAGER, restaurantId: restaurant.id, isActive: true },
    create: { fullName: "Demo Manager", pin: "1234", email: "manager@demo.com", role: UserRole.MANAGER, restaurantId: restaurant.id, isActive: true },
  });

  const cashier = await prisma.user.upsert({
    where: { email: "cashier@demo.com" },
    update: { fullName: "Demo Cashier", pin: "2222", role: UserRole.CASHIER, restaurantId: restaurant.id, isActive: true },
    create: { fullName: "Demo Cashier", pin: "2222", email: "cashier@demo.com", role: UserRole.CASHIER, restaurantId: restaurant.id, isActive: true },
  });

  const kitchenUser = await prisma.user.upsert({
    where: { email: "kitchen@demo.com" },
    update: { fullName: "Demo Kitchen", pin: "3333", role: UserRole.KITCHEN, restaurantId: restaurant.id, isActive: true },
    create: { fullName: "Demo Kitchen", pin: "3333", email: "kitchen@demo.com", role: UserRole.KITCHEN, restaurantId: restaurant.id, isActive: true },
  });

  // ─── Categories ────────────────────────────────────────────────
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

  // ─── Products ──────────────────────────────────────────────────
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

  // ─── Modifier Groups & Options (delete+recreate keeps this idempotent) ──
  await prisma.modifierGroup.deleteMany({ where: { productId: { in: [classicBurger.id, cheeseBurger.id] } } });

  const extrasClassic = await prisma.modifierGroup.create({
    data: {
      productId: classicBurger.id,
      name: "Extras",
      required: false,
      minChoices: 0,
      maxChoices: 3,
      sortOrder: 1,
      options: {
        create: [
          { name: "Extra Cheese", price: "1.00" },
          { name: "Extra Patty", price: "2.50" },
          { name: "Bacon", price: "1.50" },
        ],
      },
    },
    include: { options: true },
  });

  await prisma.modifierGroup.create({
    data: {
      productId: cheeseBurger.id,
      name: "Extras",
      required: false,
      minChoices: 0,
      maxChoices: 3,
      sortOrder: 1,
      options: {
        create: [
          { name: "Extra Cheese", price: "1.00" },
          { name: "Extra Patty", price: "2.50" },
          { name: "Bacon", price: "1.50" },
        ],
      },
    },
  });

  await prisma.modifierGroup.deleteMany({ where: { productId: cola.id } });

  const sizeCola = await prisma.modifierGroup.create({
    data: {
      productId: cola.id,
      name: "Size",
      required: true,
      minChoices: 1,
      maxChoices: 1,
      sortOrder: 1,
      options: {
        create: [
          { name: "Regular", price: "0.00" },
          { name: "Large", price: "0.75" },
        ],
      },
    },
    include: { options: true },
  });

  const extraCheeseOption = extrasClassic.options.find((o) => o.name === "Extra Cheese")!;
  const largeColaOption = sizeCola.options.find((o) => o.name === "Large")!;

  // ─── Ingredients ───────────────────────────────────────────────
  const ingredientData = [
    { name: "Beef Patty", sku: "ING-001", unit: "pcs", costPerUnit: "1.50" },
    { name: "Burger Bun", sku: "ING-002", unit: "pcs", costPerUnit: "0.40" },
    { name: "Cheddar Cheese", sku: "ING-003", unit: "kg", costPerUnit: "8.00" },
    { name: "Lettuce", sku: "ING-004", unit: "kg", costPerUnit: "2.00" },
    { name: "Tomato", sku: "ING-005", unit: "kg", costPerUnit: "1.80" },
    { name: "Onion", sku: "ING-006", unit: "kg", costPerUnit: "1.20" },
    { name: "Potato", sku: "ING-007", unit: "kg", costPerUnit: "1.00" },
    { name: "Salt", sku: "ING-008", unit: "kg", costPerUnit: "0.50" },
  ];

  const ingredients: Record<string, Awaited<ReturnType<typeof prisma.ingredient.upsert>>> = {};

  for (const data of ingredientData) {
    ingredients[data.name] = await prisma.ingredient.upsert({
      where: { restaurantId_name: { restaurantId: restaurant.id, name: data.name } },
      update: { unit: data.unit, costPerUnit: data.costPerUnit, sku: data.sku, isActive: true },
      create: { restaurantId: restaurant.id, ...data, isActive: true },
    });

    await prisma.inventory.upsert({
      where: { restaurantId_ingredientId: { restaurantId: restaurant.id, ingredientId: ingredients[data.name].id } },
      update: { quantity: "50.00", minStockLevel: "10.00", lastRestockedAt: new Date() },
      create: {
        restaurantId: restaurant.id,
        ingredientId: ingredients[data.name].id,
        quantity: "50.00",
        minStockLevel: "10.00",
        lastRestockedAt: new Date(),
      },
    });
  }

  // ─── Recipes ───────────────────────────────────────────────────
  const classicBurgerRecipe = await prisma.recipe.upsert({
    where: { restaurantId_productId: { restaurantId: restaurant.id, productId: classicBurger.id } },
    update: { name: "Classic Burger Recipe", yieldQuantity: "1", yieldUnit: "serving", preparationTime: 8, isActive: true },
    create: { restaurantId: restaurant.id, productId: classicBurger.id, name: "Classic Burger Recipe", yieldQuantity: "1", yieldUnit: "serving", preparationTime: 8, isActive: true },
  });

  await prisma.recipeItem.deleteMany({ where: { recipeId: classicBurgerRecipe.id } });
  await prisma.recipeItem.createMany({
    data: [
      { recipeId: classicBurgerRecipe.id, ingredientId: ingredients["Beef Patty"].id, quantity: "1" },
      { recipeId: classicBurgerRecipe.id, ingredientId: ingredients["Burger Bun"].id, quantity: "1" },
      { recipeId: classicBurgerRecipe.id, ingredientId: ingredients["Lettuce"].id, quantity: "0.05" },
      { recipeId: classicBurgerRecipe.id, ingredientId: ingredients["Tomato"].id, quantity: "0.05" },
      { recipeId: classicBurgerRecipe.id, ingredientId: ingredients["Onion"].id, quantity: "0.03" },
    ],
  });

  const cheeseBurgerRecipe = await prisma.recipe.upsert({
    where: { restaurantId_productId: { restaurantId: restaurant.id, productId: cheeseBurger.id } },
    update: { name: "Cheese Burger Recipe", yieldQuantity: "1", yieldUnit: "serving", preparationTime: 9, isActive: true },
    create: { restaurantId: restaurant.id, productId: cheeseBurger.id, name: "Cheese Burger Recipe", yieldQuantity: "1", yieldUnit: "serving", preparationTime: 9, isActive: true },
  });

  await prisma.recipeItem.deleteMany({ where: { recipeId: cheeseBurgerRecipe.id } });
  await prisma.recipeItem.createMany({
    data: [
      { recipeId: cheeseBurgerRecipe.id, ingredientId: ingredients["Beef Patty"].id, quantity: "1" },
      { recipeId: cheeseBurgerRecipe.id, ingredientId: ingredients["Burger Bun"].id, quantity: "1" },
      { recipeId: cheeseBurgerRecipe.id, ingredientId: ingredients["Cheddar Cheese"].id, quantity: "0.03" },
    ],
  });

  const friesRecipe = await prisma.recipe.upsert({
    where: { restaurantId_productId: { restaurantId: restaurant.id, productId: fries.id } },
    update: { name: "Fries Recipe", yieldQuantity: "1", yieldUnit: "serving", preparationTime: 5, isActive: true },
    create: { restaurantId: restaurant.id, productId: fries.id, name: "Fries Recipe", yieldQuantity: "1", yieldUnit: "serving", preparationTime: 5, isActive: true },
  });

  await prisma.recipeItem.deleteMany({ where: { recipeId: friesRecipe.id } });
  await prisma.recipeItem.createMany({
    data: [
      { recipeId: friesRecipe.id, ingredientId: ingredients["Potato"].id, quantity: "0.2" },
      { recipeId: friesRecipe.id, ingredientId: ingredients["Salt"].id, quantity: "0.01" },
    ],
  });

  // ─── Tables ────────────────────────────────────────────────────
  const table1 = await prisma.table.upsert({
    where: { restaurantId_name: { restaurantId: restaurant.id, name: "1" } },
    update: {},
    create: { restaurantId: restaurant.id, name: "1", seats: 4, area: "Main Hall", shape: "circle", status: "AVAILABLE" },
  });

  const table2 = await prisma.table.upsert({
    where: { restaurantId_name: { restaurantId: restaurant.id, name: "2" } },
    update: {},
    create: { restaurantId: restaurant.id, name: "2", seats: 2, area: "Main Hall", shape: "square", status: "AVAILABLE" },
  });

  // ─── Customer ──────────────────────────────────────────────────
  const customer = await prisma.customer.upsert({
    where: { id: "demo-customer-john-doe" },
    update: {},
    create: {
      id: "demo-customer-john-doe",
      restaurantId: restaurant.id,
      name: "John Doe",
      phone: "+96171234567",
      email: "john.doe@example.com",
      loyaltyPoints: 25,
      notes: "Regular customer, prefers window seating",
    },
  });

  // ─── Shift ─────────────────────────────────────────────────────
  const existingShift = await prisma.shift.findFirst({ where: { restaurantId: restaurant.id, userId: cashier.id, status: "OPEN" } });
  if (!existingShift) {
    await prisma.shift.create({
      data: { restaurantId: restaurant.id, userId: cashier.id, openingCash: "100.00", notes: "Demo open shift" },
    });
  }

  // ─── Orders (only created once — skipped on re-seed if they already exist) ──
  const order1Exists = await prisma.order.findUnique({ where: { restaurantId_orderNumber: { restaurantId: restaurant.id, orderNumber: 1001 } } });
  if (!order1Exists) {
    await prisma.order.create({
      data: {
        restaurantId: restaurant.id,
        userId: cashier.id,
        customerId: customer.id,
        tableId: table1.id,
        orderNumber: 1001,
        orderType: "DINE_IN",
        status: "PAID",
        kitchenStatus: "COMPLETED",
        paymentMethod: "CARD",
        subtotal: "35.25",
        taxAmount: "3.88",
        totalAmount: "39.13",
        tipAmount: "4.00",
        notes: "Dine-in order, table 1",
        items: {
          create: [
            {
              productId: classicBurger.id,
              quantity: 2,
              unitPrice: "8.50",
              totalPrice: "18.00",
              course: "Main",
              sequence: 1,
              preparedAt: new Date(),
              servedAt: new Date(),
              modifiers: {
                create: [
                  { modifierOptionId: extraCheeseOption.id, nameSnapshot: "Extra Cheese", priceSnapshot: "1.00", quantity: 1, totalPrice: "1.00" },
                ],
              },
            },
            {
              productId: cheeseBurger.id,
              quantity: 1,
              unitPrice: "9.50",
              totalPrice: "9.50",
              course: "Main",
              sequence: 1,
              preparedAt: new Date(),
              servedAt: new Date(),
            },
            {
              productId: fries.id,
              quantity: 1,
              unitPrice: "3.00",
              totalPrice: "3.00",
              course: "Main",
              sequence: 1,
              preparedAt: new Date(),
              servedAt: new Date(),
            },
            {
              productId: cola.id,
              quantity: 2,
              unitPrice: "2.00",
              totalPrice: "4.75",
              course: "Beverage",
              sequence: 1,
              preparedAt: new Date(),
              servedAt: new Date(),
              modifiers: {
                create: [
                  { modifierOptionId: largeColaOption.id, nameSnapshot: "Large", priceSnapshot: "0.75", quantity: 1, totalPrice: "0.75" },
                ],
              },
            },
          ],
        },
        changeLogs: {
          create: [
            { userId: cashier.id, action: "ORDER_CREATED", payload: { status: "OPEN" } },
            { userId: cashier.id, action: "ORDER_PAID", payload: { status: "PAID", paymentMethod: "CARD" } },
          ],
        },
        tipDistributions: {
          create: [
            { userId: cashier.id, amount: "2.40", percentage: "60.00" },
            { userId: kitchenUser.id, amount: "1.60", percentage: "40.00" },
          ],
        },
      },
    });
  }

  const order2Exists = await prisma.order.findUnique({ where: { restaurantId_orderNumber: { restaurantId: restaurant.id, orderNumber: 1002 } } });
  if (!order2Exists) {
    await prisma.order.create({
      data: {
        restaurantId: restaurant.id,
        userId: cashier.id,
        orderNumber: 1002,
        orderType: "TAKEOUT",
        status: "VOIDED",
        kitchenStatus: "PENDING",
        subtotal: "3.00",
        taxAmount: "0.33",
        totalAmount: "3.33",
        notes: "Customer cancelled before payment",
        items: {
          create: [
            { productId: fries.id, quantity: 1, unitPrice: "3.00", totalPrice: "3.00", course: "Main", sequence: 1 },
          ],
        },
        changeLogs: {
          create: [
            { userId: cashier.id, action: "ORDER_CREATED", payload: { status: "OPEN" } },
            { userId: manager.id, action: "ORDER_VOIDED", payload: { reason: "Customer cancelled" } },
          ],
        },
      },
    });
  }

  const order3Exists = await prisma.order.findUnique({ where: { restaurantId_orderNumber: { restaurantId: restaurant.id, orderNumber: 1003 } } });
  if (!order3Exists) {
    await prisma.order.create({
      data: {
        restaurantId: restaurant.id,
        userId: cashier.id,
        tableId: table2.id,
        orderNumber: 1003,
        orderType: "DINE_IN",
        status: "REFUNDED",
        kitchenStatus: "COMPLETED",
        paymentMethod: "CASH",
        amountTendered: "20.00",
        changeDue: "9.45",
        subtotal: "9.50",
        taxAmount: "1.05",
        totalAmount: "10.55",
        notes: "Refunded due to customer complaint",
        items: {
          create: [
            { productId: cheeseBurger.id, quantity: 1, unitPrice: "9.50", totalPrice: "9.50", course: "Main", sequence: 1, preparedAt: new Date(), servedAt: new Date() },
          ],
        },
        refunds: {
          create: [{ amount: "10.55", reason: "Customer complaint", paymentMethod: "CASH" }],
        },
        changeLogs: {
          create: [
            { userId: cashier.id, action: "ORDER_CREATED", payload: { status: "OPEN" } },
            { userId: cashier.id, action: "ORDER_PAID", payload: { status: "PAID", paymentMethod: "CASH" } },
            { userId: manager.id, action: "ORDER_REFUNDED", payload: { reason: "Customer complaint", amount: "10.55" } },
          ],
        },
      },
    });
  }

  console.log("Seed completed successfully");
  console.log({
    restaurant: { id: restaurant.id, name: restaurant.name, slug: restaurant.slug },
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
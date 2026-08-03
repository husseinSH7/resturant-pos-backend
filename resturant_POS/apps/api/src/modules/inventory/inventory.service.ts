import { prisma } from "../../prisma.js";
import { Prisma } from "@prisma/client";

export async function getIngredients(restaurantId: string) {
  const ingredients = await prisma.ingredient.findMany({
    where: { restaurantId, isActive: true },
    include: {
      inventory: true,
    },
    orderBy: { name: "asc" },
  });

  return ingredients.map((ing) => ({
    id: ing.id,
    name: ing.name,
    sku: ing.sku,
    unit: ing.unit,
    costPerUnit: ing.costPerUnit.toNumber(),
    isActive: ing.isActive,
    currentStock: ing.inventory?.quantity?.toNumber() || 0,
    minStockLevel: ing.inventory?.minStockLevel?.toNumber() || 0,
    isLowStock: ing.inventory && ing.inventory.quantity.lte(ing.inventory.minStockLevel),
  }));
}

export async function createIngredient(
  restaurantId: string,
  data: {
    name: string;
    sku?: string;
    unit: string;
    costPerUnit: number;
    minStockLevel?: number;
    initialStock?: number;
  }
) {
  const ingredient = await prisma.$transaction(async (tx) => {
    const created = await tx.ingredient.create({
      data: {
        restaurantId,
        name: data.name,
        sku: data.sku,
        unit: data.unit,
        costPerUnit: new Prisma.Decimal(data.costPerUnit),
      },
    });

    if (data.initialStock !== undefined || data.minStockLevel !== undefined) {
      await tx.inventory.create({
        data: {
          restaurantId,
          ingredientId: created.id,
          quantity: new Prisma.Decimal(data.initialStock || 0),
          minStockLevel: new Prisma.Decimal(data.minStockLevel || 0),
          lastRestockedAt: data.initialStock && data.initialStock > 0 ? new Date() : null,
        },
      });
    }

    return created;
  });

  const withInventory = await prisma.ingredient.findFirst({
    where: { id: ingredient.id },
    include: { inventory: true },
  });

  return {
    id: withInventory!.id,
    name: withInventory!.name,
    sku: withInventory!.sku,
    unit: withInventory!.unit,
    costPerUnit: withInventory!.costPerUnit.toNumber(),
    isActive: withInventory!.isActive,
    currentStock: withInventory!.inventory?.quantity?.toNumber() || 0,
    minStockLevel: withInventory!.inventory?.minStockLevel?.toNumber() || 0,
  };
}

export async function updateIngredient(
  restaurantId: string,
  ingredientId: string,
  data: {
    name?: string;
    sku?: string;
    unit?: string;
    costPerUnit?: number;
    isActive?: boolean;
  }
) {
  const ingredient = await prisma.ingredient.findFirst({
    where: { id: ingredientId, restaurantId },
  });
  if (!ingredient) throw new Error("Ingredient not found");

  const updated = await prisma.ingredient.update({
    where: { id: ingredientId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.sku !== undefined && { sku: data.sku || null }),
      ...(data.unit && { unit: data.unit }),
      ...(data.costPerUnit !== undefined && { costPerUnit: new Prisma.Decimal(data.costPerUnit) }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });

  return {
    id: updated.id,
    name: updated.name,
    sku: updated.sku,
    unit: updated.unit,
    costPerUnit: updated.costPerUnit.toNumber(),
    isActive: updated.isActive,
  };
}

export async function adjustStock(
  restaurantId: string,
  ingredientId: string,
  data: {
    quantity: number;
    isRestock?: boolean;
  }
) {
  const inventory = await prisma.inventory.findFirst({
    where: { ingredientId, restaurantId },
    include: { ingredient: true },
  });

  if (!inventory) {
    throw new Error("Inventory record not found for this ingredient");
  }

  const newQuantity = inventory.quantity.plus(new Prisma.Decimal(data.quantity));

  if (newQuantity.lt(0)) {
    throw new Error("Insufficient stock");
  }

  const updated = await prisma.inventory.update({
    where: { id: inventory.id },
    data: {
      quantity: newQuantity,
      ...(data.isRestock && { lastRestockedAt: new Date() }),
    },
  });

  return {
    ingredientId: updated.ingredientId,
    currentStock: updated.quantity.toNumber(),
    minStockLevel: updated.minStockLevel.toNumber(),
    isLowStock: updated.quantity.lte(updated.minStockLevel),
  };
}

export async function getLowStockAlerts(restaurantId: string) {
  const lowStock = await prisma.inventory.findMany({
    where: {
      restaurantId,
      quantity: { lte: { field: "minStockLevel" } },
    },
    include: {
      ingredient: {
        where: { isActive: true },
      },
    },
    orderBy: {
      quantity: "asc",
    },
  });

  return lowStock
    .filter((inv) => inv.ingredient)
    .map((inv) => ({
      ingredientId: inv.ingredientId,
      ingredientName: inv.ingredient!.name,
      currentStock: inv.quantity.toNumber(),
      minStockLevel: inv.minStockLevel.toNumber(),
      unit: inv.ingredient!.unit,
      shortage: inv.minStockLevel.minus(inv.quantity).toNumber(),
    }));
}

export async function getRecipes(restaurantId: string) {
  const recipes = await prisma.recipe.findMany({
    where: { restaurantId, isActive: true },
    include: {
      product: true,
      items: {
        include: {
          ingredient: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return recipes.map((recipe) => ({
    id: recipe.id,
    productId: recipe.productId,
    productName: recipe.product?.name || "Unknown",
    name: recipe.name,
    yieldQuantity: recipe.yieldQuantity.toNumber(),
    yieldUnit: recipe.yieldUnit,
    preparationTime: recipe.preparationTime,
    totalCost: recipe.items.reduce(
      (sum, item) => sum + item.ingredient.costPerUnit.toNumber() * item.quantity.toNumber(),
      0
    ),
    costPerYield: recipe.items.reduce(
      (sum, item) => sum + item.ingredient.costPerUnit.toNumber() * item.quantity.toNumber(),
      0
    ) / recipe.yieldQuantity.toNumber(),
    items: recipe.items.map((item) => ({
      ingredientId: item.ingredientId,
      ingredientName: item.ingredient.name,
      quantity: item.quantity.toNumber(),
      unit: item.ingredient.unit,
      cost: item.ingredient.costPerUnit.toNumber() * item.quantity.toNumber(),
    })),
  }));
}

export async function createRecipe(
  restaurantId: string,
  data: {
    productId: string;
    name: string;
    yieldQuantity: number;
    yieldUnit: string;
    preparationTime?: number;
    items: { ingredientId: string; quantity: number }[];
  }
) {
  const recipe = await prisma.$transaction(async (tx) => {
    const created = await tx.recipe.create({
      data: {
        restaurantId,
        productId: data.productId,
        name: data.name,
        yieldQuantity: new Prisma.Decimal(data.yieldQuantity),
        yieldUnit: data.yieldUnit,
        preparationTime: data.preparationTime || 0,
      },
    });

    for (const item of data.items) {
      await tx.recipeItem.create({
        data: {
          recipeId: created.id,
          ingredientId: item.ingredientId,
          quantity: new Prisma.Decimal(item.quantity),
        },
      });
    }

    return created;
  });

  const withItems = await prisma.recipe.findFirst({
    where: { id: recipe.id },
    include: {
      product: true,
      items: {
        include: {
          ingredient: true,
        },
      },
    },
  });

  return {
    id: withItems!.id,
    productId: withItems!.productId,
    productName: withItems!.product?.name || "Unknown",
    name: withItems!.name,
    yieldQuantity: withItems!.yieldQuantity.toNumber(),
    yieldUnit: withItems!.yieldUnit,
    preparationTime: withItems!.preparationTime,
    totalCost: withItems!.items.reduce(
      (sum, item) => sum + item.ingredient.costPerUnit.toNumber() * item.quantity.toNumber(),
      0
    ),
    costPerYield: withItems!.items.reduce(
      (sum, item) => sum + item.ingredient.costPerUnit.toNumber() * item.quantity.toNumber(),
      0
    ) / withItems!.yieldQuantity.toNumber(),
    items: withItems!.items.map((item) => ({
      ingredientId: item.ingredientId,
      ingredientName: item.ingredient.name,
      quantity: item.quantity.toNumber(),
      unit: item.ingredient.unit,
      cost: item.ingredient.costPerUnit.toNumber() * item.quantity.toNumber(),
    })),
  };
}

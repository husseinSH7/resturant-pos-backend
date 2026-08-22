import { prisma } from "../../prisma.js";
import { Prisma } from "@prisma/client";
import crypto from "crypto";

export async function getIngredients(restaurantId: string) {
  const ingredients = await prisma.ingredient.findMany({
    where: { restaurantId, isActive: true },
    orderBy: { name: "asc" },
  });

  return ingredients.map((ing) => ({
    id: ing.id,
    name: ing.name,
    unit: ing.unit,
    currentStock: Number(ing.currentStock),
    minStock: Number(ing.minStock),
    costPerUnit: Number(ing.costPerUnit),
    supplier: ing.supplier,
    lastRestocked: ing.lastRestocked,
    isLowStock: Number(ing.currentStock) <= Number(ing.minStock),
  }));
}

export async function createIngredient(
  restaurantId: string,
  data: {
    name: string;
    unit: string;
    currentStock: number;
    minStock: number;
    costPerUnit: number;
    supplier?: string;
  }
) {
  const ingredient = await prisma.ingredient.create({
    data: {
      id: crypto.randomUUID(),
      restaurantId,
      name: data.name,
      unit: data.unit,
      currentStock: new Prisma.Decimal(data.currentStock),
      minStock: new Prisma.Decimal(data.minStock),
      costPerUnit: new Prisma.Decimal(data.costPerUnit),
      supplier: data.supplier || null,
      lastRestocked: new Date(),
    },
  });

  return {
    id: ingredient.id,
    name: ingredient.name,
    unit: ingredient.unit,
    currentStock: Number(ingredient.currentStock),
    minStock: Number(ingredient.minStock),
    costPerUnit: Number(ingredient.costPerUnit),
    supplier: ingredient.supplier,
    lastRestocked: ingredient.lastRestocked,
    isLowStock: Number(ingredient.currentStock) <= Number(ingredient.minStock),
  };
}

export async function updateIngredient(
  restaurantId: string,
  ingredientId: string,
  data: {
    name?: string;
    unit?: string;
    currentStock?: number;
    minStock?: number;
    costPerUnit?: number;
    supplier?: string;
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
      ...(data.unit && { unit: data.unit }),
      ...(data.currentStock !== undefined && {
        currentStock: new Prisma.Decimal(data.currentStock),
      }),
      ...(data.minStock !== undefined && {
        minStock: new Prisma.Decimal(data.minStock),
      }),
      ...(data.costPerUnit !== undefined && {
        costPerUnit: new Prisma.Decimal(data.costPerUnit),
      }),
      ...(data.supplier !== undefined && { supplier: data.supplier }),
    },
  });

  return {
    id: updated.id,
    name: updated.name,
    unit: updated.unit,
    currentStock: Number(updated.currentStock),
    minStock: Number(updated.minStock),
    costPerUnit: Number(updated.costPerUnit),
    supplier: updated.supplier,
    lastRestocked: updated.lastRestocked,
    isLowStock: Number(updated.currentStock) <= Number(updated.minStock),
  };
}

export async function adjustStock(
  restaurantId: string,
  ingredientId: string,
  data: {
    adjustment: number;
    reason: string;
  }
) {
  const ingredient = await prisma.ingredient.findFirst({
    where: { id: ingredientId, restaurantId },
  });

  if (!ingredient) throw new Error("Ingredient not found");

  const newStock = Number(ingredient.currentStock) + data.adjustment;
  if (newStock < 0) throw new Error("Insufficient stock for adjustment");

  const updated = await prisma.$transaction(async (tx) => {
    const updatedIng = await tx.ingredient.update({
      where: { id: ingredientId },
      data: {
        currentStock: new Prisma.Decimal(newStock),
        lastRestocked: new Date(),
      },
    });

    await tx.stockAdjustment.create({
      data: {
        id: crypto.randomUUID(),
        restaurantId,
        ingredientId,
        adjustment: new Prisma.Decimal(data.adjustment),
        previousStock: ingredient.currentStock,
        newStock: updatedIng.currentStock,
        reason: data.reason,
      },
    });

    return updatedIng;
  });

  return {
    id: updated.id,
    name: updated.name,
    unit: updated.unit,
    currentStock: Number(updated.currentStock),
    minStock: Number(updated.minStock),
    costPerUnit: Number(updated.costPerUnit),
    supplier: updated.supplier,
    lastRestocked: updated.lastRestocked,
    isLowStock: Number(updated.currentStock) <= Number(updated.minStock),
  };
}

export async function deleteIngredient(restaurantId: string, ingredientId: string) {
  const ingredient = await prisma.ingredient.findFirst({
    where: { id: ingredientId, restaurantId },
  });
  if (!ingredient) throw new Error("Ingredient not found");
  await prisma.ingredient.update({
    where: { id: ingredientId },
    data: { isActive: false },
  });
  return { success: true };
}

export async function getLowStockAlerts(restaurantId: string) {
  const ingredients = await prisma.ingredient.findMany({
    where: { restaurantId, isActive: true },
    orderBy: { name: "asc" },
  });

  const lowStock = ingredients.filter(
    (ing) => Number(ing.currentStock) <= Number(ing.minStock)
  );

  return lowStock.map((ing) => ({
    id: ing.id,
    name: ing.name,
    currentStock: Number(ing.currentStock),
    minStock: Number(ing.minStock),
    unit: ing.unit,
    percentage: (Number(ing.currentStock) / Number(ing.minStock)) * 100,
  }));
}

export async function getRecipes(restaurantId: string) {
  const recipes = await prisma.recipe.findMany({
    where: { restaurantId, isActive: true },
    include: {
      items: {
        include: {
          Ingredient: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return recipes.map((recipe) => ({
    id: recipe.id,
    name: recipe.name,
    productId: recipe.productId,
    totalCost: Number(recipe.totalCost),
    items: recipe.items.map((item) => ({
      id: item.id,
      ingredientId: item.ingredientId,
      ingredientName: item.Ingredient.name,
      quantity: Number(item.quantity),
      unit: item.Ingredient.unit,
      cost: Number(item.cost),
    })),
  }));
}

export async function createRecipe(
  restaurantId: string,
  data: {
    name: string;
    productId: string;
    items: Array<{
      ingredientId: string;
      quantity: number;
    }>;
  }
) {
  const totalCost = await prisma.$transaction(async (tx) => {
    let cost = new Prisma.Decimal(0);
    for (const item of data.items) {
      const ingredient = await tx.ingredient.findFirst({
        where: { id: item.ingredientId, restaurantId },
      });
      if (!ingredient) throw new Error(`Ingredient ${item.ingredientId} not found`);
      const itemCost = new Prisma.Decimal(item.quantity).mul(ingredient.costPerUnit);
      cost = cost.add(itemCost);
    }
    return cost;
  });

  const recipe = await prisma.$transaction(async (tx) => {
    const created = await tx.recipe.create({
      data: {
        id: crypto.randomUUID(),
        restaurantId,
        name: data.name,
        productId: data.productId,
        totalCost,
      },
    });

    for (const item of data.items) {
      const ingredient = await tx.ingredient.findFirst({
        where: { id: item.ingredientId, restaurantId },
      });
      if (!ingredient) throw new Error(`Ingredient ${item.ingredientId} not found`);
      const itemCost = new Prisma.Decimal(item.quantity).mul(ingredient.costPerUnit);
      await tx.recipeItem.create({
        data: {
          id: crypto.randomUUID(),
          recipeId: created.id,
          ingredientId: item.ingredientId,
          quantity: new Prisma.Decimal(item.quantity),
          cost: itemCost,
        },
      });
    }

    return created;
  });

  const fullRecipe = await prisma.recipe.findFirst({
    where: { id: recipe.id },
    include: {
      items: {
        include: {
          Ingredient: true,
        },
      },
    },
  });

  return {
    id: fullRecipe!.id,
    name: fullRecipe!.name,
    productId: fullRecipe!.productId,
    totalCost: Number(fullRecipe!.totalCost),
    items: fullRecipe!.items.map((item) => ({
      id: item.id,
      ingredientId: item.ingredientId,
      ingredientName: item.Ingredient.name,
      quantity: Number(item.quantity),
      unit: item.Ingredient.unit,
      cost: Number(item.cost),
    })),
  };
}

// ----- IMPORTANT: Add the missing exports for orders -----
export async function deductInventoryForOrder(restaurantId: string, orderId: string) {
  // Get order items with products
  const order = await prisma.order.findFirst({
    where: { id: orderId, restaurantId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) throw new Error("Order not found");

  // Get recipes for all products in the order
  const productIds = order.items.map((item) => item.productId);
  const recipes = await prisma.recipe.findMany({
    where: {
      restaurantId,
      productId: { in: productIds },
      isActive: true,
    },
    include: {
      items: {
        include: {
          Ingredient: true,
        },
      },
    },
  });

  // Create a map of productId to recipe
  const recipeMap = new Map();
  recipes.forEach((recipe) => {
    recipeMap.set(recipe.productId, recipe);
  });

  // Deduct inventory for each order item
  await prisma.$transaction(async (tx) => {
    for (const orderItem of order.items) {
      const recipe = recipeMap.get(orderItem.productId);
      if (!recipe) continue; // No recipe defined for this product

      for (const recipeItem of recipe.items) {
        const quantityNeeded = Number(recipeItem.quantity) * orderItem.quantity;

        // Update ingredient stock
        const ingredient = await tx.ingredient.findFirst({
          where: { id: recipeItem.ingredientId, restaurantId },
        });

        if (!ingredient) {
          console.warn(`Ingredient ${recipeItem.ingredientId} not found, skipping deduction`);
          continue;
        }

        const newStock = Number(ingredient.currentStock) - quantityNeeded;

        if (newStock < 0) {
          console.warn(
            `Insufficient stock for ingredient ${ingredient.name}. Needed: ${quantityNeeded}, Available: ${Number(ingredient.currentStock)}`
          );
          // Continue with negative stock but log warning
        }

        await tx.ingredient.update({
          where: { id: recipeItem.ingredientId },
          data: {
            currentStock: new Prisma.Decimal(newStock),
          },
        });

        // Create stock adjustment record
        await tx.stockAdjustment.create({
          data: {
            id: crypto.randomUUID(),
            restaurantId,
            ingredientId: recipeItem.ingredientId,
            adjustment: new Prisma.Decimal(-quantityNeeded),
            previousStock: ingredient.currentStock,
            newStock: new Prisma.Decimal(newStock),
            reason: `Order #${order.orderNumber} - ${orderItem.quantity}x ${orderItem.product?.name || "Product"}`,
          },
        });
      }
    }
  });

  return { success: true, message: "Inventory deducted successfully" };
}

export async function refundInventoryForOrder(restaurantId: string, orderId: string) {
  // Get order items with products
  const order = await prisma.order.findFirst({
    where: { id: orderId, restaurantId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) throw new Error("Order not found");

  // Get recipes for all products in the order
  const productIds = order.items.map((item) => item.productId);
  const recipes = await prisma.recipe.findMany({
    where: {
      restaurantId,
      productId: { in: productIds },
      isActive: true,
    },
    include: {
      items: {
        include: {
          Ingredient: true,
        },
      },
    },
  });

  // Create a map of productId to recipe
  const recipeMap = new Map();
  recipes.forEach((recipe) => {
    recipeMap.set(recipe.productId, recipe);
  });

  // Restore inventory for each order item
  await prisma.$transaction(async (tx) => {
    for (const orderItem of order.items) {
      const recipe = recipeMap.get(orderItem.productId);
      if (!recipe) continue; // No recipe defined for this product

      for (const recipeItem of recipe.items) {
        const quantityToRestore = Number(recipeItem.quantity) * orderItem.quantity;

        // Update ingredient stock
        const ingredient = await tx.ingredient.findFirst({
          where: { id: recipeItem.ingredientId, restaurantId },
        });

        if (!ingredient) {
          console.warn(`Ingredient ${recipeItem.ingredientId} not found, skipping restoration`);
          continue;
        }

        const newStock = Number(ingredient.currentStock) + quantityToRestore;

        await tx.ingredient.update({
          where: { id: recipeItem.ingredientId },
          data: {
            currentStock: new Prisma.Decimal(newStock),
          },
        });

        // Create stock adjustment record
        await tx.stockAdjustment.create({
          data: {
            id: crypto.randomUUID(),
            restaurantId,
            ingredientId: recipeItem.ingredientId,
            adjustment: new Prisma.Decimal(quantityToRestore),
            previousStock: ingredient.currentStock,
            newStock: new Prisma.Decimal(newStock),
            reason: `Refund for Order #${order.orderNumber} - ${orderItem.quantity}x ${orderItem.product?.name || "Product"}`,
          },
        });
      }
    }
  });

  return { success: true, message: "Inventory restored successfully" };
}
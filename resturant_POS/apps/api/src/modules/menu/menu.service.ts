import { prisma } from "../../prisma.js";

export async function getCategories(restaurantId: string) {
  const categories = await prisma.category.findMany({
    where: { restaurantId, isActive: true },
    orderBy: { sortOrder: "asc" },
    include: { products: { where: { isActive: true } } },
  });

  return categories.map((c) => ({
    id: c.id,
    restaurantId: c.restaurantId,
    name: c.name,
    sortOrder: c.sortOrder,
    products: c.products.map((p) => ({
      id: p.id,
      restaurantId: p.restaurantId,
      name: p.name,
      description: p.description,
      price: p.price.toNumber(),
      sku: p.sku,
      categoryId: c.id,
    })),
  }));
}

export async function getProducts(restaurantId: string) {
  const products = await prisma.product.findMany({
    where: { restaurantId, isActive: true },
    orderBy: { name: "asc" },
    include: {
      category: true,
      modifierGroups: {
        where: { options: { some: { isActive: true } } },
        include: { options: { where: { isActive: true }, orderBy: { name: "asc" } } },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return products.map((p) => ({
    id: p.id,
    restaurantId: p.restaurantId,
    name: p.name,
    description: p.description,
    price: p.price.toNumber(),
    sku: p.sku,
    imageUrl: null,
    categoryId: p.categoryId,
    categoryName: p.category.name,
    available: true,
    modifierGroups: p.modifierGroups.map((g) => ({
      modifierGroup: {
        id: g.id,
        name: g.name,
        isRequired: g.required,
        selectionType: g.maxChoices === 1 ? "SINGLE" : "MULTIPLE",
        minChoices: g.minChoices,
        maxChoices: g.maxChoices,
        options: g.options.map((o) => ({
          id: o.id,
          name: o.name,
          priceDelta: o.price.toNumber(),
        })),
      },
    })),
  }));
}

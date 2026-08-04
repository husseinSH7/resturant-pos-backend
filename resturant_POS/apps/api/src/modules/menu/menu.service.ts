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
    include: { category: true },
  });

  const productModifierGroups = await prisma.productModifierGroup.findMany({
    where: { productId: { in: products.map((p) => p.id) } },
    include: {
      ModifierGroup: {
        include: {
          options: { where: { isActive: true }, orderBy: { name: "asc" } },
        },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  const modifierGroupsByProductId = new Map<string, any[]>();
  for (const join of productModifierGroups) {
    const g = join.ModifierGroup;
    if (!g) continue;
    const mapped = {
      modifierGroup: {
        id: g.id,
        name: g.name,
        isRequired: g.isRequired,
        selectionType: g.maxSelect === 1 ? "SINGLE" : "MULTIPLE",
        minChoices: g.minSelect,
        maxChoices: g.maxSelect,
        options: g.options.map((o) => ({
          id: o.id,
          name: o.name,
          priceDelta: o.priceDelta.toNumber(),
        })),
      },
    };
    const list = modifierGroupsByProductId.get(join.productId) ?? [];
    list.push(mapped);
    modifierGroupsByProductId.set(join.productId, list);
  }

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
    modifierGroups: modifierGroupsByProductId.get(p.id) ?? [],
  }));
}

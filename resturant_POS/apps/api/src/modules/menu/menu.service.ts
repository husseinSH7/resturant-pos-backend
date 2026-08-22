import { prisma } from "../../prisma.js";
import path from "path";
import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";

// ---------- GET FUNCTIONS ----------
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
      imageUrl: p.imageUrl,
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
    imageUrl: p.imageUrl,
    categoryId: p.categoryId,
    categoryName: p.category.name,
    available: true,
    modifierGroups: modifierGroupsByProductId.get(p.id) ?? [],
  }));
}

// ---------- CATEGORY CRUD ----------
export async function createCategory(restaurantId: string, data: { name: string; sortOrder?: number }) {
  return prisma.category.create({
    data: {
      restaurantId,
      name: data.name,
      sortOrder: data.sortOrder ?? 0,
      isActive: true,
    },
  });
}

export async function updateCategory(
  id: string,
  restaurantId: string,
  data: { name?: string; sortOrder?: number; isActive?: boolean }
) {
  const category = await prisma.category.findFirst({
    where: { id, restaurantId },
  });
  if (!category) throw new Error("Category not found");

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  return prisma.category.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteCategory(id: string, restaurantId: string) {
  const category = await prisma.category.findFirst({
    where: { id, restaurantId },
  });
  if (!category) throw new Error("Category not found");
  return prisma.category.update({
    where: { id },
    data: { isActive: false },
  });
}

// ---------- PRODUCT CRUD ----------
export async function createProduct(
  restaurantId: string,
  data: {
    categoryId: string;
    name: string;
    description?: string;
    price: number;
    sku?: string;
    imageUrl?: string;
    isActive?: boolean;
    modifierGroups?: { modifierGroupId: string; isRequired?: boolean }[];
  }
) {
  const category = await prisma.category.findFirst({
    where: { id: data.categoryId, restaurantId },
  });
  if (!category) throw new Error("Category not found for this restaurant");

  const product = await prisma.product.create({
    data: {
      restaurantId,
      categoryId: data.categoryId,
      name: data.name,
      price: data.price,
      description: data.description ?? null,
      sku: data.sku ?? null,
      imageUrl: data.imageUrl ?? null,
      isActive: data.isActive ?? true,
    },
  });

  // Handle modifier groups with generated IDs
  if (data.modifierGroups?.length) {
    await prisma.productModifierGroup.createMany({
      data: data.modifierGroups.map((mg) => ({
        id: uuidv4(), // Generate a UUID for each join record
        productId: product.id,
        modifierGroupId: mg.modifierGroupId,
        isRequired: mg.isRequired ?? false,
        sortOrder: 0,
      })),
    });
  }
  return product;
}

export async function updateProduct(
  id: string,
  restaurantId: string,
  data: {
    categoryId?: string;
    name?: string;
    description?: string;
    price?: number;
    sku?: string;
    imageUrl?: string;
    isActive?: boolean;
    modifierGroups?: { modifierGroupId: string; isRequired?: boolean }[];
  }
) {
  const product = await prisma.product.findFirst({
    where: { id, restaurantId },
  });
  if (!product) throw new Error("Product not found");

  if (data.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: data.categoryId, restaurantId },
    });
    if (!category) throw new Error("Category not found for this restaurant");
  }

  // Build update data only with defined fields
  const updateData: any = {};
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.price !== undefined) updateData.price = data.price;
  if (data.sku !== undefined) updateData.sku = data.sku;
  if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  const updated = await prisma.product.update({
    where: { id },
    data: updateData,
  });

  // Handle modifier groups: replace all
  if (data.modifierGroups !== undefined) {
    // Delete existing joins
    await prisma.productModifierGroup.deleteMany({
      where: { productId: id },
    });
    // Create new joins with generated IDs
    if (data.modifierGroups.length > 0) {
      await prisma.productModifierGroup.createMany({
        data: data.modifierGroups.map((mg, index) => ({
          id: uuidv4(), // Generate a UUID for each new join record
          productId: id,
          modifierGroupId: mg.modifierGroupId,
          isRequired: mg.isRequired ?? false,
          sortOrder: index,
        })),
      });
    }
  }
  return updated;
}

export async function deleteProduct(id: string, restaurantId: string) {
  const product = await prisma.product.findFirst({
    where: { id, restaurantId },
  });
  if (!product) throw new Error("Product not found");
  return prisma.product.update({
    where: { id },
    data: { isActive: false },
  });
}

// ---------- IMAGE UPLOAD ----------
export async function uploadProductImage(id: string, restaurantId: string, file: Express.Multer.File) {
  const product = await prisma.product.findFirst({
    where: { id, restaurantId },
  });
  if (!product) throw new Error("Product not found");

  const uploadDir = path.join(process.cwd(), "uploads", "products");
  await fs.mkdir(uploadDir, { recursive: true });

  const ext = path.extname(file.originalname);
  const filename = `${uuidv4()}${ext}`;
  const filepath = path.join(uploadDir, filename);

  await fs.writeFile(filepath, file.buffer);

  const baseUrl = process.env.BASE_URL || "http://localhost:3000";
  const imageUrl = `${baseUrl}/uploads/products/${filename}`;

  await prisma.product.update({
    where: { id },
    data: { imageUrl },
  });

  return imageUrl;
}
import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100),
  sortOrder: z.number().int().min(0).optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const createProductSchema = z.object({
  categoryId: z.string().min(1, "Category ID is required"),
  name: z.string().min(1, "Product name is required").max(200),
  description: z.string().max(500).optional(),
  price: z.number().positive("Price must be positive"),
  sku: z.string().max(50).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
  modifierGroups: z.array(z.object({
    modifierGroupId: z.string(),
    isRequired: z.boolean().optional(),
  })).optional(),
});

export const updateProductSchema = z.object({
  categoryId: z.string().optional(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  price: z.number().positive().optional(),
  sku: z.string().max(50).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
  modifierGroups: z.array(z.object({
    modifierGroupId: z.string(),
    isRequired: z.boolean().optional(),
  })).optional(),
});

export const createModifierGroupSchema = z.object({
  name: z.string().min(1, "Modifier group name is required").max(100),
  selectionType: z.enum(["SINGLE", "MULTIPLE"]).default("SINGLE"),
  isRequired: z.boolean().default(false),
  minSelect: z.number().int().min(0).default(0),
  maxSelect: z.number().int().positive().optional(),
  sortOrder: z.number().int().min(0).optional(),
  options: z.array(z.object({
    name: z.string().min(1, "Option name is required").max(100),
    priceDelta: z.number(),
    sortOrder: z.number().int().min(0).optional(),
  })).min(1, "At least one option is required"),
});

export const updateModifierGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  selectionType: z.enum(["SINGLE", "MULTIPLE"]).optional(),
  isRequired: z.boolean().optional(),
  minSelect: z.number().int().min(0).optional(),
  maxSelect: z.number().int().positive().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateModifierGroupInput = z.infer<typeof createModifierGroupSchema>;
export type UpdateModifierGroupInput = z.infer<typeof updateModifierGroupSchema>;

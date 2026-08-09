import { z } from "zod";

export const createIngredientSchema = z.object({
  name: z.string().min(1, "Ingredient name is required").max(100),
  unit: z.string().min(1, "Unit is required").max(20),
  currentStock: z.number().min(0, "Stock cannot be negative").default(0),
  minStock: z.number().min(0, "Minimum stock cannot be negative").default(0),
  costPerUnit: z.number().min(0, "Cost per unit cannot be negative").default(0),
  supplier: z.string().max(100).optional(),
});

export const updateIngredientSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  unit: z.string().min(1).max(20).optional(),
  currentStock: z.number().min(0).optional(),
  minStock: z.number().min(0).optional(),
  costPerUnit: z.number().min(0).optional(),
  supplier: z.string().max(100).optional(),
  isActive: z.boolean().optional(),
});

export const adjustStockSchema = z.object({
  adjustment: z.number().refine(val => val !== 0, "Adjustment cannot be zero"),
  reason: z.string().min(1, "Reason is required").max(500),
});

export const createRecipeSchema = z.object({
  name: z.string().min(1, "Recipe name is required").max(100),
  productId: z.string().min(1, "Product ID is required"),
  items: z.array(z.object({
    ingredientId: z.string().min(1, "Ingredient ID is required"),
    quantity: z.number().positive("Quantity must be positive"),
  })).min(1, "At least one ingredient is required"),
});

export const updateRecipeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  productId: z.string().optional(),
  items: z.array(z.object({
    ingredientId: z.string().min(1, "Ingredient ID is required"),
    quantity: z.number().positive("Quantity must be positive"),
  })).optional(),
  isActive: z.boolean().optional(),
});

export type CreateIngredientInput = z.infer<typeof createIngredientSchema>;
export type UpdateIngredientInput = z.infer<typeof updateIngredientSchema>;
export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
export type CreateRecipeInput = z.infer<typeof createRecipeSchema>;
export type UpdateRecipeInput = z.infer<typeof updateRecipeSchema>;

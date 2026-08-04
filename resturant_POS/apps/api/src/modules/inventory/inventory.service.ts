export async function getIngredients(_restaurantId: string) {
  return [];
}

export async function createIngredient(_restaurantId: string, _data: unknown) {
  throw new Error("Inventory is not enabled in this version");
}

export async function updateIngredient(_restaurantId: string, _ingredientId: string, _data: unknown) {
  throw new Error("Inventory is not enabled in this version");
}

export async function adjustStock(_restaurantId: string, _ingredientId: string, _data: unknown) {
  throw new Error("Inventory is not enabled in this version");
}

export async function getLowStockAlerts(_restaurantId: string) {
  return [];
}

export async function getRecipes(_restaurantId: string) {
  return [];
}

export async function createRecipe(_restaurantId: string, _data: unknown) {
  throw new Error("Inventory is not enabled in this version");
}

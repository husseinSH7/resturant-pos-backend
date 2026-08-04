import { useState, useEffect } from 'react';
import { Plus, Package, AlertTriangle, TrendingDown } from 'lucide-react';

interface Ingredient {
  id: string;
  name: string;
  sku: string | null;
  unit: string;
  costPerUnit: number;
  currentStock: number;
  minStockLevel: number;
  isLowStock: boolean;
}

interface LowStockAlert {
  ingredientId: string;
  ingredientName: string;
  currentStock: number;
  minStockLevel: number;
  unit: string;
  shortage: number;
}

interface Recipe {
  id: string;
  name: string;
  productId: string;
  totalCost: number;
  items: Array<{
    id: string;
    ingredientId: string;
    ingredientName: string;
    quantity: number;
    unit: string;
    cost: number;
  }>;
}

export default function Inventory() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [stockAdjustment, setStockAdjustment] = useState('');
  const [isRestock, setIsRestock] = useState(false);
  const [newIngredient, setNewIngredient] = useState({
    name: '',
    sku: '',
    unit: 'kg',
    costPerUnit: '',
    minStockLevel: '',
    initialStock: '',
  });
  const [newRecipe, setNewRecipe] = useState({
    name: '',
    productId: '',
    items: [] as Array<{ ingredientId: string; quantity: string }>,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const API_BASE = 'http://localhost:4000';
      
      // Load ingredients from API
      const ingredientsRes = await fetch(`${API_BASE}/inventory/ingredients`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (ingredientsRes.ok) {
        const ingredientsData = await ingredientsRes.json();
        setIngredients(ingredientsData.map((ing: any) => ({
          id: ing.id,
          name: ing.name,
          sku: null,
          unit: ing.unit,
          costPerUnit: ing.costPerUnit,
          currentStock: ing.currentStock,
          minStockLevel: ing.minStock,
          isLowStock: ing.currentStock <= ing.minStock,
        })));
      }
      
      // Load low stock alerts from API
      const alertsRes = await fetch(`${API_BASE}/inventory/low-stock`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setLowStockAlerts(alertsData.map((alert: any) => ({
          ingredientId: alert.id,
          ingredientName: alert.name,
          currentStock: alert.currentStock,
          minStockLevel: alert.minStock,
          unit: alert.unit,
          shortage: alert.minStock - alert.currentStock,
        })));
      }
      
      // Load recipes from API
      const recipesRes = await fetch(`${API_BASE}/inventory/recipes`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (recipesRes.ok) {
        const recipesData = await recipesRes.json();
        setRecipes(recipesData);
      }
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddIngredient = async () => {
    try {
      const API_BASE = 'http://localhost:4000';
      const response = await fetch(`${API_BASE}/inventory/ingredients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          name: newIngredient.name,
          unit: newIngredient.unit,
          currentStock: parseFloat(newIngredient.initialStock) || 0,
          minStock: parseFloat(newIngredient.minStockLevel) || 0,
          costPerUnit: parseFloat(newIngredient.costPerUnit) || 0,
        }),
      });
      
      if (response.ok) {
        setShowAddModal(false);
        setNewIngredient({
          name: '',
          sku: '',
          unit: 'kg',
          costPerUnit: '',
          minStockLevel: '',
          initialStock: '',
        });
        loadData();
      } else {
        throw new Error('Failed to add ingredient');
      }
    } catch (error) {
      console.error('Failed to add ingredient:', error);
      alert('Failed to add ingredient. Please try again.');
    }
  };

  const handleAdjustStock = async () => {
    if (!selectedIngredient) return;
    try {
      const API_BASE = 'http://localhost:4000';
      const adjustment = isRestock 
        ? parseFloat(stockAdjustment) 
        : -parseFloat(stockAdjustment);
      
      const response = await fetch(`${API_BASE}/inventory/ingredients/${selectedIngredient.id}/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          adjustment,
          reason: isRestock ? 'Restock' : 'Usage',
        }),
      });
      
      if (response.ok) {
        setShowStockModal(false);
        setStockAdjustment('');
        setIsRestock(false);
        setSelectedIngredient(null);
        loadData();
      } else {
        throw new Error('Failed to adjust stock');
      }
    } catch (error) {
      console.error('Failed to adjust stock:', error);
      alert('Failed to adjust stock. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading inventory...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-gray-600 mt-1">Track ingredients, stock levels, and costs</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowRecipeModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-5 h-5" />
              Add Recipe
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition"
            >
              <Plus className="w-5 h-5" />
              Add Ingredient
            </button>
          </div>
        </div>

        {/* Low Stock Alerts */}
        {lowStockAlerts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h2 className="text-xl font-semibold text-red-900">Low Stock Alerts</h2>
              <span className="bg-red-600 text-white text-sm px-2 py-1 rounded-full">
                {lowStockAlerts.length}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockAlerts.map((alert) => (
                <div key={alert.ingredientId} className="bg-white rounded-lg p-4 border border-red-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{alert.ingredientName}</h3>
                      <p className="text-sm text-gray-600">
                        {alert.currentStock} {alert.unit} / {alert.minStockLevel} {alert.unit} minimum
                      </p>
                    </div>
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Shortage</span>
                      <span className="font-semibold text-red-600">{alert.shortage} {alert.unit}</span>
                    </div>
                    <div className="w-full bg-red-200 rounded-full h-2">
                      <div
                        className="bg-red-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min((alert.currentStock / alert.minStockLevel) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ingredients Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Ingredients ({ingredients.length})
            </h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost/Unit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {ingredients.map((ingredient) => (
                <tr key={ingredient.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{ingredient.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {ingredient.sku || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${ingredient.isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                        {ingredient.currentStock}
                      </span>
                      <span className="text-gray-500">/ {ingredient.minStockLevel}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {ingredient.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    ${ingredient.costPerUnit.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {ingredient.isLowStock ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Low Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        In Stock
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => {
                        setSelectedIngredient(ingredient);
                        setShowStockModal(true);
                      }}
                      className="text-orange-600 hover:text-orange-900 font-medium text-sm"
                    >
                      Adjust Stock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recipes Section */}
        <div className="bg-white rounded-lg shadow overflow-hidden mt-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Recipes ({recipes.length})
            </h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recipe Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ingredients
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recipes.map((recipe) => (
                <tr key={recipe.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{recipe.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {recipe.productId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    ${recipe.totalCost.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">
                      {recipe.items.map((item, idx) => (
                        <div key={item.id}>
                          {item.quantity} {item.unit} {item.ingredientName} (${item.cost.toFixed(2)})
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Ingredient Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Add New Ingredient</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={newIngredient.name}
                    onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Ingredient name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU (optional)</label>
                  <input
                    type="text"
                    value={newIngredient.sku}
                    onChange={(e) => setNewIngredient({ ...newIngredient, sku: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="SKU code"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <select
                      value={newIngredient.unit}
                      onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="kg">kg</option>
                      <option value="L">L</option>
                      <option value="g">g</option>
                      <option value="ml">ml</option>
                      <option value="unit">unit</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cost per Unit</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newIngredient.costPerUnit}
                      onChange={(e) => setNewIngredient({ ...newIngredient, costPerUnit: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock Level</label>
                    <input
                      type="number"
                      value={newIngredient.minStockLevel}
                      onChange={(e) => setNewIngredient({ ...newIngredient, minStockLevel: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock</label>
                    <input
                      type="number"
                      value={newIngredient.initialStock}
                      onChange={(e) => setNewIngredient({ ...newIngredient, initialStock: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddIngredient}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                >
                  Add Ingredient
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Adjust Stock Modal */}
        {showStockModal && selectedIngredient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Adjust Stock</h2>
              <p className="text-gray-600 mb-4">
                {selectedIngredient.name} - Current: {selectedIngredient.currentStock} {selectedIngredient.unit}
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adjustment Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={stockAdjustment}
                    onChange={(e) => setStockAdjustment(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Use negative to reduce stock"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="restock"
                    checked={isRestock}
                    onChange={(e) => setIsRestock(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="restock" className="text-sm text-gray-700">
                    Mark as restock (updates last restocked date)
                  </label>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowStockModal(false);
                    setStockAdjustment('');
                    setIsRestock(false);
                    setSelectedIngredient(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdjustStock}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                >
                  Adjust Stock
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Recipe Modal */}
        {showRecipeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Add New Recipe</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recipe Name</label>
                  <input
                    type="text"
                    value={newRecipe.name}
                    onChange={(e) => setNewRecipe({ ...newRecipe, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Recipe name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product ID</label>
                  <input
                    type="text"
                    value={newRecipe.productId}
                    onChange={(e) => setNewRecipe({ ...newRecipe, productId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Product ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ingredients</label>
                  {newRecipe.items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <select
                        value={item.ingredientId}
                        onChange={(e) => {
                          const updatedItems = [...newRecipe.items];
                          updatedItems[idx] = { ...item, ingredientId: e.target.value };
                          setNewRecipe({ ...newRecipe, items: updatedItems });
                        }}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value="">Select ingredient</option>
                        {ingredients.map((ing) => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name} ({ing.unit})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => {
                          const updatedItems = [...newRecipe.items];
                          updatedItems[idx] = { ...item, quantity: e.target.value };
                          setNewRecipe({ ...newRecipe, items: updatedItems });
                        }}
                        className="w-24 border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="Qty"
                      />
                      <button
                        onClick={() => {
                          const updatedItems = newRecipe.items.filter((_, i) => i !== idx);
                          setNewRecipe({ ...newRecipe, items: updatedItems });
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setNewRecipe({ ...newRecipe, items: [...newRecipe.items, { ingredientId: '', quantity: '' }] })}
                    className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                  >
                    + Add Ingredient
                  </button>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowRecipeModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      const API_BASE = 'http://localhost:4000';
                      const response = await fetch(`${API_BASE}/inventory/recipes`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        },
                        body: JSON.stringify({
                          name: newRecipe.name,
                          productId: newRecipe.productId,
                          items: newRecipe.items.map(item => ({
                            ingredientId: item.ingredientId,
                            quantity: parseFloat(item.quantity) || 0,
                          })),
                        }),
                      });
                      
                      if (response.ok) {
                        setShowRecipeModal(false);
                        setNewRecipe({
                          name: '',
                          productId: '',
                          items: [],
                        });
                        loadData();
                      } else {
                        throw new Error('Failed to create recipe');
                      }
                    } catch (error) {
                      console.error('Failed to create recipe:', error);
                      alert('Failed to create recipe. Please try again.');
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Create Recipe
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

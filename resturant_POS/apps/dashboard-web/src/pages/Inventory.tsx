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

export default function Inventory() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Mock data - replace with actual API calls
      setIngredients([
        {
          id: '1',
          name: 'Flour',
          sku: 'FLO001',
          unit: 'kg',
          costPerUnit: 0.50,
          currentStock: 45,
          minStockLevel: 50,
          isLowStock: true,
        },
        {
          id: '2',
          name: 'Sugar',
          sku: 'SUG002',
          unit: 'kg',
          costPerUnit: 0.75,
          currentStock: 80,
          minStockLevel: 30,
          isLowStock: false,
        },
        {
          id: '3',
          name: 'Olive Oil',
          sku: 'OIL003',
          unit: 'L',
          costPerUnit: 8.50,
          currentStock: 12,
          minStockLevel: 15,
          isLowStock: true,
        },
      ]);
      
      setLowStockAlerts([
        {
          ingredientId: '1',
          ingredientName: 'Flour',
          currentStock: 45,
          minStockLevel: 50,
          unit: 'kg',
          shortage: 5,
        },
        {
          ingredientId: '3',
          ingredientName: 'Olive Oil',
          currentStock: 12,
          minStockLevel: 15,
          unit: 'L',
          shortage: 3,
        },
      ]);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddIngredient = async () => {
    try {
      // API call to add ingredient
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
    } catch (error) {
      console.error('Failed to add ingredient:', error);
    }
  };

  const handleAdjustStock = async () => {
    if (!selectedIngredient) return;
    try {
      // API call to adjust stock
      setShowStockModal(false);
      setStockAdjustment('');
      setIsRestock(false);
      setSelectedIngredient(null);
      loadData();
    } catch (error) {
      console.error('Failed to adjust stock:', error);
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
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition"
          >
            <Plus className="w-5 h-5" />
            Add Ingredient
          </button>
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
      </div>
    </div>
  );
}

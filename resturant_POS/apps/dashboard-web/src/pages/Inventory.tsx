import { useState, useEffect, useCallback } from 'react'
import { Plus, AlertTriangle, TrendingDown, Search, Package, Scale, DollarSign, AlertCircle, Loader2, X, Edit2, Trash2 } from 'lucide-react'
import { api } from '../services/api'

interface Ingredient {
  id: string
  name: string
  sku: string | null
  unit: string
  costPerUnit: number
  currentStock: number
  minStockLevel: number
  isLowStock: boolean
}

export default function Inventory() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState('')

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showStockModal, setShowStockModal] = useState(false)
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    unit: 'kg',
    costPerUnit: 0,
    currentStock: 0,
    minStockLevel: 0,
  })
  const [stockAdjustment, setStockAdjustment] = useState('')

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAdjusting, setIsAdjusting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setError('')
      const res = await api.get('/inventory/ingredients')
      setIngredients(res.data)
    } catch (err: any) {
      console.error(err)
      setError(err?.response?.data?.message || 'Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Add ingredient
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    try {
      const res = await api.post('/inventory/ingredients', formData)
      setIngredients(prev => [...prev, { ...res.data, isLowStock: res.data.currentStock <= res.data.minStockLevel }])
      setShowAddModal(false)
      resetForm()
      loadData()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to add ingredient')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Edit ingredient
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedIngredient) return
    setIsSubmitting(true)
    setError('')
    try {
      const res = await api.put(`/inventory/ingredients/${selectedIngredient.id}`, formData)
      setIngredients(prev => prev.map(i => i.id === selectedIngredient.id ? { ...res.data, isLowStock: res.data.currentStock <= res.data.minStockLevel } : i))
      setShowEditModal(false)
      resetForm()
      loadData()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update ingredient')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete ingredient
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this ingredient?')) return
    setDeletingId(id)
    try {
      await api.delete(`/inventory/ingredients/${id}`)
      setIngredients(prev => prev.filter(i => i.id !== id))
      loadData()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  // Adjust stock
  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedIngredient) return
    const adjustment = parseFloat(stockAdjustment)
    if (isNaN(adjustment) || adjustment === 0) {
      setError('Please enter a valid adjustment amount')
      return
    }
    setIsAdjusting(true)
    setError('')
    try {
      await api.post(`/inventory/ingredients/${selectedIngredient.id}/adjust`, {
        adjustment,
        reason: 'Manual adjustment',
      })
      setShowStockModal(false)
      setStockAdjustment('')
      loadData()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Adjustment failed')
    } finally {
      setIsAdjusting(false)
    }
  }

  const resetForm = () => {
    setFormData({ name: '', unit: 'kg', costPerUnit: 0, currentStock: 0, minStockLevel: 0 })
    setSelectedIngredient(null)
    setError('')
  }

  const openEditModal = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient)
    setFormData({
      name: ingredient.name,
      unit: ingredient.unit,
      costPerUnit: ingredient.costPerUnit,
      currentStock: ingredient.currentStock,
      minStockLevel: ingredient.minStockLevel,
    })
    setShowEditModal(true)
  }

  const openStockModal = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient)
    setStockAdjustment('')
    setShowStockModal(true)
  }

  const lowStockItems = ingredients.filter(i => i.isLowStock)
  const totalValue = ingredients.reduce((sum, i) => sum + (i.currentStock * i.costPerUnit), 0)

  const filtered = ingredients.filter(i =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Inventory Management</h1>
          <p className="text-sm text-gray-400 mt-1">Track ingredients, stock levels, and costs</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowAddModal(true) }}
          className="flex items-center gap-2 bg-linear-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-orange-700 transition shadow-lg shadow-orange-500/30"
        >
          <Plus className="h-5 w-5" /> Add Ingredient
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Items" value={ingredients.length} icon={<Package className="h-5 w-5" />} color="orange" />
        <StatCard label="Low Stock" value={lowStockItems.length} icon={<AlertTriangle className="h-5 w-5" />} color="red" />
        <StatCard label="Total Value" value={`$${totalValue.toFixed(2)}`} icon={<DollarSign className="h-5 w-5" />} color="green" />
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-red-900/20 border border-red-700 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <h2 className="text-lg font-semibold text-red-200">Low Stock Alerts</h2>
            <span className="bg-red-600 text-white text-sm px-3 py-0.5 rounded-full font-bold">{lowStockItems.length}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockItems.map(item => (
              <div key={item.id} className="bg-gray-800 border border-red-700 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-white">{item.name}</h3>
                    <p className="text-sm text-gray-400">{item.currentStock} / {item.minStockLevel} {item.unit}</p>
                  </div>
                  <TrendingDown className="h-4 w-4 text-red-400" />
                </div>
                <div className="mt-2 w-full bg-red-900/50 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: `${Math.min((item.currentStock / item.minStockLevel) * 100, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
        <input
          type="text"
          placeholder="Search ingredients..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2.5 w-full bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 text-white placeholder-gray-400"
        />
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Cost/Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-900/30 rounded-lg">
                        <Package className="h-4 w-4 text-orange-400" />
                      </div>
                      <span className="font-semibold text-white">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`font-bold ${item.isLowStock ? 'text-red-400' : 'text-white'}`}>
                      {item.currentStock}
                    </span>
                    <span className="text-gray-500 ml-1">/ {item.minStockLevel}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-300 flex items-center gap-2">
                    <Scale className="h-4 w-4 text-gray-500" />
                    {item.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-300 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    {item.costPerUnit.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.isLowStock ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-red-900/30 text-red-400">
                        <AlertCircle className="h-3 w-3" />
                        Low Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-green-900/30 text-green-400">
                        In Stock
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap space-x-2">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1 text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 rounded transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="p-1 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded transition-colors disabled:opacity-50"
                    >
                      {deletingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => openStockModal(item)}
                      className="text-orange-400 hover:text-orange-300 text-sm font-semibold transition-colors"
                    >
                      Adjust
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    {searchTerm ? 'No ingredients match your search.' : 'No ingredients yet. Add one above.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Add Ingredient</h2>
              <button onClick={() => { setShowAddModal(false); resetForm() }} className="p-1 hover:bg-gray-700 rounded-lg">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Name *</label>
                  <input
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Unit</label>
                    <select
                      value={formData.unit}
                      onChange={e => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white"
                    >
                      <option>kg</option><option>L</option><option>g</option><option>ml</option><option>unit</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Cost/Unit ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.costPerUnit}
                      onChange={e => setFormData({ ...formData, costPerUnit: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Initial Stock</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.currentStock}
                      onChange={e => setFormData({ ...formData, currentStock: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Min Stock Level</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.minStockLevel}
                      onChange={e => setFormData({ ...formData, minStockLevel: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white"
                      required
                    />
                  </div>
                </div>
              </div>
              {error && <div className="mt-3 text-sm text-red-400">{error}</div>}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); resetForm() }}
                  className="flex-1 px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 text-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-linear-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 flex items-center justify-center gap-2 disabled:opacity-50 transition"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isSubmitting ? 'Adding...' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedIngredient && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Edit Ingredient</h2>
              <button onClick={() => { setShowEditModal(false); resetForm() }} className="p-1 hover:bg-gray-700 rounded-lg">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Name *</label>
                  <input
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Unit</label>
                    <select
                      value={formData.unit}
                      onChange={e => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white"
                    >
                      <option>kg</option><option>L</option><option>g</option><option>ml</option><option>unit</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Cost/Unit ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.costPerUnit}
                      onChange={e => setFormData({ ...formData, costPerUnit: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Current Stock</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.currentStock}
                      onChange={e => setFormData({ ...formData, currentStock: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Min Stock Level</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.minStockLevel}
                      onChange={e => setFormData({ ...formData, minStockLevel: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white"
                      required
                    />
                  </div>
                </div>
              </div>
              {error && <div className="mt-3 text-sm text-red-400">{error}</div>}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); resetForm() }}
                  className="flex-1 px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 text-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-linear-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 flex items-center justify-center gap-2 disabled:opacity-50 transition"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isSubmitting ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showStockModal && selectedIngredient && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Adjust Stock</h2>
              <button onClick={() => { setShowStockModal(false); setStockAdjustment(''); setError('') }} className="p-1 hover:bg-gray-700 rounded-lg">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <p className="text-gray-400 mb-4">
              {selectedIngredient.name} - Current: <span className="font-bold text-white">{selectedIngredient.currentStock}</span> {selectedIngredient.unit}
            </p>
            <form onSubmit={handleAdjustStock}>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Adjustment Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={stockAdjustment}
                  onChange={e => setStockAdjustment(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white"
                  placeholder="Use negative to reduce"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Positive to add, negative to subtract.</p>
              </div>
              {error && <div className="mt-3 text-sm text-red-400">{error}</div>}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowStockModal(false); setStockAdjustment(''); setError('') }}
                  className="flex-1 px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 text-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdjusting}
                  className="flex-1 px-4 py-2 bg-linear-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 flex items-center justify-center gap-2 disabled:opacity-50 transition"
                >
                  {isAdjusting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isAdjusting ? 'Adjusting...' : 'Adjust'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon, color }: any) {
  const colors: any = {
    orange: 'bg-orange-900/30 text-orange-400',
    red: 'bg-red-900/30 text-red-400',
    green: 'bg-green-900/30 text-green-400',
    blue: 'bg-blue-900/30 text-blue-400',
    purple: 'bg-purple-900/30 text-purple-400',
  }
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 hover:shadow-lg transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${colors[color] || 'bg-gray-700 text-gray-400'}`}>{icon}</div>
      </div>
    </div>
  )
}
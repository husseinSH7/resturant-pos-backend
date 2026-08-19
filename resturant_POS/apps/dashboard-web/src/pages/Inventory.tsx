import { useState, useEffect } from 'react'
import { Plus, AlertTriangle, TrendingDown, Search, Package, Scale, DollarSign, AlertCircle } from 'lucide-react'
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
  const [showModal, setShowModal] = useState(false)
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null)
  const [showStockModal, setShowStockModal] = useState(false)
  const [stockAdjustment, setStockAdjustment] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const res = await api.get('/inventory/ingredients')
      setIngredients(res.data)
    } catch (error) { console.error(error) } finally { setLoading(false) }
  }

  const filtered = ingredients.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const lowStockItems = ingredients.filter(i => i.currentStock <= i.minStockLevel)

  if (loading) return <div className="flex justify-center p-12"><div className="relative"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div><div className="absolute top-0 left-0 animate-ping rounded-full h-12 w-12 border-2 border-orange-400 opacity-20"></div></div></div>

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-lineaar-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Inventory Management</h1>
          <p className="text-sm text-gray-500 mt-2">Track ingredients, stock levels, and costs</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-linear-to-r from-orange-500 to-orange-600 text-white px-5 py-2.5 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 hover:scale-105 shadow-lg shadow-orange-500/30">
          <Plus className="h-5 w-5" /> Add Ingredient
        </button>
      </div>

      {lowStockItems.length > 0 && (
        <div className="bg-linear-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-xl">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-lg font-semibold text-red-900 dark:text-red-100">Low Stock Alerts</h2>
            <span className="bg-red-600 text-white text-sm px-3 py-1 rounded-full font-bold">{lowStockItems.length}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStockItems.map(item => (
              <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-red-200 dark:border-red-800 shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.currentStock} / {item.minStockLevel} {item.unit}</p>
                  </div>
                  <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                    <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <div className="mt-3 w-full bg-red-200 dark:bg-red-900 rounded-full h-2">
                  <div className="bg-lineaar-to-r from-red-500 to-red-600 h-2 rounded-full transition-all duration-300" style={{ width: `${Math.min((item.currentStock / item.minStockLevel) * 100, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search ingredients..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-12 pr-4 py-3 w-full border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 transition-all duration-200"
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unit</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cost/Unit</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                        <Package className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`font-bold ${item.isLowStock ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{item.currentStock}</span>
                    <span className="text-gray-400 dark:text-gray-500 ml-1">/ {item.minStockLevel}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <Scale className="h-4 w-4" />
                    {item.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    {item.costPerUnit.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.isLowStock ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">
                        <AlertCircle className="h-3 w-3" />
                        Low Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                        In Stock
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button onClick={() => { setSelectedIngredient(item); setShowStockModal(true) }} className="text-orange-600 dark:text-orange-400 hover:text-orange-900 dark:hover:text-orange-300 text-sm font-semibold transition-colors">Adjust</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 transform transition-all">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Add Ingredient</h2>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const form = e.target as HTMLFormElement
              const data = { name: (form.elements.namedItem('name') as HTMLInputElement).value, unit: (form.elements.namedItem('unit') as HTMLSelectElement).value, costPerUnit: parseFloat((form.elements.namedItem('cost') as HTMLInputElement).value), currentStock: parseFloat((form.elements.namedItem('stock') as HTMLInputElement).value), minStock: parseFloat((form.elements.namedItem('minStock') as HTMLInputElement).value) }
              try { await api.post('/inventory/ingredients', data); setShowModal(false); loadData() } catch (error) { alert('Failed') }
            }}>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                  <input name="name" className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 transition-all duration-200" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Unit</label>
                    <select name="unit" className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 transition-all duration-200">
                      <option>kg</option><option>L</option><option>g</option><option>ml</option><option>unit</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cost/Unit</label>
                    <input name="cost" type="number" step="0.01" className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 transition-all duration-200" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Initial Stock</label>
                    <input name="stock" type="number" step="0.01" className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 transition-all duration-200" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Min Stock Level</label>
                    <input name="minStock" type="number" step="0.01" className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 transition-all duration-200" required />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-linear-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showStockModal && selectedIngredient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 transform transition-all">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Adjust Stock</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{selectedIngredient.name} - Current: {selectedIngredient.currentStock} {selectedIngredient.unit}</p>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const adjustment = parseFloat(stockAdjustment)
              try {
                await api.post(`/inventory/ingredients/${selectedIngredient.id}/adjust`, { adjustment, reason: 'Manual adjustment' })
                setShowStockModal(false); setStockAdjustment(''); loadData()
              } catch (error) { alert('Failed') }
            }}>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Adjustment Amount</label>
                <input type="number" step="0.01" value={stockAdjustment} onChange={e => setStockAdjustment(e.target.value)} className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 transition-all duration-200" placeholder="Use negative to reduce" required />
              </div>
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => { setShowStockModal(false); setStockAdjustment('') }} className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-linear-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200">Adjust</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
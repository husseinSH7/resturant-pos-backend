import { useState, useEffect } from 'react'
import { Plus, AlertTriangle, TrendingDown, Search } from 'lucide-react'
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

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-sm text-gray-500 mt-1">Track ingredients, stock levels, and costs</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition">
          <Plus className="h-5 w-5" /> Add Ingredient
        </button>
      </div>

      {lowStockItems.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h2 className="text-lg font-semibold text-red-900">Low Stock Alerts</h2>
            <span className="bg-red-600 text-white text-sm px-2 py-1 rounded-full">{lowStockItems.length}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStockItems.map(item => (
              <div key={item.id} className="bg-white rounded-lg p-4 border border-red-200">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-600">{item.currentStock} / {item.minStockLevel} {item.unit}</p>
                  </div>
                  <TrendingDown className="h-5 w-5 text-red-600" />
                </div>
                <div className="mt-2 w-full bg-red-200 rounded-full h-2">
                  <div className="bg-red-600 h-2 rounded-full" style={{ width: `${Math.min((item.currentStock / item.minStockLevel) * 100, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search ingredients..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost/Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={item.isLowStock ? 'text-red-600 font-semibold' : 'text-gray-900'}>{item.currentStock}</span>
                    <span className="text-gray-400 ml-1">/ {item.minStockLevel}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{item.unit}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">${item.costPerUnit.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.isLowStock ? <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Low Stock</span> : <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">In Stock</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button onClick={() => { setSelectedIngredient(item); setShowStockModal(true) }} className="text-orange-600 hover:text-orange-900 text-sm font-medium">Adjust</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold mb-4">Add Ingredient</h2>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const form = e.target as HTMLFormElement
              const data = { name: (form.elements.namedItem('name') as HTMLInputElement).value, unit: (form.elements.namedItem('unit') as HTMLSelectElement).value, costPerUnit: parseFloat((form.elements.namedItem('cost') as HTMLInputElement).value), currentStock: parseFloat((form.elements.namedItem('stock') as HTMLInputElement).value), minStock: parseFloat((form.elements.namedItem('minStock') as HTMLInputElement).value) }
              try { await api.post('/inventory/ingredients', data); setShowModal(false); loadData() } catch (error) { alert('Failed') }
            }}>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700">Name</label><input name="name" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" required /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700">Unit</label><select name="unit" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"><option>kg</option><option>L</option><option>g</option><option>ml</option><option>unit</option></select></div>
                  <div><label className="block text-sm font-medium text-gray-700">Cost/Unit</label><input name="cost" type="number" step="0.01" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" required /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700">Initial Stock</label><input name="stock" type="number" step="0.01" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" required /></div>
                  <div><label className="block text-sm font-medium text-gray-700">Min Stock Level</label><input name="minStock" type="number" step="0.01" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" required /></div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showStockModal && selectedIngredient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold mb-4">Adjust Stock</h2>
            <p className="text-gray-600 mb-4">{selectedIngredient.name} - Current: {selectedIngredient.currentStock} {selectedIngredient.unit}</p>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const adjustment = parseFloat(stockAdjustment)
              try {
                await api.post(`/inventory/ingredients/${selectedIngredient.id}/adjust`, { adjustment, reason: 'Manual adjustment' })
                setShowStockModal(false); setStockAdjustment(''); loadData()
              } catch (error) { alert('Failed') }
            }}>
              <div><label className="block text-sm font-medium text-gray-700">Adjustment Amount</label><input type="number" step="0.01" value={stockAdjustment} onChange={e => setStockAdjustment(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" placeholder="Use negative to reduce" required /></div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => { setShowStockModal(false); setStockAdjustment('') }} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">Adjust</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Users, MapPin, Clock, ArrowRightLeft, Merge } from 'lucide-react'
import { api } from '../services/api'

interface Table {
  id: string
  name: string
  seats: number
  area: string
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'DIRTY'
  guestCount?: number
  occupiedSince?: string
  currentOrderId?: string
}

export default function Tables() {
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTable, setEditingTable] = useState<Table | null>(null)

  useEffect(() => { loadTables() }, [])

  const loadTables = async () => {
    try {
      const res = await api.get('/tables')
      setTables(res.data)
    } catch (error) { console.error(error) } finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this table?')) return
    try {
      await api.delete(`/tables/${id}`)
      setTables(tables.filter(t => t.id !== id))
    } catch (error) { alert('Delete failed') }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-700'
      case 'OCCUPIED': return 'bg-orange-100 text-orange-700'
      case 'RESERVED': return 'bg-blue-100 text-blue-700'
      case 'DIRTY': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tables Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your restaurant tables and floor layout</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition">
            <Merge className="h-5 w-5" /> Merge Tables
          </button>
          <button onClick={() => { setEditingTable(null); setShowModal(true) }} className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition">
            <Plus className="h-5 w-5" /> Add Table
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Tables" value={tables.length} icon={<MapPin className="h-5 w-5" />} color="orange" />
        <StatCard label="Available" value={tables.filter(t => t.status === 'AVAILABLE').length} icon={<Users className="h-5 w-5" />} color="green" />
        <StatCard label="Occupied" value={tables.filter(t => t.status === 'OCCUPIED').length} icon={<Users className="h-5 w-5" />} color="orange" />
        <StatCard label="Reserved" value={tables.filter(t => t.status === 'RESERVED').length} icon={<Clock className="h-5 w-5" />} color="blue" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tables.map(table => (
          <div key={table.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{table.name}</h3>
                <p className="text-sm text-gray-500">{table.area}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditingTable(table); setShowModal(true) }} className="p-1.5 text-gray-400 hover:text-gray-600 transition">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(table.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500 flex items-center gap-1"><Users className="h-4 w-4" /> Seats</span><span className="font-medium">{table.seats}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Status</span><span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(table.status)}`}>{table.status}</span></div>
            </div>

            {table.status === 'OCCUPIED' && (
              <div className="mt-3 pt-3 border-t space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Guests</span><span className="font-medium">{table.guestCount}</span></div>
                {table.occupiedSince && <div className="flex justify-between"><span className="text-gray-500 flex items-center gap-1"><Clock className="h-4 w-4" /> Since</span><span className="font-medium">{table.occupiedSince}</span></div>}
                <button className="mt-2 w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition text-sm">
                  <ArrowRightLeft className="h-4 w-4" /> Transfer Table
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold mb-4">{editingTable ? 'Edit Table' : 'Add Table'}</h2>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const form = e.target as HTMLFormElement
              const data = { name: (form.elements.namedItem('name') as HTMLInputElement).value, seats: parseInt((form.elements.namedItem('seats') as HTMLInputElement).value), area: (form.elements.namedItem('area') as HTMLSelectElement).value }
              try {
                if (editingTable) {
                  const res = await api.put(`/tables/${editingTable.id}`, data)
                  setTables(tables.map(t => t.id === editingTable.id ? { ...t, ...res.data } : t))
                } else {
                  const res = await api.post('/tables', data)
                  setTables([...tables, res.data])
                }
                setShowModal(false)
              } catch (error) { alert('Save failed') }
            }}>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700">Table Name</label><input name="name" defaultValue={editingTable?.name || ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" required /></div>
                <div><label className="block text-sm font-medium text-gray-700">Seats</label><input name="seats" type="number" defaultValue={editingTable?.seats || 4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" required /></div>
                <div><label className="block text-sm font-medium text-gray-700">Area</label>
                  <select name="area" defaultValue={editingTable?.area || 'Main Dining'} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
                    <option>Main Dining</option><option>Patio</option><option>Private Room</option><option>Bar</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon, color }: any) {
  const colors: any = { orange: 'bg-orange-100 text-orange-600', green: 'bg-green-100 text-green-600', blue: 'bg-blue-100 text-blue-600' }
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center justify-between">
        <div><p className="text-sm font-medium text-gray-500">{label}</p><p className="text-2xl font-bold text-gray-900 mt-1">{value}</p></div>
        <div className={`p-2 ${colors[color] || 'bg-gray-100 text-gray-600'} rounded-lg`}>{icon}</div>
      </div>
    </div>
  )
}
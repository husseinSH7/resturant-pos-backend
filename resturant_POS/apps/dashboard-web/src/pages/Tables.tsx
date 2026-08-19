import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Users, MapPin, Clock, ArrowRightLeft, Merge, Armchair, CheckCircle, XCircle, Calendar } from 'lucide-react'
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
      case 'AVAILABLE': return 'bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 text-green-700 dark:text-green-400'
      case 'OCCUPIED': return 'bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 text-orange-700 dark:text-orange-400'
      case 'RESERVED': return 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-700 dark:text-blue-400'
      case 'DIRTY': return 'bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 text-red-700 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return <CheckCircle className="h-4 w-4" />
      case 'OCCUPIED': return <Users className="h-4 w-4" />
      case 'RESERVED': return <Calendar className="h-4 w-4" />
      case 'DIRTY': return <XCircle className="h-4 w-4" />
      default: return <Armchair className="h-4 w-4" />
    }
  }

  if (loading) return <div className="flex justify-center p-12"><div className="relative"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div><div className="absolute top-0 left-0 animate-ping rounded-full h-12 w-12 border-2 border-orange-400 opacity-20"></div></div></div>

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Tables Management</h1>
          <p className="text-sm text-gray-500 mt-2">Manage your restaurant tables and floor layout</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-gray-600 dark:bg-gray-700 text-white px-4 py-2.5 rounded-xl hover:bg-gray-700 dark:hover:bg-gray-600 transition-all duration-200 hover:scale-105">
            <Merge className="h-5 w-5" /> Merge Tables
          </button>
          <button onClick={() => { setEditingTable(null); setShowModal(true) }} className="flex items-center gap-2 bg-linear-to-r from-orange-500 to-orange-600 text-white px-5 py-2.5 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 hover:scale-105 shadow-lg shadow-orange-500/30">
            <Plus className="h-5 w-5" /> Add Table
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Tables" value={tables.length} icon={<MapPin className="h-5 w-5" />} color="orange" />
        <StatCard label="Available" value={tables.filter(t => t.status === 'AVAILABLE').length} icon={<CheckCircle className="h-5 w-5" />} color="green" />
        <StatCard label="Occupied" value={tables.filter(t => t.status === 'OCCUPIED').length} icon={<Users className="h-5 w-5" />} color="orange" />
        <StatCard label="Reserved" value={tables.filter(t => t.status === 'RESERVED').length} icon={<Calendar className="h-5 w-5" />} color="blue" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tables.map(table => (
          <div key={table.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${getStatusColor(table.status)}`}>
                  <Armchair className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{table.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{table.area}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditingTable(table); setShowModal(true) }} className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(table.id)} className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2"><Users className="h-4 w-4" /> Seats</span>
                <span className="font-bold text-gray-900 dark:text-white">{table.seats}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">Status</span>
                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${getStatusColor(table.status)}`}>
                  {getStatusIcon(table.status)}
                  {table.status}
                </span>
              </div>
            </div>

            {table.status === 'OCCUPIED' && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">Guests</span>
                  <span className="font-bold text-gray-900 dark:text-white">{table.guestCount}</span>
                </div>
                {table.occupiedSince && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2"><Clock className="h-4 w-4" /> Since</span>
                    <span className="font-bold text-gray-900 dark:text-white">{table.occupiedSince}</span>
                  </div>
                )}
                <button className="mt-3 w-full flex items-center justify-center gap-2 bg-linear-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2.5 rounded-xl hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all duration-200 text-sm font-medium">
                  <ArrowRightLeft className="h-4 w-4" /> Transfer Table
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 transform transition-all">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">{editingTable ? 'Edit Table' : 'Add Table'}</h2>
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
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Table Name</label>
                  <input name="name" defaultValue={editingTable?.name || ''} className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 transition-all duration-200" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Seats</label>
                  <input name="seats" type="number" defaultValue={editingTable?.seats || 4} className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 transition-all duration-200" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Area</label>
                  <select name="area" defaultValue={editingTable?.area || 'Main Dining'} className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 transition-all duration-200">
                    <option>Main Dining</option><option>Patio</option><option>Private Room</option><option>Bar</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-linear-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200">Save</button>
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
    orange: 'bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 text-orange-600 dark:text-orange-400',
    green: 'bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 text-green-600 dark:text-green-400',
    blue: 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-600 dark:text-blue-400' 
  }
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div><p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p><p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p></div>
        <div className={`p-3 rounded-xl ${colors[color] || 'bg-gray-100 text-gray-600'}`}>{icon}</div>
      </div>
    </div>
  )
}
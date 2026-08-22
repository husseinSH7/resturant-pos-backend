import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Users, MapPin, Clock, ArrowRightLeft, Merge, Armchair, CheckCircle, XCircle, Calendar, Loader2, X } from 'lucide-react'
import { api } from '../services/api'

interface Table {
  id: string
  name: string
  seats: number
  area: string | null
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'DIRTY'
  guestCount?: number
  occupiedSince?: string
  currentOrderId?: string
}

export default function Tables() {
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [editingTable, setEditingTable] = useState<Table | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Transfer modal
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [transferSourceId, setTransferSourceId] = useState<string | null>(null)
  const [transferTargetId, setTransferTargetId] = useState('')
  const [transferring, setTransferring] = useState(false)

  // Merge modal
  const [showMergeModal, setShowMergeModal] = useState(false)
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([])
  const [mergeTargetId, setMergeTargetId] = useState('')
  const [merging, setMerging] = useState(false)

  // Form state for add/edit
  const [formData, setFormData] = useState({ name: '', seats: 4, area: 'Main Dining' })

  useEffect(() => { loadTables() }, [])

  const loadTables = async () => {
    try {
      setError('')
      const res = await api.get('/tables')
      setTables(res.data)
    } catch (err: any) {
      console.error('Failed to load tables', err)
      setError('Could not load tables. Please refresh.')
    } finally {
      setLoading(false)
    }
  }

  // ---------- CRUD ----------
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this table? This will permanently remove it.')) return
    try {
      await api.delete(`/tables/${id}`)
      setTables(tables.filter(t => t.id !== id))
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Delete failed'
      alert('Delete failed: ' + msg)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    try {
      if (editingTable) {
        const res = await api.put(`/tables/${editingTable.id}`, formData)
        setTables(tables.map(t => t.id === editingTable.id ? { ...t, ...res.data } : t))
      } else {
        const res = await api.post('/tables', formData)
        setTables([...tables, res.data])
      }
      setShowModal(false)
      resetForm()
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Save failed'
      setError(msg)
      alert('Save failed: ' + msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({ name: '', seats: 4, area: 'Main Dining' })
    setEditingTable(null)
    setError('')
  }

  const openModal = (table?: Table) => {
    if (table) {
      setEditingTable(table)
      setFormData({ name: table.name, seats: table.seats, area: table.area || 'Main Dining' })
    } else {
      resetForm()
    }
    setShowModal(true)
  }

  // ---------- Transfer ----------
  const openTransferModal = (sourceId: string) => {
    setTransferSourceId(sourceId)
    setTransferTargetId('')
    setShowTransferModal(true)
  }

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!transferSourceId || !transferTargetId) return
    setTransferring(true)
    try {
      await api.post(`/tables/${transferSourceId}/transfer`, { targetTableId: transferTargetId })
      await loadTables()
      setShowTransferModal(false)
      setTransferSourceId(null)
      setTransferTargetId('')
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Transfer failed'
      alert('Transfer failed: ' + msg)
    } finally {
      setTransferring(false)
    }
  }

  // ---------- Merge ----------
  const openMergeModal = () => {
    setSelectedSourceIds([])
    setMergeTargetId('')
    setShowMergeModal(true)
  }

  const toggleMergeSelection = (id: string) => {
    setSelectedSourceIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleMerge = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedSourceIds.length < 1 || !mergeTargetId) return
    setMerging(true)
    try {
      await api.post('/tables/merge', {
        sourceTableIds: selectedSourceIds,
        targetTableId: mergeTargetId,
      })
      await loadTables()
      setShowMergeModal(false)
      setSelectedSourceIds([])
      setMergeTargetId('')
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Merge failed'
      alert('Merge failed: ' + msg)
    } finally {
      setMerging(false)
    }
  }

  // ---------- Helpers ----------
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

  if (loading) return (
    <div className="flex justify-center p-12">
      <div className="relative">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        <div className="absolute top-0 left-0 animate-ping rounded-full h-12 w-12 border-2 border-orange-400 opacity-20"></div>
      </div>
    </div>
  )

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Tables Management</h1>
          <p className="text-sm text-gray-500 mt-2">Manage your restaurant tables and floor layout</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={openMergeModal}
            className="flex items-center gap-2 bg-gray-600 dark:bg-gray-700 text-white px-4 py-2.5 rounded-xl hover:bg-gray-700 dark:hover:bg-gray-600 transition-all duration-200 hover:scale-105"
          >
            <Merge className="h-5 w-5" /> Merge Tables
          </button>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-linear-to-r from-orange-500 to-orange-600 text-white px-5 py-2.5 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 hover:scale-105 shadow-lg shadow-orange-500/30"
          >
            <Plus className="h-5 w-5" /> Add Table
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Tables" value={tables.length} icon={<MapPin className="h-5 w-5" />} color="orange" />
        <StatCard label="Available" value={tables.filter(t => t.status === 'AVAILABLE').length} icon={<CheckCircle className="h-5 w-5" />} color="green" />
        <StatCard label="Occupied" value={tables.filter(t => t.status === 'OCCUPIED').length} icon={<Users className="h-5 w-5" />} color="orange" />
        <StatCard label="Reserved" value={tables.filter(t => t.status === 'RESERVED').length} icon={<Calendar className="h-5 w-5" />} color="blue" />
      </div>

      {/* Table Grid */}
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
                  <p className="text-sm text-gray-500 dark:text-gray-400">{table.area || 'No area'}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => openModal(table)}
                  className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(table.id)}
                  className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                >
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
                  <span className="font-bold text-gray-900 dark:text-white">{table.guestCount || '?'}</span>
                </div>
                {table.occupiedSince && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2"><Clock className="h-4 w-4" /> Since</span>
                    <span className="font-bold text-gray-900 dark:text-white">{new Date(table.occupiedSince).toLocaleTimeString()}</span>
                  </div>
                )}
                <button
                  onClick={() => openTransferModal(table.id)}
                  className="mt-3 w-full flex items-center justify-center gap-2 bg-linear-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2.5 rounded-xl hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all duration-200 text-sm font-medium"
                >
                  <ArrowRightLeft className="h-4 w-4" /> Transfer Table
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ===== Add/Edit Modal ===== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 transform transition-all">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
              {editingTable ? 'Edit Table' : 'Add Table'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Table Name</label>
                  <input
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 transition-all duration-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Seats</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.seats}
                    onChange={e => setFormData({ ...formData, seats: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 transition-all duration-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Area</label>
                  <select
                    value={formData.area}
                    onChange={e => setFormData({ ...formData, area: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 transition-all duration-200"
                  >
                    <option>Main Dining</option>
                    <option>Patio</option>
                    <option>Private Room</option>
                    <option>Bar</option>
                  </select>
                </div>
              </div>
              {error && <div className="mt-4 text-sm text-red-600">{error}</div>}
              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-linear-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 className="h-5 w-5 animate-spin" />}
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== Transfer Modal ===== */}
      {showTransferModal && transferSourceId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Transfer Order</h2>
              <button onClick={() => setShowTransferModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleTransfer}>
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Transfer the open order from <strong>{tables.find(t => t.id === transferSourceId)?.name}</strong> to which table?
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Table</label>
                  <select
                    value={transferTargetId}
                    onChange={e => setTransferTargetId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-800"
                    required
                  >
                    <option value="">Select a table</option>
                    {tables
                      .filter(t => t.id !== transferSourceId && t.status === 'AVAILABLE')
                      .map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.seats} seats)</option>
                      ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowTransferModal(false)} className="flex-1 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={transferring} className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 flex items-center justify-center gap-2">
                  {transferring && <Loader2 className="h-5 w-5 animate-spin" />}
                  {transferring ? 'Transferring...' : 'Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== Merge Modal ===== */}
      {showMergeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Merge Tables</h2>
              <button onClick={() => setShowMergeModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleMerge}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select source tables (orders will be merged)</label>
                  <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl p-3">
                    {tables.filter(t => t.status === 'OCCUPIED').map(t => (
                      <label key={t.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedSourceIds.includes(t.id)}
                          onChange={() => toggleMergeSelection(t.id)}
                          className="rounded text-orange-600 focus:ring-orange-500"
                        />
                        <span>{t.name} ({t.seats} seats) – {t.guestCount || '?'} guests</span>
                      </label>
                    ))}
                    {tables.filter(t => t.status === 'OCCUPIED').length === 0 && (
                      <p className="text-gray-500 text-sm">No occupied tables to merge.</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Table (where orders will go)</label>
                  <select
                    value={mergeTargetId}
                    onChange={e => setMergeTargetId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-800"
                    required
                  >
                    <option value="">Select target table</option>
                    {tables
                      .filter(t => !selectedSourceIds.includes(t.id))
                      .map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.seats} seats) – {t.status}</option>
                      ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowMergeModal(false)} className="flex-1 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50">Cancel</button>
                <button
                  type="submit"
                  disabled={merging || selectedSourceIds.length === 0 || !mergeTargetId}
                  className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {merging && <Loader2 className="h-5 w-5 animate-spin" />}
                  {merging ? 'Merging...' : 'Merge'}
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
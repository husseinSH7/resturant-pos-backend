import { useState, useEffect, useCallback } from 'react'
import { Pencil, Trash2, Search, UserPlus, Clock, DollarSign, Star, ShoppingCart, Shield, Coffee, BadgeCheck, Loader2, X, Users } from 'lucide-react'
import { api } from '../services/api'

interface Staff {
  id: string
  fullName: string
  email: string
  role: 'MANAGER' | 'CASHIER' | 'KITCHEN'
  pin?: string
  isActive: boolean
  ordersToday?: number
  revenueToday?: number
  rating?: number
  shiftStart?: string
}

export default function Staff() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'CASHIER' as 'MANAGER' | 'CASHIER' | 'KITCHEN',
    pin: '',
  })

  const loadStaff = useCallback(async () => {
    try {
      setError('')
      const res = await api.get('/staff')
      const data = (res.data || []).map((item: any) => ({
        ...item,
        fullName: item.fullName || item.name || 'Unknown',
        ordersToday: item.ordersToday || 0,
        revenueToday: item.revenueToday || 0,
        rating: item.rating || 0,
        shiftStart: item.shiftStart || null,
      }))
      setStaff(data)
    } catch (err: any) {
      console.error(err)
      setError(err?.response?.data?.message || 'Failed to load staff')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStaff()
  }, [loadStaff])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    try {
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        role: formData.role,
        pin: formData.pin,
      }
      if (editingStaff) {
        const res = await api.put(`/staff/${editingStaff.id}`, payload)
        setStaff(prev => prev.map(m => m.id === editingStaff.id ? { ...m, ...res.data } : m))
      } else {
        const res = await api.post('/staff', payload)
        setStaff(prev => [...prev, { ...res.data, ordersToday: 0, revenueToday: 0, rating: 0 }])
      }
      setShowModal(false)
      resetForm()
      loadStaff() // background sync
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Save failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this staff member?')) return
    setDeletingId(id)
    try {
      await api.delete(`/staff/${id}`)
      setStaff(prev => prev.filter(m => m.id !== id))
      loadStaff()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleActive = async (id: string) => {
    const member = staff.find(m => m.id === id)
    if (!member) return
    setTogglingId(id)
    try {
      const newStatus = !member.isActive
      await api.put(`/staff/${id}`, { isActive: newStatus })
      setStaff(prev => prev.map(m => m.id === id ? { ...m, isActive: newStatus } : m))
      loadStaff()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Status update failed')
    } finally {
      setTogglingId(null)
    }
  }

  const resetForm = () => {
    setFormData({ fullName: '', email: '', role: 'CASHIER', pin: '' })
    setEditingStaff(null)
    setError('')
  }

  const openModal = (member?: Staff) => {
    if (member) {
      setEditingStaff(member)
      setFormData({
        fullName: member.fullName,
        email: member.email,
        role: member.role,
        pin: member.pin || '',
      })
    } else {
      resetForm()
    }
    setShowModal(true)
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'MANAGER': return <Shield className="h-4 w-4" />
      case 'CASHIER': return <ShoppingCart className="h-4 w-4" />
      case 'KITCHEN': return <Coffee className="h-4 w-4" />
      default: return <BadgeCheck className="h-4 w-4" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'MANAGER': return 'bg-purple-900/30 text-purple-400 border-purple-700'
      case 'CASHIER': return 'bg-blue-900/30 text-blue-400 border-blue-700'
      case 'KITCHEN': return 'bg-green-900/30 text-green-400 border-green-700'
      default: return 'bg-gray-700 text-gray-300'
    }
  }

  const filteredStaff = staff.filter(m =>
    m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.email && m.email.toLowerCase().includes(searchTerm.toLowerCase()))
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
          <h1 className="text-2xl font-bold text-white">Staff Management</h1>
          <p className="text-sm text-gray-400 mt-1">Manage your team members and their shifts</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-linear-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-orange-700 transition shadow-lg shadow-orange-500/30"
        >
          <UserPlus className="h-5 w-5" /> Add Staff
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Staff" value={staff.length} icon={<Users className="h-5 w-5" />} color="orange" />
        <StatCard label="Active" value={staff.filter(m => m.isActive).length} icon={<BadgeCheck className="h-5 w-5" />} color="green" />
        <StatCard label="Inactive" value={staff.filter(m => !m.isActive).length} icon={<Clock className="h-5 w-5" />} color="gray" />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
        <input
          type="text"
          placeholder="Search staff by name or email..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2.5 w-full bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 text-white placeholder-gray-400"
        />
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map(member => (
          <div key={member.id} className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${member.isActive ? 'bg-orange-900/30' : 'bg-gray-700'}`}>
                  <span className={`text-xl font-bold ${member.isActive ? 'text-orange-400' : 'text-gray-500'}`}>
                    {member.fullName.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-white">{member.fullName}</h3>
                  <p className="text-sm text-gray-400">{member.email || 'No email'}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => openModal(member)}
                  className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-900/30 rounded-lg transition-colors"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(member.id)}
                  disabled={deletingId === member.id}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                >
                  {deletingId === member.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Role</span>
                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${getRoleColor(member.role)}`}>
                  {getRoleIcon(member.role)}
                  {member.role}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Status</span>
                <button
                  onClick={() => handleToggleActive(member.id)}
                  disabled={togglingId === member.id}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1 ${
                    member.isActive
                      ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  {togglingId === member.id && <Loader2 className="h-3 w-3 animate-spin" />}
                  {member.isActive ? 'Active' : 'Inactive'}
                </button>
              </div>
            </div>

            {member.isActive && (
              <div className="mt-5 pt-5 border-t border-gray-700 space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 flex items-center gap-2"><ShoppingCart className="h-4 w-4" /> Orders Today</span>
                  <span className="font-bold text-white">{member.ordersToday || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 flex items-center gap-2"><DollarSign className="h-4 w-4" /> Revenue</span>
                  <span className="font-bold text-white">${(member.revenueToday || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 flex items-center gap-2"><Star className="h-4 w-4" /> Rating</span>
                  <div className="flex items-center gap-1 bg-yellow-900/30 px-2 py-1 rounded-full">
                    <span className="text-yellow-400">★</span>
                    <span className="font-bold text-yellow-400">{(member.rating || 0).toFixed(1)}</span>
                  </div>
                </div>
                {member.shiftStart && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 flex items-center gap-2"><Clock className="h-4 w-4" /> Shift Start</span>
                    <span className="font-bold text-white">{member.shiftStart}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {filteredStaff.length === 0 && (
          <div className="col-span-full text-center text-gray-400 py-8">
            {searchTerm ? 'No staff match your search.' : 'No staff members yet. Add one above.'}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">
                {editingStaff ? 'Edit Staff' : 'Add Staff'}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm() }} className="p-1 hover:bg-gray-700 rounded-lg">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Full Name *</label>
                  <input
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white"
                  >
                    <option value="CASHIER">Cashier</option>
                    <option value="KITCHEN">Kitchen</option>
                    <option value="MANAGER">Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">PIN (4 digits) *</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={formData.pin}
                    onChange={e => setFormData({ ...formData, pin: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white"
                    required
                  />
                </div>
              </div>
              {error && <div className="mt-3 text-sm text-red-400">{error}</div>}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm() }}
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
                  {isSubmitting ? 'Saving...' : (editingStaff ? 'Update' : 'Add')}
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
    green: 'bg-green-900/30 text-green-400',
    gray: 'bg-gray-700 text-gray-400',
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
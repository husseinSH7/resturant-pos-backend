import { useState, useEffect } from 'react'
import { Pencil, Trash2, Search, UserPlus, Clock, DollarSign, Star, ShoppingCart, Shield, Coffee, BadgeCheck } from 'lucide-react'
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
  const [showModal, setShowModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)

  useEffect(() => { loadStaff() }, [])

  const loadStaff = async () => {
    try {
      const res = await api.get('/staff')
      // Normalize data: ensure fullName, and provide defaults for missing fields
      const data = (res.data || []).map((item: any) => ({
        ...item,
        fullName: item.fullName || item.name || 'Unknown',
        ordersToday: item.ordersToday || 0,
        revenueToday: item.revenueToday || 0,
        rating: item.rating || 0,
      }))
      setStaff(data)
    } catch (error) { console.error(error) } finally { setLoading(false) }
  }

  const filteredStaff = staff.filter(m =>
    m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.email && m.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this staff member?')) return
    try {
      await api.delete(`/staff/${id}`)
      setStaff(staff.filter(m => m.id !== id))
    } catch (error) { alert('Delete failed') }
  }

  const handleToggleActive = async (id: string) => {
    const member = staff.find(m => m.id === id)
    if (!member) return
    try {
      await api.put(`/staff/${id}`, { isActive: !member.isActive })
      setStaff(staff.map(m => m.id === id ? { ...m, isActive: !m.isActive } : m))
    } catch (error) { alert('Update failed') }
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
      case 'MANAGER': return 'bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 text-purple-700 dark:text-purple-400'
      case 'CASHIER': return 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-700 dark:text-blue-400'
      case 'KITCHEN': return 'bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 text-green-700 dark:text-green-400'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) return <div className="flex justify-center p-12"><div className="relative"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div><div className="absolute top-0 left-0 animate-ping rounded-full h-12 w-12 border-2 border-orange-400 opacity-20"></div></div></div>

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Staff Management</h1>
          <p className="text-sm text-gray-500 mt-2">Manage your team members and their shifts</p>
        </div>
        <button
          onClick={() => { setEditingStaff(null); setShowModal(true) }}
          className="flex items-center gap-2 bg-linear-to-r from-orange-500 to-orange-600 text-white px-5 py-2.5 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 hover:scale-105 shadow-lg shadow-orange-500/30"
        >
          <UserPlus className="h-5 w-5" /> Add Staff
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search staff by name or email..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-12 pr-4 py-3 w-full border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 transition-all duration-200"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map(member => (
          <div key={member.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${member.isActive ? 'bg-linear-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                  <span className={`text-xl font-bold ${member.isActive ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500'}`}>
                    {member.fullName.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{member.fullName}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{member.email || 'No email'}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditingStaff(member); setShowModal(true) }} className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(member.id)} className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">Role</span>
                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${getRoleColor(member.role)}`}>
                  {getRoleIcon(member.role)}
                  {member.role}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">Status</span>
                <button
                  onClick={() => handleToggleActive(member.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${member.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                >
                  {member.isActive ? 'Active' : 'Inactive'}
                </button>
              </div>
            </div>

            {member.isActive && (
              <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-700 space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2"><ShoppingCart className="h-4 w-4" /> Orders Today</span>
                  <span className="font-bold text-gray-900 dark:text-white">{member.ordersToday || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2"><DollarSign className="h-4 w-4" /> Revenue</span>
                  <span className="font-bold text-gray-900 dark:text-white">${(member.revenueToday || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2"><Star className="h-4 w-4" /> Rating</span>
                  <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/30 px-2 py-1 rounded-full">
                    <span className="text-yellow-500">★</span>
                    <span className="font-bold text-yellow-700 dark:text-yellow-400">{(member.rating || 0).toFixed(1)}</span>
                  </div>
                </div>
                {member.shiftStart && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2"><Clock className="h-4 w-4" /> Shift Start</span>
                    <span className="font-bold text-gray-900 dark:text-white">{member.shiftStart}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 transform transition-all">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">{editingStaff ? 'Edit Staff' : 'Add Staff'}</h2>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const form = e.target as HTMLFormElement
              const data = { 
                fullName: (form.elements.namedItem('fullName') as HTMLInputElement).value, 
                email: (form.elements.namedItem('email') as HTMLInputElement).value, 
                role: (form.elements.namedItem('role') as HTMLSelectElement).value, 
                pin: (form.elements.namedItem('pin') as HTMLInputElement).value 
              }
              try {
                if (editingStaff) {
                  const res = await api.put(`/staff/${editingStaff.id}`, data)
                  setStaff(staff.map(m => m.id === editingStaff.id ? { ...m, ...res.data } : m))
                } else {
                  const res = await api.post('/staff', data)
                  setStaff([...staff, res.data])
                }
                setShowModal(false)
              } catch (error) { alert('Save failed') }
            }}>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                  <input name="fullName" defaultValue={editingStaff?.fullName || ''} className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 transition-all duration-200" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                  <input name="email" type="email" defaultValue={editingStaff?.email || ''} className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 transition-all duration-200" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
                  <select name="role" defaultValue={editingStaff?.role || 'CASHIER'} className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 transition-all duration-200">
                    <option value="CASHIER">Cashier</option>
                    <option value="KITCHEN">Kitchen</option>
                    <option value="MANAGER">Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">PIN (4 digits)</label>
                  <input name="pin" type="password" maxLength={4} defaultValue={editingStaff?.pin || ''} className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 transition-all duration-200" required />
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
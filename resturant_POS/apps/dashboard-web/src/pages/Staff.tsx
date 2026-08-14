import { useState, useEffect } from 'react'
import { Pencil, Trash2, Search, UserPlus, Clock, DollarSign, Star } from 'lucide-react'
import { api } from '../services/api'

interface Staff {
  id: string
  name: string
  email: string
  role: 'MANAGER' | 'CASHIER' | 'KITCHEN'
  pin: string
  isActive: boolean
  ordersToday: number
  revenueToday: number
  rating: number
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
      setStaff(res.data)
    } catch (error) { console.error(error) } finally { setLoading(false) }
  }

  const filteredStaff = staff.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
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

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your team members and their shifts</p>
        </div>
        <button
          onClick={() => { setEditingStaff(null); setShowModal(true) }}
          className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition"
        >
          <UserPlus className="h-5 w-5" /> Add Staff
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search staff by name or email..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map(member => (
          <div key={member.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${member.isActive ? 'bg-orange-100' : 'bg-gray-100'}`}>
                  <span className={`text-lg font-semibold ${member.isActive ? 'text-orange-600' : 'text-gray-400'}`}>
                    {member.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{member.name}</h3>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditingStaff(member); setShowModal(true) }} className="p-1.5 text-gray-400 hover:text-gray-600 transition">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(member.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Role</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  member.role === 'MANAGER' ? 'bg-purple-100 text-purple-700' :
                  member.role === 'CASHIER' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                }`}>{member.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <button
                  onClick={() => handleToggleActive(member.id)}
                  className={`px-2 py-1 rounded text-xs font-medium ${member.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                >
                  {member.isActive ? 'Active' : 'Inactive'}
                </button>
              </div>
            </div>

            {member.isActive && (
              <div className="mt-4 pt-4 border-t space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-gray-500 flex items-center gap-1"><ShoppingCartIcon className="h-4 w-4" /> Orders Today</span><span className="font-semibold">{member.ordersToday}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 flex items-center gap-1"><DollarSign className="h-4 w-4" /> Revenue</span><span className="font-semibold">${member.revenueToday.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 flex items-center gap-1"><Star className="h-4 w-4" /> Rating</span><span className="font-semibold">{member.rating.toFixed(1)}</span></div>
                {member.shiftStart && <div className="flex justify-between"><span className="text-gray-500 flex items-center gap-1"><Clock className="h-4 w-4" /> Shift Start</span><span className="font-semibold">{member.shiftStart}</span></div>}
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold mb-4">{editingStaff ? 'Edit Staff' : 'Add Staff'}</h2>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const form = e.target as HTMLFormElement
              const data = { name: (form.elements.namedItem('name') as HTMLInputElement).value, email: (form.elements.namedItem('email') as HTMLInputElement).value, role: (form.elements.namedItem('role') as HTMLSelectElement).value, pin: (form.elements.namedItem('pin') as HTMLInputElement).value }
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
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700">Name</label><input name="name" defaultValue={editingStaff?.name || ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" required /></div>
                <div><label className="block text-sm font-medium text-gray-700">Email</label><input name="email" type="email" defaultValue={editingStaff?.email || ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" required /></div>
                <div><label className="block text-sm font-medium text-gray-700">Role</label>
                  <select name="role" defaultValue={editingStaff?.role || 'CASHIER'} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
                    <option value="CASHIER">Cashier</option><option value="KITCHEN">Kitchen</option><option value="MANAGER">Manager</option>
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-700">PIN (4 digits)</label><input name="pin" type="password" maxLength={4} defaultValue={editingStaff?.pin || ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" required /></div>
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

function ShoppingCartIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.4 6M17 13l2.4 6M9 21a1 1 0 11-2 0 1 1 0 012 0zm8 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
}
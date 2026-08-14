import { useState, useEffect } from 'react'
import { Search, Plus, Star, TrendingUp, Phone, Calendar, Award } from 'lucide-react'
import { api } from '../services/api'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  points: number
  totalSpent: number
  visitCount: number
  loyaltyTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'
  lastVisit: string
  memberSince: string
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)

  useEffect(() => { loadCustomers() }, [])

  const loadCustomers = async () => {
    try {
      const res = await api.get('/customers')
      setCustomers(res.data)
    } catch (error) { console.error(error) } finally { setLoading(false) }
  }

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  )

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'PLATINUM': return 'bg-purple-100 text-purple-700 border-purple-300'
      case 'GOLD': return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'SILVER': return 'bg-gray-100 text-gray-700 border-gray-300'
      default: return 'bg-orange-100 text-orange-700 border-orange-300'
    }
  }

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers & Loyalty</h1>
          <p className="text-sm text-gray-500 mt-1">Manage customer profiles and loyalty rewards</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition">
          <Plus className="h-5 w-5" /> Add Customer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Customers" value={customers.length} icon={<Award className="h-5 w-5" />} color="orange" />
        <StatCard label="Active Loyalty Members" value={customers.filter(c => c.points > 0).length} icon={<Star className="h-5 w-5" />} color="yellow" />
        <StatCard label="Total Points Awarded" value={customers.reduce((sum, c) => sum + c.points, 0)} icon={<TrendingUp className="h-5 w-5" />} color="blue" />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search customers by name, email, or phone..."
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Spent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visits</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Visit</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{c.name}</div>
                    <div className="text-sm text-gray-500">{c.email}</div>
                    <div className="text-xs text-gray-400 flex items-center mt-1"><Phone className="h-3 w-3 mr-1" />{c.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getTierColor(c.loyaltyTier)}`}>{c.loyaltyTier}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{c.points.toLocaleString()}</div>
                    <div className="w-24 bg-gray-200 rounded-full h-1.5 mt-1">
                      <div className="bg-orange-600 h-1.5 rounded-full" style={{ width: `${Math.min((c.points / 2000) * 100, 100)}%` }} />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${c.totalSpent.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{c.visitCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center"><Calendar className="h-4 w-4 mr-1" />{c.lastVisit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold mb-4">Add Customer</h2>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const form = e.target as HTMLFormElement
              const data = { name: (form.elements.namedItem('name') as HTMLInputElement).value, email: (form.elements.namedItem('email') as HTMLInputElement).value, phone: (form.elements.namedItem('phone') as HTMLInputElement).value }
              try {
                await api.post('/customers', data)
                setShowModal(false); loadCustomers()
              } catch (error) { alert('Failed') }
            }}>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700">Name</label><input name="name" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" required /></div>
                <div><label className="block text-sm font-medium text-gray-700">Email</label><input name="email" type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700">Phone</label><input name="phone" type="tel" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" /></div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon, color }: any) {
  const colors: any = { orange: 'bg-orange-100 text-orange-600', yellow: 'bg-yellow-100 text-yellow-600', blue: 'bg-blue-100 text-blue-600' }
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center justify-between">
        <div><p className="text-sm font-medium text-gray-500">{label}</p><p className="text-2xl font-bold text-gray-900 mt-1">{value}</p></div>
        <div className={`p-2 ${colors[color] || 'bg-gray-100 text-gray-600'} rounded-lg`}>{icon}</div>
      </div>
    </div>
  )
}
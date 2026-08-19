import { useState, useEffect } from 'react'
import { Search, Plus, Star, TrendingUp, Phone, Calendar, Award, Crown, Medal, Zap } from 'lucide-react'
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
      case 'PLATINUM': return 'bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-700'
      case 'GOLD': return 'bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700'
      case 'SILVER': return 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
      default: return 'bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-700'
    }
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'PLATINUM': return <Crown className="h-4 w-4" />
      case 'GOLD': return <Star className="h-4 w-4" />
      case 'SILVER': return <Medal className="h-4 w-4" />
      default: return <Zap className="h-4 w-4" />
    }
  }

  if (loading) return <div className="flex justify-center p-12"><div className="relative"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div><div className="absolute top-0 left-0 animate-ping rounded-full h-12 w-12 border-2 border-orange-400 opacity-20"></div></div></div>

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Customers & Loyalty</h1>
          <p className="text-sm text-gray-500 mt-2">Manage customer profiles and loyalty rewards</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-linear-to-r from-orange-500 to-orange-600 text-white px-5 py-2.5 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 hover:scale-105 shadow-lg shadow-orange-500/30">
          <Plus className="h-5 w-5" /> Add Customer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Total Customers" value={customers.length} icon={<Award className="h-5 w-5" />} color="orange" />
        <StatCard label="Active Loyalty Members" value={customers.filter(c => c.points > 0).length} icon={<Star className="h-5 w-5" />} color="yellow" />
        <StatCard label="Total Points Awarded" value={customers.reduce((sum, c) => sum + c.points, 0)} icon={<TrendingUp className="h-5 w-5" />} color="blue" />
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search customers by name, email, or phone..."
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
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tier</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Points</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Spent</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Visits</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Visit</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCustomers.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-linear-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 flex items-center justify-center">
                        <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{c.name.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{c.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{c.email}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center mt-1"><Phone className="h-3 w-3 mr-1" />{c.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border ${getTierColor(c.loyaltyTier)}`}>
                      {getTierIcon(c.loyaltyTier)}
                      {c.loyaltyTier}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900 dark:text-white">{c.points.toLocaleString()}</div>
                    <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1.5">
                      <div className="bg-linear-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-300" style={{ width: `${Math.min((c.points / 2000) * 100, 100)}%` }} />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">${c.totalSpent.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">{c.visitCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 flex items-center"><Calendar className="h-4 w-4 mr-2" />{c.lastVisit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 transform transition-all">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Add Customer</h2>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const form = e.target as HTMLFormElement
              const data = { name: (form.elements.namedItem('name') as HTMLInputElement).value, email: (form.elements.namedItem('email') as HTMLInputElement).value, phone: (form.elements.namedItem('phone') as HTMLInputElement).value }
              try {
                await api.post('/customers', data)
                setShowModal(false); loadCustomers()
              } catch (error) { alert('Failed') }
            }}>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                  <input name="name" className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 transition-all duration-200" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                  <input name="email" type="email" className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 transition-all duration-200" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                  <input name="phone" type="tel" className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 transition-all duration-200" />
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
    </div>
  )
}

function StatCard({ label, value, icon, color }: any) {
  const colors: any = { 
    orange: 'bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 text-orange-600 dark:text-orange-400',
    yellow: 'bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30 text-yellow-600 dark:text-yellow-400',
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
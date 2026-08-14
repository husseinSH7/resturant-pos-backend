import { useState, useEffect } from 'react'
import { 
  ShoppingBag, Users, Table2, DollarSign, 
  AlertTriangle, Calendar, ArrowRight,
} from 'lucide-react'
import { api } from '../services/api'
import { Link } from 'react-router-dom'

interface Stats {
  totalOrders: number
  activeTables: number
  totalRevenue: number
  activeStaff: number
  lowStockItems: number
  pendingReservations: number
}

export default function Admin() {
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    activeTables: 0,
    totalRevenue: 0,
    activeStaff: 0,
    lowStockItems: 0,
    pendingReservations: 0,
  })
  const [loading, setLoading] = useState(true)
  const [recentOrders, setRecentOrders] = useState<any[]>([])

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const [ordersRes, tablesRes, reservationsRes, lowStockRes] = await Promise.all([
        api.get('/orders?status=PAID'),
        api.get('/tables'),
        api.get('/reservations?status=CONFIRMED', { params: { date: new Date().toISOString().split('T')[0] } }),
        api.get('/inventory/ingredients/low-stock'),
      ])

      const orders = ordersRes.data
      const totalRevenue = orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0)

      setStats({
        totalOrders: orders.length,
        activeTables: tablesRes.data.filter((t: any) => t.status === 'OCCUPIED').length,
        totalRevenue,
        activeStaff: 0,
        lowStockItems: lowStockRes.data.length,
        pendingReservations: reservationsRes.data.length,
      })

      // Get last 5 orders
      setRecentOrders(orders.slice(0, 5))
    } catch (error) {
      console.error('Failed to load dashboard', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back! Here's what's happening today</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard 
          title="Today's Revenue" 
          value={`$${stats.totalRevenue.toFixed(2)}`} 
          icon={<DollarSign className="h-5 w-5" />} 
          color="green"
          subtitle={`${stats.totalOrders} orders`}
        />
        <StatCard 
          title="Active Tables" 
          value={stats.activeTables} 
          icon={<Table2 className="h-5 w-5" />} 
          color="orange"
          subtitle="Currently occupied"
        />
        <StatCard 
          title="Pending Reservations" 
          value={stats.pendingReservations} 
          icon={<Calendar className="h-5 w-5" />} 
          color="blue"
          subtitle="Awaiting confirmation"
        />
        <StatCard 
          title="Low Stock Alerts" 
          value={stats.lowStockItems} 
          icon={<AlertTriangle className="h-5 w-5" />} 
          color="red"
          subtitle="Items need restocking"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <QuickAction to="/tables" icon={<Table2 className="h-6 w-6" />} label="Manage Tables" />
          <QuickAction to="/staff" icon={<Users className="h-6 w-6" />} label="Staff Schedule" />
          <QuickAction to="/inventory" icon={<ShoppingBag className="h-6 w-6" />} label="Check Inventory" />
          <QuickAction to="/reservations" icon={<Calendar className="h-6 w-6" />} label="View Reservations" />
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
          <Link to="/analytics" className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentOrders.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No recent orders</td></tr>
              ) : (
                recentOrders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-900">#{order.id.slice(0, 8)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">{order.customerName || 'Guest'}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">${(order.total || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        {order.status || 'PAID'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
        <div className="flex flex-wrap gap-6">
          <StatusItem label="API Server" status="online" />
          <StatusItem label="Database" status="online" />
          <StatusItem label="WebSocket" status="offline" />
          <StatusItem label="Printer" status="unknown" />
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, color, subtitle }: any) {
  const colorMap: any = {
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    blue: 'bg-blue-100 text-blue-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
  }
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${colorMap[color] || 'bg-gray-100 text-gray-600'}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function QuickAction({ to, icon, label }: any) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-xl hover:bg-orange-50 hover:border-orange-200 transition border-2 border-transparent group"
    >
      <div className="text-gray-400 group-hover:text-orange-600 transition">{icon}</div>
      <span className="text-sm font-medium text-gray-700 group-hover:text-orange-700 mt-2">{label}</span>
    </Link>
  )
}

function StatusItem({ label, status }: any) {
  const statusConfig: any = {
    online: { color: 'bg-green-500', text: 'Online' },
    offline: { color: 'bg-red-500', text: 'Offline' },
    unknown: { color: 'bg-yellow-500', text: 'Unknown' },
  }
  const config = statusConfig[status] || statusConfig.unknown
  return (
    <div className="flex items-center gap-3">
      <div className={`w-3 h-3 rounded-full ${config.color}`} />
      <span className="text-sm text-gray-700">{label}</span>
      <span className="text-xs text-gray-400">({config.text})</span>
    </div>
  )
}
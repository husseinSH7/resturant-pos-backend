import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Users, DollarSign, ShoppingCart, Download, RefreshCw } from 'lucide-react'
import { api } from '../services/api'

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today')
  const [loading, setLoading] = useState(true)
  const [salesData, setSalesData] = useState<any[]>([])
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    activeTables: 0,
  })

  const topItems = [
    { name: 'Burger', orders: 45, revenue: 2250 },
    { name: 'Pizza', orders: 38, revenue: 1900 },
    { name: 'Salad', orders: 32, revenue: 960 },
    { name: 'Pasta', orders: 28, revenue: 1400 },
    { name: 'Steak', orders: 22, revenue: 1760 },
  ]

  const categoryData = [
    { name: 'Food', value: 65 },
    { name: 'Drinks', value: 25 },
    { name: 'Desserts', value: 10 },
  ]

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  const loadAnalytics = async () => {
    try {
      const ordersRes = await api.get('/orders?status=PAID')
      const orders = ordersRes.data
      const tablesRes = await api.get('/tables')
      const tables = tablesRes.data

      const totalSales = orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0)
      const totalOrders = orders.length
      const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0
      const activeTables = tables.filter((t: any) => t.status === 'OCCUPIED').length

      setMetrics({
        totalSales,
        totalOrders,
        averageOrderValue: Math.round(avgOrderValue),
        activeTables,
      })

      const dailyMap: Record<string, { sales: number; orders: number }> = {}
      orders.forEach((o: any) => {
        const date = new Date(o.createdAt)
        const day = date.toLocaleDateString('en-US', { weekday: 'short' })
        if (!dailyMap[day]) dailyMap[day] = { sales: 0, orders: 0 }
        dailyMap[day].sales += o.total || 0
        dailyMap[day].orders += 1
      })
      const chartData = Object.entries(dailyMap).map(([name, vals]) => ({
        name,
        sales: vals.sales,
        orders: vals.orders,
      }))
      const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      chartData.sort((a, b) => weekDays.indexOf(a.name) - weekDays.indexOf(b.name))
      setSalesData(chartData)
    } catch (error) {
      console.error('Failed to load analytics data', error)
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time insights into your restaurant performance</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['today', 'week', 'month'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                timeRange === range
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
          <button
            onClick={() => loadAnalytics()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button
            onClick={() => {
              const dataStr = JSON.stringify({ salesData, topItems, metrics }, null, 2)
              const blob = new Blob([dataStr], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const link = document.createElement('a')
              link.href = url
              link.download = `analytics-${timeRange}.json`
              link.click()
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
          >
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Sales" value={`$${metrics.totalSales.toLocaleString()}`} icon={<DollarSign className="h-5 w-5" />} color="orange" />
        <MetricCard title="Total Orders" value={metrics.totalOrders} icon={<ShoppingCart className="h-5 w-5" />} color="blue" />
        <MetricCard title="Avg Order Value" value={`$${metrics.averageOrderValue}`} icon={<TrendingUp className="h-5 w-5" />} color="purple" />
        <MetricCard title="Active Tables" value={metrics.activeTables} icon={<Users className="h-5 w-5" />} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales Overview</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%" cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                dataKey="value"
              >
                {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Items</h2>
          <div className="space-y-3">
            {topItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-400">#{i+1}</span>
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.orders} orders</p>
                  </div>
                </div>
                <p className="font-semibold text-gray-900">${item.revenue.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Staff Performance</h2>
          <div className="space-y-3">
            {[
              { name: 'John Smith', orders: 45, revenue: 4500, rating: 4.8 },
              { name: 'Sarah Johnson', orders: 38, revenue: 3800, rating: 4.9 },
              { name: 'Mike Wilson', orders: 35, revenue: 3500, rating: 4.7 },
            ].map((staff, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div>
                  <p className="font-medium text-gray-900">{staff.name}</p>
                  <p className="text-sm text-gray-500">{staff.orders} orders • ${staff.revenue.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400">★</span>
                  <span className="font-semibold text-gray-900">{staff.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ title, value, icon, color }: any) {
  const colorClasses: any = {
    orange: 'bg-orange-100 text-orange-600',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
  }
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-2.5 rounded-lg ${colorClasses[color]}`}>{icon}</div>
      </div>
    </div>
  )
}
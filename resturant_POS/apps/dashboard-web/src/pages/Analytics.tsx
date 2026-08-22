import { useState, useEffect } from 'react'
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import { TrendingUp, Users, DollarSign, ShoppingCart, Download, RefreshCw, ArrowUpRight, ArrowDownRight, Sparkles } from 'lucide-react'
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
    { name: 'Burger', orders: 45, revenue: 2250, trend: 12 },
    { name: 'Pizza', orders: 38, revenue: 1900, trend: 8 },
    { name: 'Salad', orders: 32, revenue: 960, trend: -3 },
    { name: 'Pasta', orders: 28, revenue: 1400, trend: 5 },
    { name: 'Steak', orders: 22, revenue: 1760, trend: 15 },
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
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <div className="absolute top-0 left-0 animate-ping rounded-full h-12 w-12 border-2 border-orange-400 opacity-20"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-orange-500" />
            <h1 className="text-3xl font-bold text-white">
              Analytics Dashboard
            </h1>
          </div>
          <p className="text-sm text-gray-400 mt-2">Real-time insights into your restaurant performance</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['today', 'week', 'month'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                timeRange === range
                  ? 'bg-linear-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 hover:shadow-xl hover:scale-105'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
          <button
            onClick={() => loadAnalytics()}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 border border-gray-700 text-gray-300 rounded-xl hover:bg-gray-700 text-sm font-medium transition-all duration-200 hover:scale-105"
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
            className="flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 text-sm font-medium transition-all duration-200 hover:scale-105 shadow-lg shadow-green-500/30"
          >
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Sales" value={`$${metrics.totalSales.toLocaleString()}`} icon={<DollarSign className="h-5 w-5" />} color="orange" trend={12} />
        <MetricCard title="Total Orders" value={metrics.totalOrders} icon={<ShoppingCart className="h-5 w-5" />} color="blue" trend={8} />
        <MetricCard title="Avg Order Value" value={`$${metrics.averageOrderValue}`} icon={<TrendingUp className="h-5 w-5" />} color="purple" trend={-3} />
        <MetricCard title="Active Tables" value={metrics.activeTables} icon={<Users className="h-5 w-5" />} color="green" trend={5} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 hover:shadow-lg transition-shadow duration-300">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            Sales Overview
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.5} />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  borderRadius: '12px', 
                  border: '1px solid #374151',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
                  color: '#fff'
                }} 
              />
              <Legend wrapperStyle={{ color: '#d1d5db' }} />
              <Area type="monotone" dataKey="sales" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
              <Area type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorOrders)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 hover:shadow-lg transition-shadow duration-300">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Sales by Category
          </h2>
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
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  borderRadius: '12px', 
                  border: '1px solid #374151',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
                  color: '#fff'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 hover:shadow-lg transition-shadow duration-300">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-500" />
            Top Selling Items
          </h2>
          <div className="space-y-3">
            {topItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-xl hover:bg-gray-700 transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-orange-900/30 flex items-center justify-center">
                    <span className="text-sm font-bold text-orange-400">#{i+1}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white">{item.name}</p>
                    <p className="text-sm text-gray-400">{item.orders} orders</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-sm">
                    {item.trend > 0 ? (
                      <ArrowUpRight className="w-4 h-4 text-green-500" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`font-medium ${item.trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {Math.abs(item.trend)}%
                    </span>
                  </div>
                  <p className="font-bold text-white">${item.revenue.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 hover:shadow-lg transition-shadow duration-300">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-green-500" />
            Staff Performance
          </h2>
          <div className="space-y-3">
            {[
              { name: 'John Smith', orders: 45, revenue: 4500, rating: 4.8, avatar: 'JS' },
              { name: 'Sarah Johnson', orders: 38, revenue: 3800, rating: 4.9, avatar: 'SJ' },
              { name: 'Mike Wilson', orders: 35, revenue: 3500, rating: 4.7, avatar: 'MW' },
            ].map((staff, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-xl hover:bg-gray-700 transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                    {staff.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{staff.name}</p>
                    <p className="text-sm text-gray-400">{staff.orders} orders • ${staff.revenue.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-yellow-900/30 px-3 py-1.5 rounded-full">
                  <span className="text-yellow-500">★</span>
                  <span className="font-bold text-yellow-400">{staff.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ title, value, icon, color, trend }: any) {
  const colorClasses: any = {
    orange: 'bg-orange-900/30 text-orange-400',
    green: 'bg-green-900/30 text-green-400',
    blue: 'bg-blue-900/30 text-blue-400',
    purple: 'bg-purple-900/30 text-purple-400',
  }
  
  return (
    <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2 text-sm">
              {trend > 0 ? (
                <ArrowUpRight className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-500" />
              )}
              <span className={`font-medium ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {Math.abs(trend)}% from last period
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>{icon}</div>
      </div>
    </div>
  )
}
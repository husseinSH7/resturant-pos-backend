import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, DollarSign, Clock, ShoppingCart, Star, Download, Calendar, Filter } from 'lucide-react';

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [loading, setLoading] = useState(true);
  const [showDateRange, setShowDateRange] = useState(false);
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  // Mock data - replace with actual API calls
  const salesData = [
    { name: 'Mon', sales: 4000, orders: 45 },
    { name: 'Tue', sales: 3000, orders: 35 },
    { name: 'Wed', sales: 5000, orders: 55 },
    { name: 'Thu', sales: 4500, orders: 50 },
    { name: 'Fri', sales: 7000, orders: 80 },
    { name: 'Sat', sales: 8500, orders: 95 },
    { name: 'Sun', sales: 6000, orders: 65 },
  ];

  const topItems = [
    { name: 'Burger', orders: 45, revenue: 2250 },
    { name: 'Pizza', orders: 38, revenue: 1900 },
    { name: 'Salad', orders: 32, revenue: 960 },
    { name: 'Pasta', orders: 28, revenue: 1400 },
    { name: 'Steak', orders: 22, revenue: 1760 },
  ];

  const serverPerformance = [
    { name: 'John', orders: 45, revenue: 4500, rating: 4.8 },
    { name: 'Sarah', orders: 38, revenue: 3800, rating: 4.9 },
    { name: 'Mike', orders: 35, revenue: 3500, rating: 4.7 },
    { name: 'Emma', orders: 42, revenue: 4200, rating: 4.6 },
  ];

  const categoryData = [
    { name: 'Food', value: 65 },
    { name: 'Drinks', value: 25 },
    { name: 'Desserts', value: 10 },
  ];

  const metrics = {
    totalSales: 38000,
    totalOrders: 428,
    averageOrderValue: 89,
    activeTables: 12,
    staffOnShift: 4,
    peakHour: '7:00 PM',
  };

  useEffect(() => {
    // Simulate API call
    setTimeout(() => setLoading(false), 1000);
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <div className="flex space-x-2">
          {(['today', 'week', 'month', 'custom'] as const).map((range) => (
            <button
              key={range}
              onClick={() => {
                setTimeRange(range);
                if (range === 'custom') setShowDateRange(true);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-orange-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {range === 'custom' ? 'Custom' : range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
          <button
            onClick={() => {
              // Export functionality
              const dataStr = JSON.stringify({ salesData, topItems, serverPerformance, categoryData }, null, 2);
              const dataBlob = new Blob([dataStr], { type: 'application/json' });
              const url = URL.createObjectURL(dataBlob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
              link.click();
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker */}
      {showDateRange && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  value={customDateRange.startDate}
                  onChange={(e) => setCustomDateRange({ ...customDateRange, startDate: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  value={customDateRange.endDate}
                  onChange={(e) => setCustomDateRange({ ...customDateRange, endDate: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
            <button
              onClick={() => setShowDateRange(false)}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Total Sales"
          value={`$${metrics.totalSales.toLocaleString()}`}
          icon={<DollarSign className="h-6 w-6" />}
          trend="+12.5%"
          trendUp={true}
        />
        <MetricCard
          title="Total Orders"
          value={metrics.totalOrders}
          icon={<ShoppingCart className="h-6 w-6" />}
          trend="+8.2%"
          trendUp={true}
        />
        <MetricCard
          title="Avg Order Value"
          value={`$${metrics.averageOrderValue}`}
          icon={<TrendingUp className="h-6 w-6" />}
          trend="+3.1%"
          trendUp={true}
        />
        <MetricCard
          title="Active Tables"
          value={metrics.activeTables}
          icon={<Users className="h-6 w-6" />}
          trend="12/20"
          trendUp={true}
        />
        <MetricCard
          title="Staff on Shift"
          value={metrics.staffOnShift}
          icon={<Clock className="h-6 w-6" />}
          trend="4 scheduled"
          trendUp={false}
        />
        <MetricCard
          title="Peak Hour"
          value={metrics.peakHour}
          icon={<Star className="h-6 w-6" />}
          trend="7-8 PM"
          trendUp={false}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales Overview</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="#f97316" strokeWidth={2} />
              <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Items */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Items</h2>
          <div className="space-y-3">
            {topItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.orders} orders</p>
                </div>
                <p className="font-semibold text-gray-900">${item.revenue.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Server Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Server Performance</h2>
          <div className="space-y-3">
            {serverPerformance.map((server, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{server.name}</p>
                  <p className="text-sm text-gray-500">{server.orders} orders • ${server.revenue.toLocaleString()}</p>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="font-semibold text-gray-900">{server.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hourly Sales */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Hourly Sales</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="sales" fill="#f97316" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, trend, trendUp }: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend: string;
  trendUp: boolean;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className="p-3 bg-orange-100 rounded-lg">
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-center text-sm">
        <span className={`font-medium ${trendUp ? 'text-green-600' : 'text-gray-600'}`}>
          {trend}
        </span>
        <span className="text-gray-500 ml-2">
          {trendUp ? 'vs last period' : ''}
        </span>
      </div>
    </div>
  );
}

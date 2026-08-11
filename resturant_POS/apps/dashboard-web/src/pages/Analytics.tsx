import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, DollarSign, Clock, ShoppingCart, Star, Download, Calendar } from 'lucide-react';
import { api } from '../services/api';

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    activeTables: 0,
    staffOnShift: 0,
    peakHour: '--',
  });

  // For now, keep topItems and categoryData as mock – can be replaced later
  const topItems = [
    { name: 'Burger', orders: 45, revenue: 2250 },
    { name: 'Pizza', orders: 38, revenue: 1900 },
    { name: 'Salad', orders: 32, revenue: 960 },
    { name: 'Pasta', orders: 28, revenue: 1400 },
    { name: 'Steak', orders: 22, revenue: 1760 },
  ];

  const categoryData = [
    { name: 'Food', value: 65 },
    { name: 'Drinks', value: 25 },
    { name: 'Desserts', value: 10 },
  ];

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      // Fetch paid orders
      const ordersRes = await api.get('/orders?status=PAID');
      const orders = ordersRes.data;

      // Fetch tables
      const tablesRes = await api.get('/tables');
      const tables = tablesRes.data;

      // Compute metrics
      const totalSales = orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
      const totalOrders = orders.length;
      const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
      const activeTables = tables.filter((t: any) => t.status === 'OCCUPIED').length;

      setMetrics({
        totalSales,
        totalOrders,
        averageOrderValue: Math.round(avgOrderValue),
        activeTables,
        staffOnShift: 0, // no staff endpoint
        peakHour: '--',
      });

      // Prepare daily sales data (group by day)
      const dailyMap: Record<string, { sales: number; orders: number }> = {};
      orders.forEach((o: any) => {
        const date = new Date(o.createdAt);
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });
        if (!dailyMap[day]) dailyMap[day] = { sales: 0, orders: 0 };
        dailyMap[day].sales += o.total || 0;
        dailyMap[day].orders += 1;
      });
      // Convert to array for recharts
      const chartData = Object.entries(dailyMap).map(([name, vals]) => ({
        name,
        sales: vals.sales,
        orders: vals.orders,
      }));
      // Sort by day order (Mon, Tue, ...) – we can just use the order they appear
      const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      chartData.sort((a, b) => weekDays.indexOf(a.name) - weekDays.indexOf(b.name));
      setSalesData(chartData);

    } catch (error) {
      console.error('Failed to load analytics data', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <div className="flex space-x-2">
          {(['today', 'week', 'month', 'custom'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
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
              const dataStr = JSON.stringify({ salesData, topItems, metrics }, null, 2);
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

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Total Sales"
          value={`$${metrics.totalSales.toLocaleString()}`}
          icon={<DollarSign className="h-6 w-6" />}
          trend="Today's sales"
          trendUp={true}
        />
        <MetricCard
          title="Total Orders"
          value={metrics.totalOrders}
          icon={<ShoppingCart className="h-6 w-6" />}
          trend="Paid orders"
          trendUp={true}
        />
        <MetricCard
          title="Avg Order Value"
          value={`$${metrics.averageOrderValue}`}
          icon={<TrendingUp className="h-6 w-6" />}
          trend="Average per order"
          trendUp={true}
        />
        <MetricCard
          title="Active Tables"
          value={metrics.activeTables}
          icon={<Users className="h-6 w-6" />}
          trend="Currently occupied"
          trendUp={true}
        />
        <MetricCard
          title="Staff on Shift"
          value={metrics.staffOnShift}
          icon={<Clock className="h-6 w-6" />}
          trend="(no data)"
          trendUp={false}
        />
        <MetricCard
          title="Peak Hour"
          value={metrics.peakHour}
          icon={<Star className="h-6 w-6" />}
          trend="(no data)"
          trendUp={false}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales by Category (mock)</h2>
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
                {categoryData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <p className="text-center text-sm text-gray-400 mt-2">Data placeholder – real data coming soon</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Items (mock)</h2>
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
          <p className="text-center text-sm text-gray-400 mt-2">Data placeholder – real data coming soon</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Server Performance (mock)</h2>
          <div className="space-y-3">
            {[
              { name: 'John', orders: 45, revenue: 4500, rating: 4.8 },
              { name: 'Sarah', orders: 38, revenue: 3800, rating: 4.9 },
              { name: 'Mike', orders: 35, revenue: 3500, rating: 4.7 },
            ].map((server, index) => (
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
          <p className="text-center text-sm text-gray-400 mt-2">Data placeholder – real data coming soon</p>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, trend, trendUp }: any) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className="p-3 bg-orange-100 rounded-lg">{icon}</div>
      </div>
      <div className="mt-4 flex items-center text-sm">
        <span className={`font-medium ${trendUp ? 'text-green-600' : 'text-gray-600'}`}>{trend}</span>
      </div>
    </div>
  );
}
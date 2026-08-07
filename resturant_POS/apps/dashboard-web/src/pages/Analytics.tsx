import { useState, useEffect } from 'react';
import axios from 'axios';

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  salesByHour: number[];
  salesByDay: Array<{ day: string; amount: number }>;
  paymentMethods: Array<{ method: string; totalAmount: number; count: number }>;
}

interface RealTimeMetrics {
  totalRevenue: number;
  totalOrders: number;
  paidOrders: number;
  activeOrders: number;
  activeTables: number;
  waitlistCount: number;
  averageOrderValue: number;
  timestamp: Date;
}

export default function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('today');

  useEffect(() => {
    loadAnalytics();
    loadRealTimeMetrics();
    const interval = setInterval(loadRealTimeMetrics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      const token = localStorage.getItem('owner_token');
      const restaurantId = localStorage.getItem('owner_restaurant_id');
      const endDate = new Date().toISOString().split('T')[0];
      let startDate = endDate;

      if (timeRange === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        startDate = weekAgo.toISOString().split('T')[0];
      } else if (timeRange === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        startDate = monthAgo.toISOString().split('T')[0];
      }

      const res = await axios.get('http://localhost:4000/api/v1/analytics/sales', {
        params: { startDate, endDate },
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-Restaurant-ID': restaurantId || ''
        },
      });
      
      setAnalytics(res.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRealTimeMetrics = async () => {
    try {
      const token = localStorage.getItem('owner_token');
      const restaurantId = localStorage.getItem('owner_restaurant_id');
      const res = await axios.get('http://localhost:4000/api/v1/analytics/real-time', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-Restaurant-ID': restaurantId || ''
        },
      });
      
      setRealTimeMetrics(res.data);
    } catch (error) {
      console.error('Failed to load real-time metrics:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">Real-time insights and performance metrics</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setTimeRange('today')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                timeRange === 'today' ? 'bg-orange-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeRange('week')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                timeRange === 'week' ? 'bg-orange-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                timeRange === 'month' ? 'bg-orange-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Month
            </button>
          </div>
        </div>

        {/* Real-time Metrics */}
        {realTimeMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-2">Today's Revenue</div>
              <div className="text-3xl font-bold text-gray-900">
                ${realTimeMetrics.totalRevenue.toFixed(2)}
              </div>
              <div className="text-sm text-green-600 mt-2">
                {realTimeMetrics.paidOrders} paid orders
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-2">Active Orders</div>
              <div className="text-3xl font-bold text-gray-900">
                {realTimeMetrics.activeOrders}
              </div>
              <div className="text-sm text-blue-600 mt-2">
                {realTimeMetrics.activeTables} tables occupied
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-2">Waitlist</div>
              <div className="text-3xl font-bold text-gray-900">
                {realTimeMetrics.waitlistCount}
              </div>
              <div className="text-sm text-orange-600 mt-2">
                parties waiting
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-2">Avg Order Value</div>
              <div className="text-3xl font-bold text-gray-900">
                ${realTimeMetrics.averageOrderValue.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600 mt-2">
                per order
              </div>
            </div>
          </div>
        )}

        {/* Sales Analytics */}
        {analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Sales Summary</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Revenue</span>
                  <span className="text-2xl font-bold text-gray-900">
                    ${analytics.totalRevenue.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Orders</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {analytics.totalOrders}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Average Order Value</span>
                  <span className="text-2xl font-bold text-gray-900">
                    ${analytics.averageOrderValue.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Payment Methods</h2>
              <div className="space-y-3">
                {analytics.paymentMethods.map((pm) => (
                  <div key={pm.method} className="flex justify-between items-center">
                    <span className="text-gray-600">{pm.method}</span>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        ${pm.totalAmount.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">{pm.count} transactions</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Hourly Sales Chart */}
        {analytics && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Sales by Hour</h2>
            <div className="flex items-end gap-2 h-48">
              {analytics.salesByHour.map((amount, hour) => (
                <div
                  key={hour}
                  className="flex-1 bg-orange-500 rounded-t"
                  style={{
                    height: `${Math.max((amount / (Math.max(...analytics.salesByHour) || 1)) * 100, 5)}%`,
                  }}
                  title={`${hour}:00 - $${amount.toFixed(2)}`}
                >
                  <div className="text-xs text-white text-center pt-1">
                    {hour % 3 === 0 ? hour : ''}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-600">
              <span>12 AM</span>
              <span>6 AM</span>
              <span>12 PM</span>
              <span>6 PM</span>
              <span>11 PM</span>
            </div>
          </div>
        )}

        {/* Sales by Day */}
        {analytics && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Sales by Day</h2>
            <div className="space-y-3">
              {analytics.salesByDay.map((day) => (
                <div key={day.day} className="flex items-center gap-4">
                  <div className="w-24 text-gray-600">{day.day}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-orange-500 h-4 rounded-full"
                      style={{
                        width: `${Math.max((day.amount / (Math.max(...analytics.salesByDay.map(d => d.amount)) || 1)) * 100, 5)}%`,
                      }}
                    />
                  </div>
                  <div className="w-24 text-right font-semibold text-gray-900">
                    ${day.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
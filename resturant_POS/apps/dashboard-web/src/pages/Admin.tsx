import { useState, useEffect } from 'react';

interface SystemStatus {
  api: boolean;
  database: boolean;
  websocket: boolean;
}

interface OverviewStats {
  totalOrders: number;
  activeTables: number;
  totalRevenue: number;
  activeStaff: number;
  lowStockItems: number;
  pendingReservations: number;
}

export default function Admin() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    api: true,
    database: true,
    websocket: true,
  });
  const [stats, setStats] = useState<OverviewStats>({
    totalOrders: 0,
    activeTables: 0,
    totalRevenue: 0,
    activeStaff: 0,
    lowStockItems: 0,
    pendingReservations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSystemStats();
    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSystemStats = async () => {
    try {
      const API_BASE = 'http://localhost:4000';
      
      // Load multiple stats in parallel
      const [ordersRes, tablesRes, staffRes, inventoryRes, reservationsRes] = await Promise.all([
        fetch(`${API_BASE}/analytics/real-time`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch(`${API_BASE}/tables`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch(`${API_BASE}/staff`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch(`${API_BASE}/inventory/ingredients/low-stock`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch(`${API_BASE}/reservations?status=CONFIRMED`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        }),
      ]);

      const realTimeData = ordersRes.ok ? await ordersRes.json() : {};
      const tablesData = tablesRes.ok ? await tablesRes.json() : [];
      const staffData = staffRes.ok ? await staffRes.json() : [];
      const inventoryData = inventoryRes.ok ? await inventoryRes.json() : [];
      const reservationsData = reservationsRes.ok ? await reservationsRes.json() : [];

      setStats({
        totalOrders: realTimeData.totalOrders || 0,
        activeTables: tablesData.filter((t: any) => t.status === 'OCCUPIED').length,
        totalRevenue: realTimeData.totalRevenue || 0,
        activeStaff: staffData.filter((s: any) => s.isActive).length,
        lowStockItems: inventoryData.length,
        pendingReservations: reservationsData.length,
      });
    } catch (error) {
      console.error('Failed to load system stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkSystemHealth = async () => {
    try {
      const API_BASE = 'http://localhost:4000';
      const res = await fetch(`${API_BASE}/health`);
      setSystemStatus({
        api: res.ok,
        database: res.ok,
        websocket: true, // Simplified check
      });
    } catch (error) {
      setSystemStatus({
        api: false,
        database: false,
        websocket: false,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-1">System overview and administrative controls</p>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${systemStatus.api ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-gray-700">API Server</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${systemStatus.database ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-gray-700">Database</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${systemStatus.websocket ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-gray-700">WebSocket</span>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Today's Orders</div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalOrders}</div>
            <div className="text-sm text-gray-500 mt-2">Total orders today</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Today's Revenue</div>
            <div className="text-3xl font-bold text-green-600">
              ${stats.totalRevenue.toFixed(2)}
            </div>
            <div className="text-sm text-gray-500 mt-2">Total revenue today</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Active Tables</div>
            <div className="text-3xl font-bold text-blue-600">{stats.activeTables}</div>
            <div className="text-sm text-gray-500 mt-2">Currently occupied</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Active Staff</div>
            <div className="text-3xl font-bold text-purple-600">{stats.activeStaff}</div>
            <div className="text-sm text-gray-500 mt-2">Currently working</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Low Stock Alerts</div>
            <div className="text-3xl font-bold text-orange-600">{stats.lowStockItems}</div>
            <div className="text-sm text-gray-500 mt-2">Items need restocking</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Pending Reservations</div>
            <div className="text-3xl font-bold text-teal-600">{stats.pendingReservations}</div>
            <div className="text-sm text-gray-500 mt-2">Awaiting confirmation</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
              <div className="text-2xl">📊</div>
              <div className="text-left">
                <div className="font-medium text-gray-900">View Analytics</div>
                <div className="text-sm text-gray-500">Sales and performance</div>
              </div>
            </button>
            <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
              <div className="text-2xl">👥</div>
              <div className="text-left">
                <div className="font-medium text-gray-900">Manage Staff</div>
                <div className="text-sm text-gray-500">Team and permissions</div>
              </div>
            </button>
            <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
              <div className="text-2xl">📦</div>
              <div className="text-left">
                <div className="font-medium text-gray-900">Inventory</div>
                <div className="text-sm text-gray-500">Stock and recipes</div>
              </div>
            </button>
            <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
              <div className="text-2xl">⚙️</div>
              <div className="text-left">
                <div className="font-medium text-gray-900">Settings</div>
                <div className="text-sm text-gray-500">Configuration</div>
              </div>
            </button>
          </div>
        </div>

        {/* System Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">System Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Environment</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div>API Version: 1.0.0</div>
                <div>Database: PostgreSQL (Neon)</div>
                <div>Environment: Development</div>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Features</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div>✓ Real-time Analytics</div>
                <div>✓ WebSocket Support</div>
                <div>✓ Inventory Management</div>
                <div>✓ Reservations System</div>
                <div>✓ Staff Management</div>
                <div>✓ Customer Loyalty</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
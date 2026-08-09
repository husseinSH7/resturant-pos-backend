import { useState, useEffect } from 'react';
import { Smartphone, Monitor, Tablet, Clock, Wifi, WifiOff, MoreVertical, Edit2, Trash2, AlertTriangle } from 'lucide-react';

interface Device {
  id: string;
  deviceId: string;
  name: string;
  type: 'POS' | 'KDS' | 'MANAGER_TABLET';
  status: 'ONLINE' | 'OFFLINE';
  lastSeen: string;
  ipAddress: string;
  isActive: boolean;
  registeredAt: string;
  currentStaff?: string;
}

export default function Devices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'POS' | 'KDS' | 'MANAGER_TABLET'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ONLINE' | 'OFFLINE'>('ALL');

  useEffect(() => {
    // Mock data - replace with actual API calls
    setTimeout(() => {
      setDevices([
        {
          id: '1',
          deviceId: 'POS-001',
          name: 'Main Counter POS',
          type: 'POS',
          status: 'ONLINE',
          lastSeen: new Date().toISOString(),
          ipAddress: '192.168.1.101',
          isActive: true,
          registeredAt: '2024-01-01',
          currentStaff: 'John Smith',
        },
        {
          id: '2',
          deviceId: 'POS-002',
          name: 'Bar POS',
          type: 'POS',
          status: 'ONLINE',
          lastSeen: new Date(Date.now() - 300000).toISOString(),
          ipAddress: '192.168.1.102',
          isActive: true,
          registeredAt: '2024-01-05',
          currentStaff: 'Sarah Johnson',
        },
        {
          id: '3',
          deviceId: 'KDS-001',
          name: 'Kitchen Display 1',
          type: 'KDS',
          status: 'ONLINE',
          lastSeen: new Date(Date.now() - 120000).toISOString(),
          ipAddress: '192.168.1.103',
          isActive: true,
          registeredAt: '2024-01-01',
        },
        {
          id: '4',
          deviceId: 'KDS-002',
          name: 'Kitchen Display 2',
          type: 'KDS',
          status: 'OFFLINE',
          lastSeen: new Date(Date.now() - 3600000).toISOString(),
          ipAddress: '192.168.1.104',
          isActive: true,
          registeredAt: '2024-01-10',
        },
        {
          id: '5',
          deviceId: 'MGR-001',
          name: 'Manager Tablet',
          type: 'MANAGER_TABLET',
          status: 'ONLINE',
          lastSeen: new Date(Date.now() - 60000).toISOString(),
          ipAddress: '192.168.1.105',
          isActive: true,
          registeredAt: '2024-01-15',
          currentStaff: 'Mike Williams',
        },
        {
          id: '6',
          deviceId: 'POS-003',
          name: 'Backup POS',
          type: 'POS',
          status: 'OFFLINE',
          lastSeen: new Date(Date.now() - 86400000).toISOString(),
          ipAddress: '192.168.1.106',
          isActive: false,
          registeredAt: '2024-01-20',
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredDevices = devices.filter(device => {
    const typeMatch = filterType === 'ALL' || device.type === filterType;
    const statusMatch = filterStatus === 'ALL' || device.status === filterStatus;
    return typeMatch && statusMatch;
  });

  const handleToggleActive = (id: string) => {
    setDevices(devices.map(device =>
      device.id === id ? { ...device, isActive: !device.isActive } : device
    ));
  };

  const handleDeleteDevice = (id: string) => {
    if (confirm('Are you sure you want to delete this device?')) {
      setDevices(devices.filter(device => device.id !== id));
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'POS': return <Smartphone className="h-5 w-5" />;
      case 'KDS': return <Monitor className="h-5 w-5" />;
      case 'MANAGER_TABLET': return <Tablet className="h-5 w-5" />;
      default: return <Smartphone className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'POS': return 'bg-blue-100 text-blue-700';
      case 'KDS': return 'bg-green-100 text-green-700';
      case 'MANAGER_TABLET': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Device Management</h1>
        <button className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors">
          <Smartphone className="h-5 w-5" />
          <span>Register Device</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Devices" value={devices.length} icon={<Smartphone className="h-5 w-5" />} />
        <StatCard label="Online" value={devices.filter(d => d.status === 'ONLINE').length} icon={<Wifi className="h-5 w-5" />} color="green" />
        <StatCard label="Offline" value={devices.filter(d => d.status === 'OFFLINE').length} icon={<WifiOff className="h-5 w-5" />} color="red" />
        <StatCard label="Active" value={devices.filter(d => d.isActive).length} icon={<Monitor className="h-5 w-5" />} color="blue" />
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Device Type</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="ALL">All Types</option>
            <option value="POS">POS</option>
            <option value="KDS">KDS</option>
            <option value="MANAGER_TABLET">Manager Tablet</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="ALL">All Status</option>
            <option value="ONLINE">Online</option>
            <option value="OFFLINE">Offline</option>
          </select>
        </div>
      </div>

      {/* Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDevices.map((device) => (
          <DeviceCard
            key={device.id}
            device={device}
            onToggleActive={() => handleToggleActive(device.id)}
            onDelete={() => handleDeleteDevice(device.id)}
            getTypeIcon={getTypeIcon}
            getTypeColor={getTypeColor}
            getTimeSince={getTimeSince}
          />
        ))}
      </div>
    </div>
  );
}

function DeviceCard({ device, onToggleActive, onDelete, getTypeIcon, getTypeColor, getTimeSince }: {
  device: Device;
  onToggleActive: () => void;
  onDelete: () => void;
  getTypeIcon: (type: string) => React.ReactNode;
  getTypeColor: (type: string) => string;
  getTimeSince: (date: string) => string;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-lg ${getTypeColor(device.type)}`}>
            {getTypeIcon(device.type)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{device.name}</h3>
            <p className="text-sm text-gray-500 font-mono">{device.deviceId}</p>
          </div>
        </div>
        <div className="flex space-x-1">
          <button
            onClick={onToggleActive}
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
            title={device.isActive ? 'Deactivate' : 'Activate'}
          >
            {device.isActive ? <Monitor className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Type</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(device.type)}`}>
            {device.type.replace('_', ' ')}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Status</span>
          <div className="flex items-center">
            {device.status === 'ONLINE' ? (
              <Wifi className="h-4 w-4 mr-1 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 mr-1 text-red-600" />
            )}
            <span className={`font-medium ${device.status === 'ONLINE' ? 'text-green-600' : 'text-red-600'}`}>
              {device.status}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">IP Address</span>
          <span className="font-mono text-gray-900">{device.ipAddress}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Active</span>
          <button
            onClick={onToggleActive}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              device.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {device.isActive ? 'Yes' : 'No'}
          </button>
        </div>
      </div>

      <div className="border-t pt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            Last Seen
          </span>
          <span className="font-medium text-gray-900">{getTimeSince(device.lastSeen)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Registered</span>
          <span className="font-medium text-gray-900">{device.registeredAt}</span>
        </div>
        {device.currentStaff && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Current Staff</span>
            <span className="font-medium text-gray-900">{device.currentStaff}</span>
          </div>
        )}
      </div>

      {!device.isActive && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
            <span className="text-sm text-yellow-800">Device is inactive</span>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color = 'orange' }: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color?: string;
}) {
  const colorClasses = {
    orange: 'bg-orange-100 text-orange-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    blue: 'bg-blue-100 text-blue-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-2 ${colorClasses[color as keyof typeof colorClasses]} rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

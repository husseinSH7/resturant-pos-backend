import { useState, useEffect } from 'react'
import { Smartphone, Monitor, Tablet, Clock, Wifi, WifiOff, Trash2, AlertTriangle } from 'lucide-react'
import { api } from '../services/api'

interface Device {
  id: string
  deviceId: string
  name: string
  type: 'POS' | 'KDS' | 'MANAGER_TABLET'
  status: 'ONLINE' | 'OFFLINE'
  lastSeen: string
  ipAddress: string
  isActive: boolean
  registeredAt: string
  currentStaff?: string
}

export default function Devices() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadDevices() }, [])

  const loadDevices = async () => {
    try {
      const res = await api.get('/devices')
      setDevices(res.data)
    } catch (error) { console.error(error) } finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this device?')) return
    try {
      await api.delete(`/devices/${id}`)
      setDevices(devices.filter(d => d.id !== id))
    } catch (error) { alert('Delete failed') }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'POS': return <Smartphone className="h-5 w-5" />
      case 'KDS': return <Monitor className="h-5 w-5" />
      case 'MANAGER_TABLET': return <Tablet className="h-5 w-5" />
      default: return <Smartphone className="h-5 w-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'POS': return 'bg-blue-100 text-blue-700'
      case 'KDS': return 'bg-green-100 text-green-700'
      case 'MANAGER_TABLET': return 'bg-purple-100 text-purple-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getTimeSince = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Device Management</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor and manage all connected devices</p>
        </div>
        <button className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition">
          <Smartphone className="h-5 w-5" /> Register Device
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Devices" value={devices.length} icon={<Smartphone className="h-5 w-5" />} color="orange" />
        <StatCard label="Online" value={devices.filter(d => d.status === 'ONLINE').length} icon={<Wifi className="h-5 w-5" />} color="green" />
        <StatCard label="Offline" value={devices.filter(d => d.status === 'OFFLINE').length} icon={<WifiOff className="h-5 w-5" />} color="red" />
        <StatCard label="Active" value={devices.filter(d => d.isActive).length} icon={<Monitor className="h-5 w-5" />} color="blue" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map(device => (
          <div key={device.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${getTypeColor(device.type)}`}>
                  {getTypeIcon(device.type)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{device.name}</h3>
                  <p className="text-sm text-gray-500 font-mono">{device.deviceId}</p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(device.id)}
                className="p-1.5 text-gray-400 hover:text-red-600 transition"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Type</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(device.type)}`}>
                  {device.type.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <div className="flex items-center gap-1">
                  {device.status === 'ONLINE' ? (
                    <Wifi className="h-4 w-4 text-green-600" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`font-medium ${device.status === 'ONLINE' ? 'text-green-600' : 'text-red-600'}`}>
                    {device.status}
                  </span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">IP</span>
                <span className="font-mono text-gray-900">{device.ipAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Active</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  device.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {device.isActive ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 flex items-center gap-1">
                  <Clock className="h-4 w-4" /> Last Seen
                </span>
                <span className="font-medium">{getTimeSince(device.lastSeen)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Registered</span>
                <span className="font-medium">{device.registeredAt}</span>
              </div>
              {device.currentStaff && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Staff</span>
                  <span className="font-medium">{device.currentStaff}</span>
                </div>
              )}
            </div>

            {!device.isActive && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">Device is inactive</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color }: any) {
  const colorClasses: any = {
    orange: 'bg-orange-100 text-orange-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    blue: 'bg-blue-100 text-blue-600',
  }
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-2 ${colorClasses[color]} rounded-lg`}>{icon}</div>
      </div>
    </div>
  )
}
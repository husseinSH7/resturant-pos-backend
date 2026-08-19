import { useState, useEffect } from 'react'
import { Smartphone, Monitor, Tablet, Clock, Wifi, WifiOff, Trash2, AlertTriangle, Cpu, Server, Plus } from 'lucide-react'
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
      default: return <Cpu className="h-5 w-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'POS': return 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-700 dark:text-blue-400'
      case 'KDS': return 'bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 text-green-700 dark:text-green-400'
      case 'MANAGER_TABLET': return 'bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 text-purple-700 dark:text-purple-400'
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
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          <div className="absolute top-0 left-0 animate-ping rounded-full h-12 w-12 border-2 border-orange-400 opacity-20"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Device Management</h1>
          <p className="text-sm text-gray-500 mt-2">Monitor and manage all connected devices</p>
        </div>
        <button className="flex items-center gap-2 bg-linear-to-r from-orange-500 to-orange-600 text-white px-5 py-2.5 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 hover:scale-105 shadow-lg shadow-orange-500/30">
          <Plus className="h-5 w-5" /> Register Device
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Total Devices" value={devices.length} icon={<Server className="h-5 w-5" />} color="orange" />
        <StatCard label="Online" value={devices.filter(d => d.status === 'ONLINE').length} icon={<Wifi className="h-5 w-5" />} color="green" />
        <StatCard label="Offline" value={devices.filter(d => d.status === 'OFFLINE').length} icon={<WifiOff className="h-5 w-5" />} color="red" />
        <StatCard label="Active" value={devices.filter(d => d.isActive).length} icon={<Cpu className="h-5 w-5" />} color="blue" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map(device => (
          <div key={device.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${getTypeColor(device.type)}`}>
                  {getTypeIcon(device.type)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{device.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{device.deviceId}</p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(device.id)}
                className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">Type</span>
                <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${getTypeColor(device.type)}`}>
                  {device.type.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">Status</span>
                <div className="flex items-center gap-2">
                  {device.status === 'ONLINE' ? (
                    <div className="flex items-center gap-1.5 bg-green-100 dark:bg-green-900/30 px-3 py-1.5 rounded-lg">
                      <Wifi className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="font-semibold text-green-700 dark:text-green-400">ONLINE</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 bg-red-100 dark:bg-red-900/30 px-3 py-1.5 rounded-lg">
                      <WifiOff className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <span className="font-semibold text-red-700 dark:text-red-400">OFFLINE</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">IP</span>
                <span className="font-mono font-medium text-gray-900 dark:text-white">{device.ipAddress}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">Active</span>
                <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  device.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {device.isActive ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Last Seen
                </span>
                <span className="font-medium text-gray-900 dark:text-white">{getTimeSince(device.lastSeen)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">Registered</span>
                <span className="font-medium text-gray-900 dark:text-white">{device.registeredAt}</span>
              </div>
              {device.currentStaff && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">Staff</span>
                  <span className="font-medium text-gray-900 dark:text-white">{device.currentStaff}</span>
                </div>
              )}
            </div>

            {!device.isActive && (
              <div className="mt-5 bg-linear-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Device is inactive</span>
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
    orange: 'bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 text-orange-600 dark:text-orange-400',
    green: 'bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 text-green-600 dark:text-green-400',
    red: 'bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 text-red-600 dark:text-red-400',
    blue: 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-600 dark:text-blue-400',
  }
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>{icon}</div>
      </div>
    </div>
  )
}
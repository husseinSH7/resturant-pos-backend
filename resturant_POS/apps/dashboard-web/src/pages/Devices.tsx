import { useState, useEffect, useCallback } from 'react'
import { 
  Smartphone, Monitor, Tablet, Clock, Wifi, WifiOff, Trash2, AlertTriangle, 
  Cpu, Server, Plus, Printer, Edit2, X, Loader2, RefreshCw
} from 'lucide-react'
import { api } from '../services/api'

interface Device {
  id: string
  deviceId: string
  name: string
  type: 'POS' | 'KDS' | 'MANAGER_TABLET' | 'PRINTER'
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
  const [error, setError] = useState('')

  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [editingDevice, setEditingDevice] = useState<Device | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'POS' as Device['type'],
    deviceId: '',
    ipAddress: '',
  })

  const loadDevices = useCallback(async () => {
    try {
      setError('')
      const res = await api.get('/devices')
      setDevices(res.data)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load devices')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDevices()
  }, [loadDevices])

  // CRUD
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    try {
      if (editingDevice) {
        const res = await api.put(`/devices/${editingDevice.id}`, formData)
        setDevices(prev => prev.map(d => d.id === editingDevice.id ? { ...d, ...res.data } : d))
      } else {
        const res = await api.post('/devices', formData)
        setDevices(prev => [...prev, res.data])
      }
      setShowModal(false)
      resetForm()
      loadDevices()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Save failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this device?')) return
    setDeletingId(id)
    try {
      await api.delete(`/devices/${id}`)
      setDevices(prev => prev.filter(d => d.id !== id))
      loadDevices()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  const handleTestPrint = async (id: string) => {
    setTestingId(id)
    try {
      await api.post(`/devices/${id}/test-print`)
      alert('Test print sent successfully!')
    } catch (err: any) {
      alert('Test print failed: ' + (err?.response?.data?.message || err.message))
    } finally {
      setTestingId(null)
    }
  }

  const resetForm = () => {
    setFormData({ name: '', type: 'POS', deviceId: '', ipAddress: '' })
    setEditingDevice(null)
    setError('')
  }

  const openModal = (device?: Device) => {
    if (device) {
      setEditingDevice(device)
      setFormData({
        name: device.name,
        type: device.type,
        deviceId: device.deviceId,
        ipAddress: device.ipAddress,
      })
    } else {
      resetForm()
    }
    setShowModal(true)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'POS': return <Smartphone className="h-5 w-5" />
      case 'KDS': return <Monitor className="h-5 w-5" />
      case 'MANAGER_TABLET': return <Tablet className="h-5 w-5" />
      case 'PRINTER': return <Printer className="h-5 w-5" />
      default: return <Cpu className="h-5 w-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'POS': return 'bg-blue-900/30 text-blue-400 border-blue-700'
      case 'KDS': return 'bg-green-900/30 text-green-400 border-green-700'
      case 'MANAGER_TABLET': return 'bg-purple-900/30 text-purple-400 border-purple-700'
      case 'PRINTER': return 'bg-gray-700 text-gray-300 border-gray-600'
      default: return 'bg-gray-700 text-gray-300'
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Device Management</h1>
          <p className="text-sm text-gray-400 mt-1">Monitor and manage all connected devices</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-linear-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-orange-700 transition shadow-lg shadow-orange-500/30"
        >
          <Plus className="h-5 w-5" /> Register Device
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Devices" value={devices.length} icon={<Server className="h-5 w-5" />} color="orange" />
        <StatCard label="Online" value={devices.filter(d => d.status === 'ONLINE').length} icon={<Wifi className="h-5 w-5" />} color="green" />
        <StatCard label="Offline" value={devices.filter(d => d.status === 'OFFLINE').length} icon={<WifiOff className="h-5 w-5" />} color="red" />
        <StatCard label="Active" value={devices.filter(d => d.isActive).length} icon={<Cpu className="h-5 w-5" />} color="blue" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map(device => (
          <div key={device.id} className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl border ${getTypeColor(device.type)}`}>
                  {getTypeIcon(device.type)}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{device.name}</h3>
                  <p className="text-sm text-gray-400 font-mono">{device.deviceId}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => openModal(device)}
                  className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-900/30 rounded-lg transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(device.id)}
                  disabled={deletingId === device.id}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                >
                  {deletingId === device.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Type</span>
                <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${getTypeColor(device.type)}`}>
                  {device.type.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Status</span>
                <div className="flex items-center gap-2">
                  {device.status === 'ONLINE' ? (
                    <div className="flex items-center gap-1.5 bg-green-900/30 px-3 py-1.5 rounded-lg">
                      <Wifi className="h-4 w-4 text-green-400" />
                      <span className="font-semibold text-green-400">ONLINE</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 bg-red-900/30 px-3 py-1.5 rounded-lg">
                      <WifiOff className="h-4 w-4 text-red-400" />
                      <span className="font-semibold text-red-400">OFFLINE</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">IP</span>
                <span className="font-mono font-medium text-white">{device.ipAddress}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Active</span>
                <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  device.isActive ? 'bg-green-900/30 text-green-400' : 'bg-gray-700 text-gray-400'
                }`}>
                  {device.isActive ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Last Seen
                </span>
                <span className="font-medium text-white">{getTimeSince(device.lastSeen)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Registered</span>
                <span className="font-medium text-white">{device.registeredAt}</span>
              </div>
              {device.currentStaff && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Staff</span>
                  <span className="font-medium text-white">{device.currentStaff}</span>
                </div>
              )}
              {device.type === 'PRINTER' && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Test Print</span>
                  <button
                    onClick={() => handleTestPrint(device.id)}
                    disabled={testingId === device.id || device.status !== 'ONLINE'}
                    className="text-sm bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 px-3 py-1.5 rounded-lg flex items-center gap-1 disabled:opacity-50 transition"
                  >
                    {testingId === device.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Test
                  </button>
                </div>
              )}
            </div>

            {!device.isActive && (
              <div className="mt-5 bg-yellow-900/20 border border-yellow-700 rounded-xl p-4 flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-medium text-yellow-300">Device is inactive</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">
                {editingDevice ? 'Edit Device' : 'Register Device'}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm() }} className="p-1 hover:bg-gray-700 rounded-lg">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Name *</label>
                  <input
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as Device['type'] })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white"
                  >
                    <option value="POS">POS</option>
                    <option value="KDS">KDS</option>
                    <option value="MANAGER_TABLET">Manager Tablet</option>
                    <option value="PRINTER">Printer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Device ID *</label>
                  <input
                    value={formData.deviceId}
                    onChange={e => setFormData({ ...formData, deviceId: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">IP Address</label>
                  <input
                    value={formData.ipAddress}
                    onChange={e => setFormData({ ...formData, ipAddress: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white"
                    placeholder="192.168.1.100"
                  />
                </div>
              </div>
              {error && <div className="mt-3 text-sm text-red-400">{error}</div>}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm() }}
                  className="flex-1 px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 text-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-linear-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 flex items-center justify-center gap-2 disabled:opacity-50 transition"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isSubmitting ? 'Saving...' : (editingDevice ? 'Update' : 'Register')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon, color }: any) {
  const colorClasses: any = {
    orange: 'bg-orange-900/30 text-orange-400',
    green: 'bg-green-900/30 text-green-400',
    red: 'bg-red-900/30 text-red-400',
    blue: 'bg-blue-900/30 text-blue-400',
  }
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color] || 'bg-gray-700 text-gray-400'}`}>{icon}</div>
      </div>
    </div>
  )
}
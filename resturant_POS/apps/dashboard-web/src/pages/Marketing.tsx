import { useState, useEffect, useCallback } from 'react'
import { Plus, Send, Mail, MessageSquare, TrendingUp, Calendar, Edit2, Trash2, Megaphone, Target, BarChart3, Loader2, X } from 'lucide-react'
import { api } from '../services/api'

interface Campaign {
  id: string
  name: string
  type: 'EMAIL' | 'SMS'
  status: 'DRAFT' | 'SCHEDULED' | 'SENT' | 'PAUSED'
  subject?: string
  message: string
  targetAudience: string
  targetCount: number
  scheduledDate?: string
  sentDate?: string
  openRate?: number
  clickRate?: number
  createdAt: string
}

export default function Marketing() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'EMAIL' as 'EMAIL' | 'SMS',
    subject: '',
    message: '',
    targetAudience: 'ALL',
    scheduledDate: '',
  })

  const loadData = useCallback(async () => {
    try {
      setError('')
      const res = await api.get('/marketing/campaigns')
      setCampaigns(res.data)
    } catch (err: any) {
      console.error(err)
      setError(err?.response?.data?.message || 'Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    try {
      const payload = {
        ...formData,
        scheduledDate: formData.scheduledDate || undefined,
      }
      if (editingCampaign) {
        const res = await api.put(`/marketing/campaigns/${editingCampaign.id}`, payload)
        setCampaigns(prev => prev.map(c => c.id === editingCampaign.id ? { ...c, ...res.data } : c))
      } else {
        const res = await api.post('/marketing/campaigns', payload)
        setCampaigns(prev => [...prev, { ...res.data, targetCount: res.data.targetCount || 0 }])
      }
      setShowModal(false)
      resetForm()
      loadData() // background sync
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Save failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this campaign?')) return
    setDeletingId(id)
    try {
      await api.delete(`/marketing/campaigns/${id}`)
      setCampaigns(prev => prev.filter(c => c.id !== id))
      loadData()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSend = async (id: string) => {
    setSendingId(id)
    try {
      const res = await api.post(`/marketing/campaigns/${id}/send`)
      setCampaigns(prev => prev.map(c => c.id === id ? { ...c, ...res.data } : c))
      loadData()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Send failed')
    } finally {
      setSendingId(null)
    }
  }

  const resetForm = () => {
    setFormData({ name: '', type: 'EMAIL', subject: '', message: '', targetAudience: 'ALL', scheduledDate: '' })
    setEditingCampaign(null)
    setError('')
  }

  const openModal = (campaign?: Campaign) => {
    if (campaign) {
      setEditingCampaign(campaign)
      setFormData({
        name: campaign.name,
        type: campaign.type,
        subject: campaign.subject || '',
        message: campaign.message,
        targetAudience: campaign.targetAudience,
        scheduledDate: campaign.scheduledDate ? new Date(campaign.scheduledDate).toISOString().slice(0, 16) : '',
      })
    } else {
      resetForm()
    }
    setShowModal(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SENT': return 'bg-green-900/30 text-green-400 border-green-700'
      case 'SCHEDULED': return 'bg-blue-900/30 text-blue-400 border-blue-700'
      case 'DRAFT': return 'bg-gray-700 text-gray-300 border-gray-600'
      case 'PAUSED': return 'bg-yellow-900/30 text-yellow-400 border-yellow-700'
      default: return 'bg-gray-700 text-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SENT': return <Send className="h-3 w-3" />
      case 'SCHEDULED': return <Calendar className="h-3 w-3" />
      case 'DRAFT': return <Edit2 className="h-3 w-3" />
      case 'PAUSED': return <TrendingUp className="h-3 w-3" />
      default: return <Megaphone className="h-3 w-3" />
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Marketing Campaigns</h1>
          <p className="text-sm text-gray-400 mt-1">Create and manage email and SMS campaigns</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-linear-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-orange-700 transition shadow-lg shadow-orange-500/30"
        >
          <Plus className="h-5 w-5" /> Create Campaign
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Campaigns" value={campaigns.length} icon={<Megaphone className="h-5 w-5" />} color="orange" />
        <StatCard label="Sent" value={campaigns.filter(c => c.status === 'SENT').length} icon={<Send className="h-5 w-5" />} color="green" />
        <StatCard label="Scheduled" value={campaigns.filter(c => c.status === 'SCHEDULED').length} icon={<Calendar className="h-5 w-5" />} color="blue" />
        <StatCard label="Avg Open Rate" value={`${Math.round(campaigns.filter(c => c.openRate).reduce((sum, c) => sum + (c.openRate || 0), 0) / (campaigns.filter(c => c.openRate).length || 1))}%`} icon={<BarChart3 className="h-5 w-5" />} color="purple" />
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Campaign</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Target</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Open Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {campaigns.map(c => (
                <tr key={c.id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-900/30 rounded-lg">
                        <Megaphone className="h-4 w-4 text-purple-400" />
                      </div>
                      <div>
                        <div className="font-semibold text-white">{c.name}</div>
                        {c.subject && <div className="text-sm text-gray-400">{c.subject}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {c.type === 'EMAIL' ? <Mail className="h-4 w-4 text-blue-400" /> : <MessageSquare className="h-4 w-4 text-green-400" />}
                      <span className="text-sm font-medium text-white">{c.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border ${getStatusColor(c.status)}`}>
                      {getStatusIcon(c.status)}
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 flex items-center gap-2">
                    <Target className="h-4 w-4 text-gray-500" />
                    {c.targetCount} customers
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-bold">{c.openRate ? `${c.openRate}%` : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap space-x-2">
                    {c.status === 'DRAFT' && (
                      <button
                        onClick={() => handleSend(c.id)}
                        disabled={sendingId === c.id}
                        className="p-2 text-green-400 hover:text-green-300 hover:bg-green-900/30 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {sendingId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </button>
                    )}
                    <button
                      onClick={() => openModal(c)}
                      className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 rounded-lg transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={deletingId === c.id}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {deletingId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </td>
                </tr>
              ))}
              {campaigns.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    No campaigns yet. Create your first one!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">
                {editingCampaign ? 'Edit Campaign' : 'Create Campaign'}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm() }} className="p-1 hover:bg-gray-700 rounded-lg">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Campaign Name</label>
                  <input
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
                    <select
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value as 'EMAIL' | 'SMS' })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white"
                    >
                      <option value="EMAIL">Email</option>
                      <option value="SMS">SMS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Target Audience</label>
                    <select
                      value={formData.targetAudience}
                      onChange={e => setFormData({ ...formData, targetAudience: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white"
                    >
                      <option value="ALL">All Customers</option>
                      <option value="LOYALTY_TIER">Loyalty Tier</option>
                      <option value="RECENT_CUSTOMERS">Recent Customers</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                </div>
                {formData.type === 'EMAIL' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Subject</label>
                    <input
                      value={formData.subject}
                      onChange={e => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Message</label>
                  <textarea
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Schedule (optional)</label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledDate}
                    onChange={e => setFormData({ ...formData, scheduledDate: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white"
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
                  {isSubmitting ? 'Saving...' : (editingCampaign ? 'Update' : 'Create')}
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
  const colors: any = {
    orange: 'bg-orange-900/30 text-orange-400',
    green: 'bg-green-900/30 text-green-400',
    blue: 'bg-blue-900/30 text-blue-400',
    purple: 'bg-purple-900/30 text-purple-400',
  }
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 hover:shadow-lg transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${colors[color] || 'bg-gray-700 text-gray-400'}`}>{icon}</div>
      </div>
    </div>
  )
}
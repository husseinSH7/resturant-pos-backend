import { useState, useEffect } from 'react'
import { Plus, Send, Mail, MessageSquare, TrendingUp, Calendar, Edit2, Trash2, Megaphone, Target, BarChart3 } from 'lucide-react'
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
  const [showModal, setShowModal] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const res = await api.get('/marketing/campaigns')
      setCampaigns(res.data)
    } catch (error) { console.error(error) } finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this campaign?')) return
    try {
      await api.delete(`/marketing/campaigns/${id}`)
      setCampaigns(campaigns.filter(c => c.id !== id))
    } catch (error) { alert('Delete failed') }
  }

  const handleSend = async (id: string) => {
    try {
      await api.post(`/marketing/campaigns/${id}/send`)
      setCampaigns(campaigns.map(c => c.id === id ? { ...c, status: 'SENT' as const, sentDate: new Date().toISOString().split('T')[0] } : c))
    } catch (error) { alert('Send failed') }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SENT': return 'bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 text-green-700 dark:text-green-400'
      case 'SCHEDULED': return 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-700 dark:text-blue-400'
      case 'DRAFT': return 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300'
      case 'PAUSED': return 'bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30 text-yellow-700 dark:text-yellow-400'
      default: return 'bg-gray-100 text-gray-700'
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

  if (loading) return <div className="flex justify-center p-12"><div className="relative"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div><div className="absolute top-0 left-0 animate-ping rounded-full h-12 w-12 border-2 border-orange-400 opacity-20"></div></div></div>

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Marketing Campaigns</h1>
          <p className="text-sm text-gray-500 mt-2">Create and manage email and SMS campaigns</p>
        </div>
        <button onClick={() => { setEditingCampaign(null); setShowModal(true) }} className="flex items-center gap-2 bg-linear-to-r from-orange-500 to-orange-600 text-white px-5 py-2.5 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 hover:scale-105 shadow-lg shadow-orange-500/30">
          <Plus className="h-5 w-5" /> Create Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Total Campaigns" value={campaigns.length} icon={<Megaphone className="h-5 w-5" />} color="orange" />
        <StatCard label="Sent" value={campaigns.filter(c => c.status === 'SENT').length} icon={<Send className="h-5 w-5" />} color="green" />
        <StatCard label="Scheduled" value={campaigns.filter(c => c.status === 'SCHEDULED').length} icon={<Calendar className="h-5 w-5" />} color="blue" />
        <StatCard label="Avg Open Rate" value={`${campaigns.filter(c => c.openRate).reduce((sum, c) => sum + (c.openRate || 0), 0) / campaigns.filter(c => c.openRate).length || 0}%`} icon={<BarChart3 className="h-5 w-5" />} color="purple" />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Campaign</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Target</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Open Rate</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {campaigns.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-linear-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg">
                        <Megaphone className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">{c.name}</div>
                        {c.subject && <div className="text-sm text-gray-500 dark:text-gray-400">{c.subject}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {c.type === 'EMAIL' ? <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" /> : <MessageSquare className="h-4 w-4 text-green-600 dark:text-green-400" />}
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{c.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full ${getStatusColor(c.status)}`}>
                      {getStatusIcon(c.status)}
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium flex items-center gap-2">
                    <Target className="h-4 w-4 text-gray-400" />
                    {c.targetCount} customers
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-bold">{c.openRate ? `${c.openRate}%` : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    {c.status === 'DRAFT' && (
                      <button onClick={() => handleSend(c.id)} className="p-2 text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors">
                        <Send className="h-4 w-4" />
                      </button>
                    )}
                    <button onClick={() => { setEditingCampaign(c); setShowModal(true) }} className="p-2 text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="p-2 text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto transform transition-all">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">{editingCampaign ? 'Edit Campaign' : 'Create Campaign'}</h2>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const form = e.target as HTMLFormElement
              const data = { name: (form.elements.namedItem('name') as HTMLInputElement).value, type: (form.elements.namedItem('type') as HTMLSelectElement).value, subject: (form.elements.namedItem('subject') as HTMLInputElement)?.value || '', message: (form.elements.namedItem('message') as HTMLTextAreaElement).value, targetAudience: (form.elements.namedItem('target') as HTMLSelectElement).value }
              try {
                if (editingCampaign) {
                  const res = await api.put(`/marketing/campaigns/${editingCampaign.id}`, data)
                  setCampaigns(campaigns.map(c => c.id === editingCampaign.id ? { ...c, ...res.data } : c))
                } else {
                  const res = await api.post('/marketing/campaigns', data)
                  setCampaigns([...campaigns, res.data])
                }
                setShowModal(false)
              } catch (error) { alert('Save failed') }
            }}>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Campaign Name</label>
                  <input name="name" defaultValue={editingCampaign?.name || ''} className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 transition-all duration-200" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
                    <select name="type" defaultValue={editingCampaign?.type || 'EMAIL'} className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 transition-all duration-200">
                      <option>EMAIL</option><option>SMS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Audience</label>
                    <select name="target" defaultValue={editingCampaign?.targetAudience || 'ALL'} className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 transition-all duration-200">
                      <option>ALL</option><option>LOYALTY_TIER</option><option>RECENT_CUSTOMERS</option><option>INACTIVE</option>
                    </select>
                  </div>
                </div>
                {(!editingCampaign || editingCampaign.type === 'EMAIL') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject</label>
                    <input name="subject" defaultValue={editingCampaign?.subject || ''} className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 transition-all duration-200" />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Message</label>
                  <textarea name="message" rows={4} defaultValue={editingCampaign?.message || ''} className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 transition-all duration-200" required />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-linear-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200">{editingCampaign ? 'Update' : 'Create'}</button>
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
    orange: 'bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 text-orange-600 dark:text-orange-400',
    green: 'bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 text-green-600 dark:text-green-400',
    blue: 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-600 dark:text-blue-400',
    purple: 'bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 text-purple-600 dark:text-purple-400' 
  }
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div><p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p><p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p></div>
        <div className={`p-3 rounded-xl ${colors[color] || 'bg-gray-100 text-gray-600'}`}>{icon}</div>
      </div>
    </div>
  )
}
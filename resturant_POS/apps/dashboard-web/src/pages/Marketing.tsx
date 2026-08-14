import { useState, useEffect } from 'react'
import { Plus, Send, Mail, MessageSquare, TrendingUp, Calendar, Edit2, Trash2 } from 'lucide-react'
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
      case 'SENT': return 'bg-green-100 text-green-700'
      case 'SCHEDULED': return 'bg-blue-100 text-blue-700'
      case 'DRAFT': return 'bg-gray-100 text-gray-700'
      case 'PAUSED': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketing Campaigns</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage email and SMS campaigns</p>
        </div>
        <button onClick={() => { setEditingCampaign(null); setShowModal(true) }} className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition">
          <Plus className="h-5 w-5" /> Create Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Campaigns" value={campaigns.length} icon={<Mail className="h-5 w-5" />} color="orange" />
        <StatCard label="Sent" value={campaigns.filter(c => c.status === 'SENT').length} icon={<Send className="h-5 w-5" />} color="green" />
        <StatCard label="Scheduled" value={campaigns.filter(c => c.status === 'SCHEDULED').length} icon={<Calendar className="h-5 w-5" />} color="blue" />
        <StatCard label="Avg Open Rate" value={`${campaigns.filter(c => c.openRate).reduce((sum, c) => sum + (c.openRate || 0), 0) / campaigns.filter(c => c.openRate).length || 0}%`} icon={<TrendingUp className="h-5 w-5" />} color="purple" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Open Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {campaigns.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{c.name}</div>
                    {c.subject && <div className="text-sm text-gray-500">{c.subject}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {c.type === 'EMAIL' ? <Mail className="h-4 w-4 text-blue-600" /> : <MessageSquare className="h-4 w-4 text-green-600" />}
                      <span className="text-sm">{c.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(c.status)}`}>{c.status}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{c.targetCount} customers</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{c.openRate ? `${c.openRate}%` : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    {c.status === 'DRAFT' && <button onClick={() => handleSend(c.id)} className="text-green-600 hover:text-green-800"><Send className="h-4 w-4 inline" /></button>}
                    <button onClick={() => { setEditingCampaign(c); setShowModal(true) }} className="text-blue-600 hover:text-blue-800"><Edit2 className="h-4 w-4 inline" /></button>
                    <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:text-red-800"><Trash2 className="h-4 w-4 inline" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingCampaign ? 'Edit Campaign' : 'Create Campaign'}</h2>
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
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700">Campaign Name</label><input name="name" defaultValue={editingCampaign?.name || ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" required /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700">Type</label><select name="type" defaultValue={editingCampaign?.type || 'EMAIL'} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"><option>EMAIL</option><option>SMS</option></select></div>
                  <div><label className="block text-sm font-medium text-gray-700">Target Audience</label><select name="target" defaultValue={editingCampaign?.targetAudience || 'ALL'} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"><option>ALL</option><option>LOYALTY_TIER</option><option>RECENT_CUSTOMERS</option><option>INACTIVE</option></select></div>
                </div>
                {(!editingCampaign || editingCampaign.type === 'EMAIL') && <div><label className="block text-sm font-medium text-gray-700">Subject</label><input name="subject" defaultValue={editingCampaign?.subject || ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" /></div>}
                <div><label className="block text-sm font-medium text-gray-700">Message</label><textarea name="message" rows={4} defaultValue={editingCampaign?.message || ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" required /></div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">{editingCampaign ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon, color }: any) {
  const colors: any = { orange: 'bg-orange-100 text-orange-600', green: 'bg-green-100 text-green-600', blue: 'bg-blue-100 text-blue-600', purple: 'bg-purple-100 text-purple-600' }
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center justify-between">
        <div><p className="text-sm font-medium text-gray-500">{label}</p><p className="text-2xl font-bold text-gray-900 mt-1">{value}</p></div>
        <div className={`p-2 ${colors[color] || 'bg-gray-100 text-gray-600'} rounded-lg`}>{icon}</div>
      </div>
    </div>
  )
}
import { useState, useEffect } from 'react';
import { Plus, Send, Mail, MessageSquare, Users, TrendingUp, Calendar, Clock, Target, Edit2, Trash2 } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  type: 'EMAIL' | 'SMS';
  status: 'DRAFT' | 'SCHEDULED' | 'SENT' | 'PAUSED';
  subject?: string;
  message: string;
  targetAudience: 'ALL' | 'LOYALTY_TIER' | 'RECENT_CUSTOMERS' | 'INACTIVE';
  targetCount: number;
  scheduledDate?: string;
  sentDate?: string;
  openRate?: number;
  clickRate?: number;
  createdAt: string;
}

interface CustomerSegment {
  id: string;
  name: string;
  count: number;
  description: string;
}

export default function Marketing() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    // Mock data - replace with actual API calls
    setTimeout(() => {
      setCampaigns([
        {
          id: '1',
          name: 'Holiday Special Offer',
          type: 'EMAIL',
          status: 'SENT',
          subject: '20% Off Your Next Visit!',
          message: 'Dear customer, enjoy 20% off your next visit. Use code HOLIDAY20.',
          targetAudience: 'ALL',
          targetCount: 245,
          sentDate: '2024-01-10',
          openRate: 45.2,
          clickRate: 12.8,
          createdAt: '2024-01-08',
        },
        {
          id: '2',
          name: 'Loyalty Bonus',
          type: 'SMS',
          status: 'SENT',
          message: 'Double points on your next visit! Valid this weekend only.',
          targetAudience: 'LOYALTY_TIER',
          targetCount: 85,
          sentDate: '2024-01-12',
          openRate: 68.5,
          clickRate: 25.3,
          createdAt: '2024-01-11',
        },
        {
          id: '3',
          name: 'Birthday Special',
          type: 'EMAIL',
          status: 'SCHEDULED',
          subject: 'Happy Birthday! 🎂',
          message: 'Celebrate with us! Get a free dessert on your birthday.',
          targetAudience: 'RECENT_CUSTOMERS',
          targetCount: 42,
          scheduledDate: '2024-01-20',
          createdAt: '2024-01-15',
        },
        {
          id: '4',
          name: 'We Miss You',
          type: 'SMS',
          status: 'DRAFT',
          message: 'We haven\'t seen you in a while! Come back for 15% off.',
          targetAudience: 'INACTIVE',
          targetCount: 128,
          createdAt: '2024-01-16',
        },
      ]);

      setSegments([
        { id: '1', name: 'All Customers', count: 245, description: 'All registered customers' },
        { id: '2', name: 'Gold & Platinum Members', count: 45, description: 'High-value loyalty members' },
        { id: '3', name: 'Recent Visitors (30 days)', count: 89, description: 'Customers who visited in last 30 days' },
        { id: '4', name: 'Inactive Customers (90+ days)', count: 128, description: 'Customers who haven\'t visited recently' },
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  const handleCreateCampaign = () => {
    setEditingCampaign(null);
    setShowCreateModal(true);
  };

  const handleEditCampaign = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setShowCreateModal(true);
  };

  const handleDeleteCampaign = (id: string) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      setCampaigns(campaigns.filter(c => c.id !== id));
    }
  };

  const handleSendCampaign = (id: string) => {
    setCampaigns(campaigns.map(c =>
      c.id === id ? { ...c, status: 'SENT' as const, sentDate: new Date().toISOString().split('T')[0] } : c
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SENT': return 'bg-green-100 text-green-700';
      case 'SCHEDULED': return 'bg-blue-100 text-blue-700';
      case 'DRAFT': return 'bg-gray-100 text-gray-700';
      case 'PAUSED': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Marketing Campaigns</h1>
        <button
          onClick={handleCreateCampaign}
          className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Create Campaign</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Campaigns" value={campaigns.length} icon={<Mail className="h-5 w-5" />} />
        <StatCard label="Sent" value={campaigns.filter(c => c.status === 'SENT').length} icon={<Send className="h-5 w-5" />} color="green" />
        <StatCard label="Scheduled" value={campaigns.filter(c => c.status === 'SCHEDULED').length} icon={<Calendar className="h-5 w-5" />} color="blue" />
        <StatCard label="Avg Open Rate" value={`${campaigns.filter(c => c.openRate).reduce((sum, c) => sum + (c.openRate || 0), 0) / campaigns.filter(c => c.openRate).length || 0}%`} icon={<TrendingUp className="h-5 w-5" />} color="purple" />
      </div>

      {/* Customer Segments */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Segments</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {segments.map((segment) => (
            <div key={segment.id} className="border rounded-lg p-4 hover:border-orange-500 transition-colors cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-5 w-5 text-orange-600" />
                <span className="text-2xl font-bold text-gray-900">{segment.count}</span>
              </div>
              <h3 className="font-medium text-gray-900">{segment.name}</h3>
              <p className="text-sm text-gray-500">{segment.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Campaigns List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Open Rate</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {campaigns.map((campaign) => (
              <tr key={campaign.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                    {campaign.subject && (
                      <div className="text-sm text-gray-500">{campaign.subject}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {campaign.type === 'EMAIL' ? (
                      <Mail className="h-4 w-4 mr-2 text-blue-600" />
                    ) : (
                      <MessageSquare className="h-4 w-4 mr-2 text-green-600" />
                    )}
                    <span className="text-sm text-gray-900">{campaign.type}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(campaign.status)}`}>
                    {campaign.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {campaign.targetCount} customers
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {campaign.openRate ? `${campaign.openRate}%` : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {campaign.sentDate || campaign.scheduledDate || campaign.createdAt}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                  {campaign.status === 'DRAFT' || campaign.status === 'PAUSED' ? (
                    <button
                      onClick={() => handleSendCampaign(campaign.id)}
                      className="text-green-600 hover:text-green-800 font-medium"
                    >
                      <Send className="h-4 w-4 inline" />
                    </button>
                  ) : null}
                  <button
                    onClick={() => handleEditCampaign(campaign)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    <Edit2 className="h-4 w-4 inline" />
                  </button>
                  <button
                    onClick={() => handleDeleteCampaign(campaign.id)}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    <Trash2 className="h-4 w-4 inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showCreateModal && (
        <CampaignModal
          campaign={editingCampaign}
          segments={segments}
          onClose={() => setShowCreateModal(false)}
          onSave={(campaignData) => {
            if (editingCampaign) {
              setCampaigns(campaigns.map(c =>
                c.id === editingCampaign.id ? { ...c, ...campaignData } : c
              ));
            } else {
              const newCampaign: Campaign = {
                id: Date.now().toString(),
                ...campaignData,
                status: 'DRAFT',
                targetCount: segments.find(s => s.name === campaignData.targetAudience)?.count || 0,
                createdAt: new Date().toISOString().split('T')[0],
              } as Campaign;
              setCampaigns([...campaigns, newCampaign]);
            }
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color = 'orange' }: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
}) {
  const colorClasses = {
    orange: 'bg-orange-100 text-orange-600',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
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

function CampaignModal({ campaign, segments, onClose, onSave }: {
  campaign: Campaign | null;
  segments: CustomerSegment[];
  onClose: () => void;
  onSave: (data: Partial<Campaign>) => void;
}) {
  const [formData, setFormData] = useState({
    name: campaign?.name || '',
    type: campaign?.type || 'EMAIL',
    subject: campaign?.subject || '',
    message: campaign?.message || '',
    targetAudience: campaign?.targetAudience || 'ALL',
    scheduledDate: campaign?.scheduledDate || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {campaign ? 'Edit Campaign' : 'Create Campaign'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="EMAIL">Email</option>
                  <option value="SMS">SMS</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                <select
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  {segments.map(segment => (
                    <option key={segment.id} value={segment.name.toUpperCase().replace(' ', '_')}>
                      {segment.name} ({segment.count})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {formData.type === 'EMAIL' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Line</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Schedule (Optional)</label>
              <input
                type="datetime-local"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                {campaign ? 'Save Changes' : 'Create Campaign'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

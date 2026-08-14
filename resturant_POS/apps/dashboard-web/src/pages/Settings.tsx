import { useState, useEffect } from 'react'
import { Save, Clock } from 'lucide-react'
import { api } from '../services/api'

interface Settings {
  restaurantName: string
  restaurantAddress: string
  restaurantPhone: string
  restaurantEmail: string
  website: string
  taxRate: number
  currency: string
  receiptHeader: string
  receiptFooter: string
  printerType: string
  printerIpAddress: string
  operatingHours: {
    monday: { open: string; close: string; closed: boolean }
    tuesday: { open: string; close: string; closed: boolean }
    wednesday: { open: string; close: string; closed: boolean }
    thursday: { open: string; close: string; closed: boolean }
    friday: { open: string; close: string; closed: boolean }
    saturday: { open: string; close: string; closed: boolean }
    sunday: { open: string; close: string; closed: boolean }
  }
}

export default function Settings() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'general' | 'tax' | 'receipt' | 'printer' | 'hours'>('general')

  useEffect(() => { loadSettings() }, [])

  const loadSettings = async () => {
    try {
      const res = await api.get('/settings')
      setSettings(res.data)
    } catch (error) { console.error(error) } finally { setLoading(false) }
  }

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    try {
      await api.put('/settings', settings)
      alert('Settings saved!')
    } catch (error) { alert('Save failed') } finally { setSaving(false) }
  }

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div></div>
  if (!settings) return <div className="text-center p-12 text-gray-500">No settings found</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your restaurant configuration</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition disabled:opacity-50">
          <Save className="h-5 w-5" /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {['general', 'tax', 'receipt', 'printer', 'hours'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`py-4 px-1 border-b-2 font-medium text-sm transition ${activeTab === tab ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {activeTab === 'general' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">General Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700">Restaurant Name</label><input value={settings.restaurantName} onChange={e => setSettings({ ...settings, restaurantName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700">Phone</label><input value={settings.restaurantPhone} onChange={e => setSettings({ ...settings, restaurantPhone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" /></div>
              <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700">Address</label><input value={settings.restaurantAddress} onChange={e => setSettings({ ...settings, restaurantAddress: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700">Email</label><input value={settings.restaurantEmail} onChange={e => setSettings({ ...settings, restaurantEmail: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700">Website</label><input value={settings.website} onChange={e => setSettings({ ...settings, website: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" /></div>
            </div>
          </div>
        )}

        {activeTab === 'tax' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Tax & Currency</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700">Tax Rate (%)</label><input type="number" step="0.1" value={settings.taxRate} onChange={e => setSettings({ ...settings, taxRate: parseFloat(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700">Currency</label><select value={settings.currency} onChange={e => setSettings({ ...settings, currency: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"><option>USD</option><option>EUR</option><option>GBP</option><option>CAD</option><option>AUD</option></select></div>
            </div>
          </div>
        )}

        {activeTab === 'receipt' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Receipt Settings</h2>
            <div><label className="block text-sm font-medium text-gray-700">Header</label><textarea rows={2} value={settings.receiptHeader} onChange={e => setSettings({ ...settings, receiptHeader: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700">Footer</label><textarea rows={2} value={settings.receiptFooter} onChange={e => setSettings({ ...settings, receiptFooter: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" /></div>
          </div>
        )}

        {activeTab === 'printer' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Printer Settings</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700">Printer Type</label><select value={settings.printerType} onChange={e => setSettings({ ...settings, printerType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"><option>thermal</option><option>inkjet</option><option>laser</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700">IP Address</label><input value={settings.printerIpAddress} onChange={e => setSettings({ ...settings, printerIpAddress: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" placeholder="192.168.1.100" /></div>
            </div>
          </div>
        )}

        {activeTab === 'hours' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Operating Hours</h2>
            {Object.entries(settings.operatingHours).map(([day, hours]) => (
              <div key={day} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-24 font-medium capitalize text-gray-900">{day}</div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <input type="time" value={hours.open} disabled={hours.closed} onChange={e => setSettings({ ...settings, operatingHours: { ...settings.operatingHours, [day]: { ...hours, open: e.target.value } } })} className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-50" />
                  <span className="text-gray-500">to</span>
                  <input type="time" value={hours.close} disabled={hours.closed} onChange={e => setSettings({ ...settings, operatingHours: { ...settings.operatingHours, [day]: { ...hours, close: e.target.value } } })} className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-50" />
                </div>
                <label className="flex items-center gap-2 ml-2"><input type="checkbox" checked={hours.closed} onChange={e => setSettings({ ...settings, operatingHours: { ...settings.operatingHours, [day]: { ...hours, closed: e.target.checked } } })} className="rounded" /> Closed</label>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
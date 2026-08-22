import { useState, useEffect } from 'react'
import { Save, Clock, Building2, Mail, DollarSign, Printer, Calendar, Loader2 } from 'lucide-react'
import { api } from '../services/api'

interface DayHours {
  open: string
  close: string
  closed: boolean
}

interface Settings {
  restaurantName: string
  restaurantAddress: string
  restaurantPhone: string
  restaurantEmail: string
  website: string
  taxRate: number
  taxIncluded: boolean
  currency: string
  locale: string
  receiptHeader: string
  receiptFooter: string
  receiptShowCustomerInfo: boolean
  receiptShowServerInfo: boolean
  enableGratuity: boolean
  gratuityRates: any[]
  roundTo: string
  printerType: string
  printerIpAddress: string
  operatingHours: {
    [key: string]: DayHours
  }
}

const defaultOperatingHours: Settings['operatingHours'] = {
  monday: { open: '09:00', close: '22:00', closed: false },
  tuesday: { open: '09:00', close: '22:00', closed: false },
  wednesday: { open: '09:00', close: '22:00', closed: false },
  thursday: { open: '09:00', close: '22:00', closed: false },
  friday: { open: '09:00', close: '22:00', closed: false },
  saturday: { open: '09:00', close: '22:00', closed: false },
  sunday: { open: '09:00', close: '22:00', closed: false },
}

export default function Settings() {
  const [settings, setSettings] = useState<Settings>({
    restaurantName: '',
    restaurantAddress: '',
    restaurantPhone: '',
    restaurantEmail: '',
    website: '',
    taxRate: 8,
    taxIncluded: false,
    currency: 'USD',
    locale: 'en-US',
    receiptHeader: '',
    receiptFooter: '',
    receiptShowCustomerInfo: true,
    receiptShowServerInfo: true,
    enableGratuity: false,
    gratuityRates: [],
    roundTo: 'NONE',
    printerType: 'thermal',
    printerIpAddress: '',
    operatingHours: defaultOperatingHours,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState<'general' | 'tax' | 'receipt' | 'printer' | 'hours'>('general')

  useEffect(() => { loadSettings() }, [])

  const loadSettings = async () => {
    try {
      setError('')
      const res = await api.get('/settings')
      const data = res.data

      setSettings({
        restaurantName: data.restaurantName || '',
        restaurantAddress: data.restaurantAddress || '',
        restaurantPhone: data.restaurantPhone || '',
        restaurantEmail: data.restaurantEmail || '',
        website: data.website || '',
        taxRate: data.taxRate !== undefined ? data.taxRate : 8,
        taxIncluded: data.taxIncluded ?? false,
        currency: data.currency || 'USD',
        locale: data.locale || 'en-US',
        receiptHeader: data.receiptHeader || '',
        receiptFooter: data.receiptFooter || '',
        receiptShowCustomerInfo: data.receiptShowCustomerInfo ?? true,
        receiptShowServerInfo: data.receiptShowServerInfo ?? true,
        enableGratuity: data.enableGratuity ?? false,
        gratuityRates: data.gratuityRates || [],
        roundTo: data.roundTo || 'NONE',
        printerType: data.printerType || 'thermal',
        printerIpAddress: data.printerIpAddress || '',
        operatingHours: data.operatingHours || defaultOperatingHours,
      })
    } catch (err: any) {
      console.error('Failed to load settings', err)
      setError('Could not load settings. Using defaults.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await api.put('/settings', settings)
      setSuccess('Settings saved successfully!')
      // Refresh settings after save
      await loadSettings()
    } catch (err: any) {
      const message = err?.response?.data?.message || err.message || 'Save failed'
      setError('Save failed: ' + message)
    } finally {
      setSaving(false)
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
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-sm text-gray-400 mt-1">Manage your restaurant configuration</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-linear-to-r from-orange-500 to-orange-600 text-white px-5 py-2.5 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:hover:scale-100"
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-900/30 border border-green-700 text-green-400 px-4 py-3 rounded-xl">
          {success}
        </div>
      )}

      <div className="border-b border-gray-700">
        <nav className="flex gap-6 overflow-x-auto">
          {['general', 'tax', 'receipt', 'printer', 'hours'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                activeTab === tab
                  ? 'border-orange-500 text-orange-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:shadow-lg transition-shadow duration-300">
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-900/30 rounded-lg">
                <Building2 className="h-5 w-5 text-orange-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">General Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Restaurant Name</label>
                <input
                  value={settings.restaurantName}
                  onChange={(e) => setSettings({ ...settings, restaurantName: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                <input
                  value={settings.restaurantPhone}
                  onChange={(e) => setSettings({ ...settings, restaurantPhone: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white transition-all duration-200"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
                <input
                  value={settings.restaurantAddress}
                  onChange={(e) => setSettings({ ...settings, restaurantAddress: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  value={settings.restaurantEmail}
                  onChange={(e) => setSettings({ ...settings, restaurantEmail: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Website</label>
                <input
                  value={settings.website}
                  onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white transition-all duration-200"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tax' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-900/30 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Tax & Currency</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.taxRate}
                  onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Currency</label>
                <select
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white transition-all duration-200"
                >
                  <option>USD</option>
                  <option>EUR</option>
                  <option>GBP</option>
                  <option>CAD</option>
                  <option>AUD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Locale</label>
                <select
                  value={settings.locale}
                  onChange={(e) => setSettings({ ...settings, locale: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white transition-all duration-200"
                >
                  <option>en-US</option>
                  <option>en-GB</option>
                  <option>fr-FR</option>
                  <option>de-DE</option>
                  <option>es-ES</option>
                </select>
              </div>
              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  checked={settings.taxIncluded}
                  onChange={(e) => setSettings({ ...settings, taxIncluded: e.target.checked })}
                  className="rounded text-orange-600 focus:ring-orange-500 bg-gray-700 border-gray-600"
                />
                <label className="text-sm font-medium text-gray-300">Tax included in price</label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'receipt' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-900/30 rounded-lg">
                <Mail className="h-5 w-5 text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Receipt Settings</h2>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Header</label>
                <textarea
                  rows={3}
                  value={settings.receiptHeader}
                  onChange={(e) => setSettings({ ...settings, receiptHeader: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white transition-all duration-200"
                  placeholder="Welcome to our restaurant!"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Footer</label>
                <textarea
                  rows={3}
                  value={settings.receiptFooter}
                  onChange={(e) => setSettings({ ...settings, receiptFooter: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white transition-all duration-200"
                  placeholder="Thank you for dining with us!"
                />
              </div>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.receiptShowCustomerInfo}
                    onChange={(e) => setSettings({ ...settings, receiptShowCustomerInfo: e.target.checked })}
                    className="rounded text-orange-600 focus:ring-orange-500 bg-gray-700 border-gray-600"
                  />
                  <label className="text-sm font-medium text-gray-300">Show Customer Info</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.receiptShowServerInfo}
                    onChange={(e) => setSettings({ ...settings, receiptShowServerInfo: e.target.checked })}
                    className="rounded text-orange-600 focus:ring-orange-500 bg-gray-700 border-gray-600"
                  />
                  <label className="text-sm font-medium text-gray-300">Show Server Info</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.enableGratuity}
                    onChange={(e) => setSettings({ ...settings, enableGratuity: e.target.checked })}
                    className="rounded text-orange-600 focus:ring-orange-500 bg-gray-700 border-gray-600"
                  />
                  <label className="text-sm font-medium text-gray-300">Enable Gratuity</label>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'printer' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-900/30 rounded-lg">
                <Printer className="h-5 w-5 text-purple-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Printer Settings</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Printer Type</label>
                <select
                  value={settings.printerType}
                  onChange={(e) => setSettings({ ...settings, printerType: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white transition-all duration-200"
                >
                  <option>thermal</option>
                  <option>inkjet</option>
                  <option>laser</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">IP Address</label>
                <input
                  value={settings.printerIpAddress}
                  onChange={(e) => setSettings({ ...settings, printerIpAddress: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white transition-all duration-200"
                  placeholder="192.168.1.100"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hours' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-900/30 rounded-lg">
                <Calendar className="h-5 w-5 text-yellow-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Operating Hours</h2>
            </div>
            <div className="space-y-3">
              {Object.entries(settings.operatingHours).map(([day, hours]) => (
                <div key={day} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-gray-700/50 rounded-lg">
                  <div className="w-28 font-semibold capitalize text-white">{day}</div>
                  <div className="flex flex-wrap items-center gap-3 flex-1">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <input
                      type="time"
                      value={hours.open}
                      disabled={hours.closed}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          operatingHours: {
                            ...settings.operatingHours,
                            [day]: { ...hours, open: e.target.value },
                          },
                        })
                      }
                      className="px-4 py-2 bg-gray-600 border border-gray-500 rounded-lg disabled:opacity-50 text-white transition-all duration-200"
                    />
                    <span className="text-gray-400">to</span>
                    <input
                      type="time"
                      value={hours.close}
                      disabled={hours.closed}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          operatingHours: {
                            ...settings.operatingHours,
                            [day]: { ...hours, close: e.target.value },
                          },
                        })
                      }
                      className="px-4 py-2 bg-gray-600 border border-gray-500 rounded-lg disabled:opacity-50 text-white transition-all duration-200"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hours.closed}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          operatingHours: {
                            ...settings.operatingHours,
                            [day]: { ...hours, closed: e.target.checked },
                          },
                        })
                      }
                      className="rounded text-orange-600 focus:ring-orange-500 bg-gray-600 border-gray-500"
                    />
                    <span className="text-sm text-gray-400">Closed</span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
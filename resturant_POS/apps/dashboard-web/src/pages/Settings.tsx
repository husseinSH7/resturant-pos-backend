import { useState, useEffect } from 'react';
import { Save, Printer, DollarSign, Clock, Building2, Phone, MapPin, Globe } from 'lucide-react';

interface Settings {
  restaurantName: string;
  restaurantAddress: string;
  restaurantPhone: string;
  restaurantEmail: string;
  website: string;
  taxRate: number;
  currency: string;
  receiptHeader: string;
  receiptFooter: string;
  printerType: string;
  printerIpAddress: string;
  operatingHours: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  };
}

export default function Settings() {
  const [settings, setSettings] = useState<Settings>({
    restaurantName: '',
    restaurantAddress: '',
    restaurantPhone: '',
    restaurantEmail: '',
    website: '',
    taxRate: 8,
    currency: 'USD',
    receiptHeader: 'Thank you for dining with us!',
    receiptFooter: 'Please visit us again soon.',
    printerType: 'thermal',
    printerIpAddress: '',
    operatingHours: {
      monday: { open: '09:00', close: '22:00', closed: false },
      tuesday: { open: '09:00', close: '22:00', closed: false },
      wednesday: { open: '09:00', close: '22:00', closed: false },
      thursday: { open: '09:00', close: '22:00', closed: false },
      friday: { open: '09:00', close: '23:00', closed: false },
      saturday: { open: '10:00', close: '23:00', closed: false },
      sunday: { open: '10:00', close: '21:00', closed: false },
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'tax' | 'receipt' | 'printer' | 'hours'>('general');

  useEffect(() => {
    // Mock data - replace with actual API calls
    setTimeout(() => {
      setSettings({
        restaurantName: 'My Restaurant',
        restaurantAddress: '123 Main Street, City, State 12345',
        restaurantPhone: '(555) 123-4567',
        restaurantEmail: 'info@myrestaurant.com',
        website: 'https://myrestaurant.com',
        taxRate: 8.5,
        currency: 'USD',
        receiptHeader: 'Thank you for dining with us!',
        receiptFooter: 'Please visit us again soon.',
        printerType: 'thermal',
        printerIpAddress: '192.168.1.100',
        operatingHours: {
          monday: { open: '09:00', close: '22:00', closed: false },
          tuesday: { open: '09:00', close: '22:00', closed: false },
          wednesday: { open: '09:00', close: '22:00', closed: false },
          thursday: { open: '09:00', close: '22:00', closed: false },
          friday: { open: '09:00', close: '23:00', closed: false },
          saturday: { open: '10:00', close: '23:00', closed: false },
          sunday: { open: '10:00', close: '21:00', closed: false },
        },
      });
      setLoading(false);
    }, 1000);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      alert('Settings saved successfully!');
    }, 1000);
  };

  const handleOperatingHoursChange = (day: keyof Settings['operatingHours'], field: 'open' | 'close' | 'closed', value: string | boolean) => {
    setSettings({
      ...settings,
      operatingHours: {
        ...settings.operatingHours,
        [day]: {
          ...settings.operatingHours[day],
          [field]: value,
        },
      },
    });
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
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
        >
          <Save className="h-5 w-5" />
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'general', label: 'General' },
            { id: 'tax', label: 'Tax & Currency' },
            { id: 'receipt', label: 'Receipt' },
            { id: 'printer', label: 'Printer' },
            { id: 'hours', label: 'Operating Hours' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow p-6">
        {activeTab === 'general' && <GeneralSettings settings={settings} onChange={setSettings} />}
        {activeTab === 'tax' && <TaxSettings settings={settings} onChange={setSettings} />}
        {activeTab === 'receipt' && <ReceiptSettings settings={settings} onChange={setSettings} />}
        {activeTab === 'printer' && <PrinterSettings settings={settings} onChange={setSettings} />}
        {activeTab === 'hours' && <OperatingHoursSettings settings={settings} onChange={handleOperatingHoursChange} />}
      </div>
    </div>
  );
}

function GeneralSettings({ settings, onChange }: { settings: Settings; onChange: (settings: Settings) => void }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">General Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Restaurant Name
          </label>
          <input
            type="text"
            value={settings.restaurantName}
            onChange={(e) => onChange({ ...settings, restaurantName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            value={settings.restaurantPhone}
            onChange={(e) => onChange({ ...settings, restaurantPhone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <input
            type="text"
            value={settings.restaurantAddress}
            onChange={(e) => onChange({ ...settings, restaurantAddress: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={settings.restaurantEmail}
            onChange={(e) => onChange({ ...settings, restaurantEmail: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Website
          </label>
          <input
            type="url"
            value={settings.website}
            onChange={(e) => onChange({ ...settings, website: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}

function TaxSettings({ settings, onChange }: { settings: Settings; onChange: (settings: Settings) => void }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Tax & Currency Settings</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tax Rate (%)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="number"
              value={settings.taxRate}
              onChange={(e) => onChange({ ...settings, taxRate: parseFloat(e.target.value) })}
              step="0.1"
              min="0"
              max="30"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Currency
          </label>
          <select
            value={settings.currency}
            onChange={(e) => onChange({ ...settings, currency: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="CAD">CAD ($)</option>
            <option value="AUD">AUD ($)</option>
          </select>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Tax rate will be applied to all orders. Changes will affect new orders only.
        </p>
      </div>
    </div>
  );
}

function ReceiptSettings({ settings, onChange }: { settings: Settings; onChange: (settings: Settings) => void }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Receipt Customization</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Receipt Header
          </label>
          <textarea
            value={settings.receiptHeader}
            onChange={(e) => onChange({ ...settings, receiptHeader: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Text to appear at the top of receipts"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Receipt Footer
          </label>
          <textarea
            value={settings.receiptFooter}
            onChange={(e) => onChange({ ...settings, receiptFooter: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Text to appear at the bottom of receipts"
          />
        </div>
      </div>
      
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-2">Receipt Preview</h3>
        <div className="bg-white border rounded p-4 font-mono text-sm">
          <p className="text-center mb-2">{settings.restaurantName}</p>
          <p className="text-center mb-4 text-gray-600">{settings.receiptHeader}</p>
          <p className="border-t pt-2">Order #1234</p>
          <p>Item 1 x 2 - $20.00</p>
          <p>Item 2 x 1 - $15.00</p>
          <p className="border-t mt-2 pt-2">Subtotal: $35.00</p>
          <p>Tax ({settings.taxRate}%): ${(35 * settings.taxRate / 100).toFixed(2)}</p>
          <p className="font-bold">Total: ${(35 * (1 + settings.taxRate / 100)).toFixed(2)}</p>
          <p className="border-t mt-2 pt-2 text-center text-gray-600">{settings.receiptFooter}</p>
        </div>
      </div>
    </div>
  );
}

function PrinterSettings({ settings, onChange }: { settings: Settings; onChange: (settings: Settings) => void }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Printer Configuration</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Printer Type
          </label>
          <select
            value={settings.printerType}
            onChange={(e) => onChange({ ...settings, printerType: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="thermal">Thermal Printer</option>
            <option value="inkjet">Inkjet Printer</option>
            <option value="laser">Laser Printer</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Printer IP Address
          </label>
          <input
            type="text"
            value={settings.printerIpAddress}
            onChange={(e) => onChange({ ...settings, printerIpAddress: e.target.value })}
            placeholder="192.168.1.100"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Make sure your printer is connected to the same network as your POS system.
        </p>
      </div>
    </div>
  );
}

function OperatingHoursSettings({ settings, onChange }: { 
  settings: Settings; 
  onChange: (day: keyof Settings['operatingHours'], field: 'open' | 'close' | 'closed', value: string | boolean) => void;
}) {
  const days = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ] as const;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Operating Hours</h2>
      
      <div className="space-y-3">
        {days.map((day) => (
          <div key={day} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 capitalize">
                {day}
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <input
                type="time"
                value={settings.operatingHours[day].closed ? '' : settings.operatingHours[day].open}
                onChange={(e) => onChange(day, 'open', e.target.value)}
                disabled={settings.operatingHours[day].closed}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
              />
              <span className="text-gray-500">to</span>
              <input
                type="time"
                value={settings.operatingHours[day].closed ? '' : settings.operatingHours[day].close}
                onChange={(e) => onChange(day, 'close', e.target.value)}
                disabled={settings.operatingHours[day].closed}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
              />
            </div>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.operatingHours[day].closed}
                onChange={(e) => onChange(day, 'closed', e.target.checked)}
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <span className="text-sm text-gray-700">Closed</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

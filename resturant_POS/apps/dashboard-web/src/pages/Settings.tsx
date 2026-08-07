import { useState, useEffect } from 'react';
import axios from 'axios';

interface RestaurantSettings {
  id: string;
  name: string;
  slug: string;
  address?: string;
  phone?: string;
  isActive: boolean;
  tables: number;
  areas: number;
}

interface TaxSettings {
  taxRate: number;
  taxEnabled: boolean;
  taxIncluded: boolean;
}

interface ReceiptSettings {
  showLogo: boolean;
  showAddress: boolean;
  showPhone: boolean;
  showThankYou: boolean;
  customMessage: string;
  footerText: string;
}

export default function Settings() {
  const [restaurantSettings, setRestaurantSettings] = useState<RestaurantSettings | null>(null);
  const [taxSettings, setTaxSettings] = useState<TaxSettings | null>(null);
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'restaurant' | 'tax' | 'receipt'>('restaurant');

  const [editRestaurant, setEditRestaurant] = useState({
    name: '',
    address: '',
    phone: '',
    isActive: true,
  });

  const [editTax, setEditTax] = useState({
    taxRate: 0.08,
    taxEnabled: true,
    taxIncluded: false,
  });

  const [editReceipt, setEditReceipt] = useState({
    showLogo: true,
    showAddress: true,
    showPhone: true,
    showThankYou: true,
    customMessage: 'Thank you for dining with us!',
    footerText: 'Visit us again soon!',
  });

  useEffect(() => {
    loadSettings();
  }, [activeTab]);

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('owner_token');
      const restaurantId = localStorage.getItem('owner_restaurant_id');
      const headers = { 
        Authorization: `Bearer ${token}`,
        'X-Restaurant-ID': restaurantId || ''
      };
      
      if (activeTab === 'restaurant') {
        const res = await axios.get('http://localhost:4000/api/v1/settings/restaurant', { headers });
        setRestaurantSettings(res.data);
        setEditRestaurant({
          name: res.data.name,
          address: res.data.address || '',
          phone: res.data.phone || '',
          isActive: res.data.isActive,
        });
      } else if (activeTab === 'tax') {
        const res = await axios.get('http://localhost:4000/api/v1/settings/tax', { headers });
        setTaxSettings(res.data);
        setEditTax(res.data);
      } else if (activeTab === 'receipt') {
        const res = await axios.get('http://localhost:4000/api/v1/settings/receipt', { headers });
        setReceiptSettings(res.data);
        setEditReceipt(res.data);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveRestaurantSettings = async () => {
    try {
      const token = localStorage.getItem('owner_token');
      const restaurantId = localStorage.getItem('owner_restaurant_id');
      const res = await axios.put(
        'http://localhost:4000/api/v1/settings/restaurant',
        editRestaurant,
        { headers: { Authorization: `Bearer ${token}`, 'X-Restaurant-ID': restaurantId || '' } }
      );
      setRestaurantSettings(res.data);
      alert('Restaurant settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    }
  };

  const saveTaxSettings = async () => {
    try {
      const token = localStorage.getItem('owner_token');
      const restaurantId = localStorage.getItem('owner_restaurant_id');
      const res = await axios.put(
        'http://localhost:4000/api/v1/settings/tax',
        editTax,
        { headers: { Authorization: `Bearer ${token}`, 'X-Restaurant-ID': restaurantId || '' } }
      );
      setTaxSettings(res.data);
      alert('Tax settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    }
  };

  const saveReceiptSettings = async () => {
    try {
      const token = localStorage.getItem('owner_token');
      const restaurantId = localStorage.getItem('owner_restaurant_id');
      const res = await axios.put(
        'http://localhost:4000/api/v1/settings/receipt',
        editReceipt,
        { headers: { Authorization: `Bearer ${token}`, 'X-Restaurant-ID': restaurantId || '' } }
      );
      setReceiptSettings(res.data);
      alert('Receipt settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Configure your restaurant preferences</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('restaurant')}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              activeTab === 'restaurant'
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Restaurant
          </button>
          <button
            onClick={() => setActiveTab('tax')}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              activeTab === 'tax'
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Tax
          </button>
          <button
            onClick={() => setActiveTab('receipt')}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              activeTab === 'receipt'
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Receipt
          </button>
        </div>

        {/* Restaurant Settings */}
        {activeTab === 'restaurant' && restaurantSettings && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Restaurant Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Restaurant Name
                </label>
                <input
                  type="text"
                  value={editRestaurant.name}
                  onChange={(e) => setEditRestaurant({ ...editRestaurant, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={editRestaurant.address}
                  onChange={(e) => setEditRestaurant({ ...editRestaurant, address: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Enter address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={editRestaurant.phone}
                  onChange={(e) => setEditRestaurant({ ...editRestaurant, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Enter phone number"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editRestaurant.isActive}
                  onChange={(e) => setEditRestaurant({ ...editRestaurant, isActive: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Restaurant is active
                </label>
              </div>
              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>Tables: {restaurantSettings.tables}</div>
                  <div>Areas: {restaurantSettings.areas}</div>
                </div>
              </div>
            </div>
            <button
              onClick={saveRestaurantSettings}
              className="mt-6 bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition"
            >
              Save Changes
            </button>
          </div>
        )}

        {/* Tax Settings */}
        {activeTab === 'tax' && taxSettings && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Tax Configuration</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editTax.taxRate * 100}
                  onChange={(e) => setEditTax({ ...editTax, taxRate: parseFloat(e.target.value) / 100 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="taxEnabled"
                  checked={editTax.taxEnabled}
                  onChange={(e) => setEditTax({ ...editTax, taxEnabled: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="taxEnabled" className="text-sm text-gray-700">
                  Enable tax calculation
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="taxIncluded"
                  checked={editTax.taxIncluded}
                  onChange={(e) => setEditTax({ ...editTax, taxIncluded: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="taxIncluded" className="text-sm text-gray-700">
                  Tax is included in prices
                </label>
              </div>
            </div>
            <button
              onClick={saveTaxSettings}
              className="mt-6 bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition"
            >
              Save Changes
            </button>
          </div>
        )}

        {/* Receipt Settings */}
        {activeTab === 'receipt' && receiptSettings && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Receipt Configuration</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showLogo"
                  checked={editReceipt.showLogo}
                  onChange={(e) => setEditReceipt({ ...editReceipt, showLogo: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="showLogo" className="text-sm text-gray-700">
                  Show logo on receipt
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showAddress"
                  checked={editReceipt.showAddress}
                  onChange={(e) => setEditReceipt({ ...editReceipt, showAddress: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="showAddress" className="text-sm text-gray-700">
                  Show address on receipt
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showPhone"
                  checked={editReceipt.showPhone}
                  onChange={(e) => setEditReceipt({ ...editReceipt, showPhone: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="showPhone" className="text-sm text-gray-700">
                  Show phone on receipt
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showThankYou"
                  checked={editReceipt.showThankYou}
                  onChange={(e) => setEditReceipt({ ...editReceipt, showThankYou: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="showThankYou" className="text-sm text-gray-700">
                  Show thank you message
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Message
                </label>
                <textarea
                  value={editReceipt.customMessage}
                  onChange={(e) => setEditReceipt({ ...editReceipt, customMessage: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Footer Text
                </label>
                <input
                  type="text"
                  value={editReceipt.footerText}
                  onChange={(e) => setEditReceipt({ ...editReceipt, footerText: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
            <button
              onClick={saveReceiptSettings}
              className="mt-6 bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Search, Plus, Star, Gift, TrendingUp, Phone, Mail, Calendar, Award } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  points: number;
  totalSpent: number;
  visitCount: number;
  loyaltyTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  lastVisit: string;
  memberSince: string;
}

interface GiftCard {
  id: string;
  cardNumber: string;
  balance: number;
  customerName: string;
  issuedDate: string;
  expiryDate: string;
  transactions: {
    id: string;
    type: 'ISSUED' | 'RELOADED' | 'USED' | 'REFUNDED';
    amount: number;
    date: string;
    orderId?: string;
  }[];
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'customers' | 'giftcards'>('customers');
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showAddGiftCardModal, setShowAddGiftCardModal] = useState(false);
  const [showReloadModal, setShowReloadModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedGiftCard, setSelectedGiftCard] = useState<GiftCard | null>(null);

  useEffect(() => {
    // Mock data - replace with actual API calls
    setTimeout(() => {
      setCustomers([
        {
          id: '1',
          name: 'John Smith',
          email: 'john@example.com',
          phone: '(555) 123-4567',
          points: 1250,
          totalSpent: 2500,
          visitCount: 15,
          loyaltyTier: 'GOLD',
          lastVisit: '2024-01-15',
          memberSince: '2023-06-01',
        },
        {
          id: '2',
          name: 'Sarah Johnson',
          email: 'sarah@example.com',
          phone: '(555) 234-5678',
          points: 850,
          totalSpent: 1700,
          visitCount: 12,
          loyaltyTier: 'SILVER',
          lastVisit: '2024-01-14',
          memberSince: '2023-08-15',
        },
        {
          id: '3',
          name: 'Mike Williams',
          email: 'mike@example.com',
          phone: '(555) 345-6789',
          points: 3200,
          totalSpent: 6400,
          visitCount: 32,
          loyaltyTier: 'PLATINUM',
          lastVisit: '2024-01-16',
          memberSince: '2023-01-01',
        },
        {
          id: '4',
          name: 'Emma Davis',
          email: 'emma@example.com',
          phone: '(555) 456-7890',
          points: 250,
          totalSpent: 500,
          visitCount: 5,
          loyaltyTier: 'BRONZE',
          lastVisit: '2024-01-10',
          memberSince: '2023-12-01',
        },
      ]);

      setGiftCards([
        {
          id: '1',
          cardNumber: 'GC123456789',
          balance: 50,
          customerName: 'John Smith',
          issuedDate: '2024-01-01',
          expiryDate: '2025-01-01',
          transactions: [
            { id: '1', type: 'ISSUED', amount: 100, date: '2024-01-01' },
            { id: '2', type: 'USED', amount: 50, date: '2024-01-10', orderId: 'ORD-123' },
          ],
        },
        {
          id: '2',
          cardNumber: 'GC987654321',
          balance: 100,
          customerName: 'Sarah Johnson',
          issuedDate: '2023-12-15',
          expiryDate: '2024-12-15',
          transactions: [
            { id: '3', type: 'ISSUED', amount: 50, date: '2023-12-15' },
            { id: '4', type: 'RELOADED', amount: 50, date: '2024-01-05' },
          ],
        },
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  const filteredGiftCards = giftCards.filter(card =>
    card.cardNumber.includes(searchTerm) ||
    card.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'PLATINUM': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'GOLD': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'SILVER': return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'BRONZE': return 'bg-orange-100 text-orange-700 border-orange-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getTierPoints = (tier: string) => {
    switch (tier) {
      case 'PLATINUM': return 5000;
      case 'GOLD': return 2000;
      case 'SILVER': return 500;
      case 'BRONZE': return 0;
      default: return 0;
    }
  };

  const getTierProgress = (points: number, tier: string) => {
    const currentTierPoints = getTierPoints(tier);
    const nextTierPoints = tier === 'BRONZE' ? 500 : 
                          tier === 'SILVER' ? 2000 :
                          tier === 'GOLD' ? 5000 : 5000;
    return Math.min((points / nextTierPoints) * 100, 100);
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
        <h1 className="text-2xl font-bold text-gray-900">Customers & Loyalty</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddGiftCardModal(true)}
            className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Gift className="h-5 w-5" />
            <span>Gift Card</span>
          </button>
          <button
            onClick={() => setShowAddCustomerModal(true)}
            className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Customers" value={customers.length} icon={<Award className="h-5 w-5" />} />
        <StatCard label="Active Loyalty Members" value={customers.filter(c => c.points > 0).length} icon={<Star className="h-5 w-5" />} color="yellow" />
        <StatCard label="Gift Cards Issued" value={giftCards.length} icon={<Gift className="h-5 w-5" />} color="green" />
        <StatCard label="Total Points Awarded" value={customers.reduce((sum, c) => sum + c.points, 0)} icon={<TrendingUp className="h-5 w-5" />} color="blue" />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('customers')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'customers'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Customers
          </button>
          <button
            onClick={() => setActiveTab('giftcards')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'giftcards'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Gift Cards
          </button>
        </nav>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder={activeTab === 'customers' ? 'Search customers by name, email, or phone...' : 'Search gift cards by number or customer name...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      {/* Content */}
      {activeTab === 'customers' ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loyalty Tier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visits</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Visit</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                      <div className="text-sm text-gray-500">{customer.email}</div>
                      <div className="text-xs text-gray-400 flex items-center mt-1">
                        <Phone className="h-3 w-3 mr-1" />
                        {customer.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getTierColor(customer.loyaltyTier)}`}>
                      {customer.loyaltyTier}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{customer.points.toLocaleString()}</div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div 
                        className="bg-orange-600 h-1.5 rounded-full" 
                        style={{ width: `${getTierProgress(customer.points, customer.loyaltyTier)}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${customer.totalSpent.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.visitCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {customer.lastVisit}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Card Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issued</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredGiftCards.map((card) => (
                <tr key={card.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Gift className="h-4 w-4 mr-2 text-orange-600" />
                      <span className="text-sm font-mono text-gray-900">{card.cardNumber}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {card.customerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-green-600">${card.balance.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {card.issuedDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {card.expiryDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={() => {
                        setSelectedGiftCard(card);
                        setShowReloadModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Reload
                    </button>
                    <button
                      onClick={() => {
                        setSelectedGiftCard(card);
                        setShowTransactionModal(true);
                      }}
                      className="text-gray-600 hover:text-gray-800 font-medium"
                    >
                      History
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {showAddCustomerModal && (
        <AddCustomerModal onClose={() => setShowAddCustomerModal(false)} />
      )}
      {showAddGiftCardModal && (
        <AddGiftCardModal onClose={() => setShowAddGiftCardModal(false)} />
      )}
      {showReloadModal && selectedGiftCard && (
        <ReloadGiftCardModal 
          giftCard={selectedGiftCard}
          onClose={() => setShowReloadModal(false)}
          onReload={(amount) => {
            setGiftCards(giftCards.map(card =>
              card.id === selectedGiftCard.id
                ? {
                    ...card,
                    balance: card.balance + amount,
                    transactions: [
                      ...card.transactions,
                      {
                        id: Date.now().toString(),
                        type: 'RELOADED',
                        amount,
                        date: new Date().toISOString().split('T')[0],
                      }
                    ]
                  }
                : card
            ));
            setShowReloadModal(false);
          }}
        />
      )}
      {showTransactionModal && selectedGiftCard && (
        <TransactionHistoryModal 
          giftCard={selectedGiftCard}
          onClose={() => setShowTransactionModal(false)}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color = 'orange' }: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color?: string;
}) {
  const colorClasses = {
    orange: 'bg-orange-100 text-orange-600',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
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

function AddCustomerModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement API call
    console.log('Add customer:', formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Add Customer</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                Add Customer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function AddGiftCardModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    cardNumber: '',
    amount: '',
    customerName: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement API call
    console.log('Add gift card:', formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Issue Gift Card</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
              <input
                type="text"
                value={formData.cardNumber}
                onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                placeholder="GC123456789"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name (Optional)</label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
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
                Issue Card
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function ReloadGiftCardModal({ giftCard, onClose, onReload }: {
  giftCard: GiftCard;
  onClose: () => void;
  onReload: (amount: number) => void;
}) {
  const [amount, setAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const reloadAmount = parseFloat(amount);
    if (reloadAmount > 0) {
      onReload(reloadAmount);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Reload Gift Card</h2>
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600">Card: <span className="font-mono font-medium">{giftCard.cardNumber}</span></p>
            <p className="text-sm text-gray-600">Current Balance: <span className="font-semibold text-green-600">${giftCard.balance.toFixed(2)}</span></p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reload Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="50"
                min="1"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
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
                Reload
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function TransactionHistoryModal({ giftCard, onClose }: {
  giftCard: GiftCard;
  onClose: () => void;
}) {
  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'ISSUED': return 'bg-green-100 text-green-700';
      case 'RELOADED': return 'bg-blue-100 text-blue-700';
      case 'USED': return 'bg-red-100 text-red-700';
      case 'REFUNDED': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Transaction History</h2>
              <p className="text-sm text-gray-600">Card: <span className="font-mono">{giftCard.cardNumber}</span></p>
              <p className="text-sm text-gray-600">Customer: {giftCard.customerName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto max-h-96">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {giftCard.transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{transaction.date}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTransactionColor(transaction.type)}`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                    <span className={transaction.type === 'USED' || transaction.type === 'REFUNDED' ? 'text-red-600' : 'text-green-600'}>
                      {transaction.type === 'USED' || transaction.type === 'REFUNDED' ? '-' : '+'}${transaction.amount.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{transaction.orderId || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Current Balance:</span>
            <span className="text-xl font-bold text-green-600">${giftCard.balance.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

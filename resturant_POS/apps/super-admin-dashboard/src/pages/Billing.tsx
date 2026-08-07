import { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { format } from 'date-fns';

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  subscription: {
    id: string;
    status: string;
    trialUntil: string | null;
    paidUntil: string | null;
    plan: {
      id: string;
      name: string;
      basePrice: number;
    };
    maxScreens: number | null;
    maxTables: number | null;
    maxStaff: number | null;
  };
}

interface Plan {
  id: string;
  name: string;
  basePrice: number;
}

export default function Billing() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [showManageModal, setShowManageModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const [restaurantsRes, plansRes] = await Promise.all([
        axios.get('http://localhost:4000/api/v1/platform-admin/restaurants', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get('http://localhost:4000/api/v1/platform-admin/plans', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setRestaurants(restaurantsRes.data);
      setPlans(plansRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'TRIAL':
        return 'bg-blue-100 text-blue-800';
      case 'PAST_DUE':
        return 'bg-yellow-100 text-yellow-800';
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Billing & Subscriptions</h1>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Restaurant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trial Until
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paid Until
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {restaurants.map((restaurant) => (
                <tr key={restaurant.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{restaurant.name}</div>
                    <div className="text-sm text-gray-500">{restaurant.slug}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{restaurant.subscription.plan.name}</div>
                    <div className="text-sm text-gray-500">${restaurant.subscription.plan.basePrice}/mo</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(restaurant.subscription.status)}`}>
                      {restaurant.subscription.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {restaurant.subscription.trialUntil
                      ? format(new Date(restaurant.subscription.trialUntil), 'MMM d, yyyy')
                      : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {restaurant.subscription.paidUntil
                      ? format(new Date(restaurant.subscription.paidUntil), 'MMM d, yyyy')
                      : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedRestaurant(restaurant);
                        setShowManageModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showManageModal && selectedRestaurant && (
        <ManageSubscriptionModal
          restaurant={selectedRestaurant}
          plans={plans}
          onClose={() => {
            setShowManageModal(false);
            setSelectedRestaurant(null);
          }}
          onSuccess={() => {
            setShowManageModal(false);
            setSelectedRestaurant(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}

function ManageSubscriptionModal({
  restaurant,
  plans,
  onClose,
  onSuccess,
}: {
  restaurant: Restaurant;
  plans: Plan[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    status: restaurant.subscription.status,
    planId: restaurant.subscription.plan.id,
    trialUntil: restaurant.subscription.trialUntil
      ? restaurant.subscription.trialUntil.split('T')[0]
      : '',
    paidUntil: restaurant.subscription.paidUntil
      ? restaurant.subscription.paidUntil.split('T')[0]
      : '',
    maxScreens: restaurant.subscription.maxScreens,
    maxTables: restaurant.subscription.maxTables,
    maxStaff: restaurant.subscription.maxStaff,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('admin_token');
      await axios.put(
        `http://localhost:4000/api/v1/platform-admin/restaurants/${restaurant.id}/subscription`,
        {
          status: formData.status,
          planId: formData.planId,
          trialUntil: formData.trialUntil ? new Date(formData.trialUntil).toISOString() : null,
          paidUntil: formData.paidUntil ? new Date(formData.paidUntil).toISOString() : null,
          maxScreens: formData.maxScreens,
          maxTables: formData.maxTables,
          maxStaff: formData.maxStaff,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update subscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Manage Subscription - {restaurant.name}</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            >
              <option value="TRIAL">Trial</option>
              <option value="ACTIVE">Active</option>
              <option value="PAST_DUE">Past Due</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
            <select
              value={formData.planId}
              onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            >
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - ${plan.basePrice}/mo
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trial Until</label>
            <input
              type="date"
              value={formData.trialUntil}
              onChange={(e) => setFormData({ ...formData, trialUntil: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Paid Until</label>
            <input
              type="date"
              value={formData.paidUntil}
              onChange={(e) => setFormData({ ...formData, paidUntil: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Override Limits (Optional)</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Max Screens</label>
                <input
                  type="number"
                  value={formData.maxScreens || ''}
                  onChange={(e) => setFormData({ ...formData, maxScreens: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Max Tables</label>
                <input
                  type="number"
                  value={formData.maxTables || ''}
                  onChange={(e) => setFormData({ ...formData, maxTables: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Max Staff</label>
                <input
                  type="number"
                  value={formData.maxStaff || ''}
                  onChange={(e) => setFormData({ ...formData, maxStaff: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Update Subscription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

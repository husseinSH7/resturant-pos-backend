import { useState, useEffect } from 'react';
import { Plus, Building2, Users, Smartphone, Edit2, Trash2, Search, Filter, MoreVertical } from 'lucide-react';

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  ownerEmail: string;
  ownerName: string;
  plan: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'PAST_DUE';
  screens: number;
  tables: number;
  staff: number;
  createdAt: string;
  subscriptionEnds: string;
}

interface Plan {
  id: string;
  name: string;
  maxScreens: number;
  maxTables: number;
  maxStaff: number;
  price: number;
}

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'PAST_DUE'>('ALL');

  useEffect(() => {
    // Mock data - replace with actual API calls
    setTimeout(() => {
      setRestaurants([
        {
          id: '1',
          name: 'The Burger Joint',
          slug: 'burger-joint',
          ownerEmail: 'john@burgerjoint.com',
          ownerName: 'John Smith',
          plan: 'Premium',
          status: 'ACTIVE',
          screens: 3,
          tables: 12,
          staff: 8,
          createdAt: '2024-01-01',
          subscriptionEnds: '2024-02-01',
        },
        {
          id: '2',
          name: 'Pizza Palace',
          slug: 'pizza-palace',
          ownerEmail: 'sarah@pizzapalace.com',
          ownerName: 'Sarah Johnson',
          plan: 'Basic',
          status: 'ACTIVE',
          screens: 2,
          tables: 8,
          staff: 5,
          createdAt: '2024-01-05',
          subscriptionEnds: '2024-02-05',
        },
        {
          id: '3',
          name: 'Sushi Express',
          slug: 'sushi-express',
          ownerEmail: 'mike@sushiexpress.com',
          ownerName: 'Mike Williams',
          plan: 'Premium',
          status: 'TRIAL',
          screens: 1,
          tables: 6,
          staff: 4,
          createdAt: '2024-01-10',
          subscriptionEnds: '2024-01-24',
        },
        {
          id: '4',
          name: 'Taco Town',
          slug: 'taco-town',
          ownerEmail: 'emma@tacotown.com',
          ownerName: 'Emma Davis',
          plan: 'Basic',
          status: 'PAST_DUE',
          screens: 2,
          tables: 10,
          staff: 6,
          createdAt: '2023-12-01',
          subscriptionEnds: '2024-01-01',
        },
      ]);

      setPlans([
        { id: '1', name: 'Basic', maxScreens: 2, maxTables: 10, maxStaff: 5, price: 99 },
        { id: '2', name: 'Premium', maxScreens: 5, maxTables: 25, maxStaff: 15, price: 199 },
        { id: '3', name: 'Enterprise', maxScreens: 10, maxTables: 50, maxStaff: 30, price: 399 },
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         restaurant.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         restaurant.ownerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || restaurant.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCreateRestaurant = () => {
    setEditingRestaurant(null);
    setShowCreateModal(true);
  };

  const handleEditRestaurant = (restaurant: Restaurant) => {
    setEditingRestaurant(restaurant);
    setShowCreateModal(true);
  };

  const handleDeleteRestaurant = (id: string) => {
    if (confirm('Are you sure you want to delete this restaurant? This action cannot be undone.')) {
      setRestaurants(restaurants.filter(r => r.id !== id));
    }
  };

  const handleToggleStatus = (id: string) => {
    setRestaurants(restaurants.map(r =>
      r.id === id 
        ? { ...r, status: r.status === 'ACTIVE' ? 'SUSPENDED' as const : 'ACTIVE' as const }
        : r
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700';
      case 'SUSPENDED': return 'bg-red-100 text-red-700';
      case 'TRIAL': return 'bg-blue-100 text-blue-700';
      case 'PAST_DUE': return 'bg-yellow-100 text-yellow-700';
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
        <h1 className="text-2xl font-bold text-gray-900">Restaurants</h1>
        <button
          onClick={handleCreateRestaurant}
          className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Add Restaurant</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Restaurants" value={restaurants.length} icon={<Building2 className="h-5 w-5" />} />
        <StatCard label="Active" value={restaurants.filter(r => r.status === 'ACTIVE').length} icon={<Users className="h-5 w-5" />} color="green" />
        <StatCard label="Trial" value={restaurants.filter(r => r.status === 'TRIAL').length} icon={<Users className="h-5 w-5" />} color="blue" />
        <StatCard label="Past Due" value={restaurants.filter(r => r.status === 'PAST_DUE').length} icon={<Users className="h-5 w-5" />} color="yellow" />
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search restaurants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="TRIAL">Trial</option>
          <option value="PAST_DUE">Past Due</option>
        </select>
      </div>

      {/* Restaurants Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Restaurant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Screens/Tables/Staff</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscription</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRestaurants.map((restaurant) => (
              <tr key={restaurant.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Building2 className="h-5 w-5 mr-2 text-orange-600" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{restaurant.name}</div>
                      <div className="text-sm text-gray-500">{restaurant.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm text-gray-900">{restaurant.ownerName}</div>
                    <div className="text-sm text-gray-500">{restaurant.ownerEmail}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {restaurant.plan}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(restaurant.status)}`}>
                    {restaurant.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center">
                      <Smartphone className="h-4 w-4 mr-1" />
                      {restaurant.screens}
                    </span>
                    <span className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {restaurant.tables}
                    </span>
                    <span className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {restaurant.staff}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {restaurant.subscriptionEnds}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                  <button
                    onClick={() => handleToggleStatus(restaurant.id)}
                    className={`font-medium ${restaurant.status === 'ACTIVE' ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}
                  >
                    {restaurant.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleEditRestaurant(restaurant)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    <Edit2 className="h-4 w-4 inline" />
                  </button>
                  <button
                    onClick={() => handleDeleteRestaurant(restaurant.id)}
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
        <RestaurantModal
          restaurant={editingRestaurant}
          plans={plans}
          onClose={() => setShowCreateModal(false)}
          onSave={(restaurantData) => {
            if (editingRestaurant) {
              setRestaurants(restaurants.map(r =>
                r.id === editingRestaurant.id ? { ...r, ...restaurantData } : r
              ));
            } else {
              const newRestaurant: Restaurant = {
                id: Date.now().toString(),
                ...restaurantData,
                status: 'TRIAL',
                screens: plans.find(p => p.name === restaurantData.plan)?.maxScreens || 2,
                tables: plans.find(p => p.name === restaurantData.plan)?.maxTables || 10,
                staff: plans.find(p => p.name === restaurantData.plan)?.maxStaff || 5,
                createdAt: new Date().toISOString().split('T')[0],
                subscriptionEnds: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              } as Restaurant;
              setRestaurants([...restaurants, newRestaurant]);
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

function RestaurantModal({ restaurant, plans, onClose, onSave }: {
  restaurant: Restaurant | null;
  plans: Plan[];
  onClose: () => void;
  onSave: (data: Partial<Restaurant>) => void;
}) {
  const [formData, setFormData] = useState({
    name: restaurant?.name || '',
    slug: restaurant?.slug || '',
    ownerEmail: restaurant?.ownerEmail || '',
    ownerName: restaurant?.ownerName || '',
    plan: restaurant?.plan || plans[0]?.name || '',
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
            {restaurant ? 'Edit Restaurant' : 'Add Restaurant'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
                <input
                  type="text"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner Email</label>
                <input
                  type="email"
                  value={formData.ownerEmail}
                  onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
              <select
                value={formData.plan}
                onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              >
                {plans.map(plan => (
                  <option key={plan.id} value={plan.name}>
                    {plan.name} - ${plan.price}/month (Max: {plan.maxScreens} screens, {plan.maxTables} tables, {plan.maxStaff} staff)
                  </option>
                ))}
              </select>
            </div>

            {!restaurant && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> New restaurants start with a 14-day trial period. The owner will receive an email to set their password.
                </p>
              </div>
            )}

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
                {restaurant ? 'Save Changes' : 'Create Restaurant'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

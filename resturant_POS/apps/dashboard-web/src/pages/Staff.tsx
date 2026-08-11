import { useState, useEffect } from 'react';
import { Pencil, Trash2, Search, UserPlus, Clock, DollarSign, Star } from 'lucide-react';

interface Staff {
  id: string;
  name: string;
  email: string;
  role: 'MANAGER' | 'CASHIER' | 'KITCHEN';
  pin: string;
  isActive: boolean;
  ordersToday: number;
  revenueToday: number;
  rating: number;
  shiftStart?: string;
}

export default function Staff() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - replace with actual API calls
  useEffect(() => {
    setTimeout(() => {
      setStaff([
        {
          id: '1',
          name: 'John Smith',
          email: 'john@restaurant.com',
          role: 'MANAGER',
          pin: '1234',
          isActive: true,
          ordersToday: 45,
          revenueToday: 4500,
          rating: 4.8,
          shiftStart: '09:00',
        },
        {
          id: '2',
          name: 'Sarah Johnson',
          email: 'sarah@restaurant.com',
          role: 'CASHIER',
          pin: '2345',
          isActive: true,
          ordersToday: 38,
          revenueToday: 3800,
          rating: 4.9,
          shiftStart: '10:00',
        },
        {
          id: '3',
          name: 'Mike Williams',
          email: 'mike@restaurant.com',
          role: 'KITCHEN',
          pin: '3456',
          isActive: true,
          ordersToday: 0,
          revenueToday: 0,
          rating: 4.7,
          shiftStart: '08:30',
        },
        {
          id: '4',
          name: 'Emma Davis',
          email: 'emma@restaurant.com',
          role: 'CASHIER',
          pin: '4567',
          isActive: false,
          ordersToday: 0,
          revenueToday: 0,
          rating: 4.6,
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredStaff = staff.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddStaff = () => {
    setEditingStaff(null);
    setShowModal(true);
  };

  const handleEditStaff = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setShowModal(true);
  };

  const handleDeleteStaff = (id: string) => {
    if (confirm('Are you sure you want to delete this staff member?')) {
      setStaff(staff.filter(member => member.id !== id));
    }
  };

  const handleToggleActive = (id: string) => {
    setStaff(staff.map(member =>
      member.id === id ? { ...member, isActive: !member.isActive } : member
    ));
  };

  const handleSaveStaff = (staffData: Partial<Staff>) => {
    if (editingStaff) {
      setStaff(staff.map(member =>
        member.id === editingStaff.id ? { ...member, ...staffData } : member
      ));
    } else {
      const newStaff: Staff = {
        id: Date.now().toString(),
        name: staffData.name || '',
        email: staffData.email || '',
        role: staffData.role || 'CASHIER',
        pin: staffData.pin || '0000',
        isActive: true,
        ordersToday: 0,
        revenueToday: 0,
        rating: 0,
      };
      setStaff([...staff, newStaff]);
    }
    setShowModal(false);
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
        <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
        <button
          onClick={handleAddStaff}
          className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
        >
          <UserPlus className="h-5 w-5" />
          <span>Add Staff</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search staff by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map((member) => (
          <StaffCard
            key={member.id}
            staff={member}
            onEdit={() => handleEditStaff(member)}
            onDelete={() => handleDeleteStaff(member.id)}
            onToggleActive={() => handleToggleActive(member.id)}
          />
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <StaffModal
          staff={editingStaff}
          onSave={handleSaveStaff}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

function StaffCard({ staff, onEdit, onDelete, onToggleActive }: {
  staff: Staff;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
            staff.isActive ? 'bg-orange-100' : 'bg-gray-100'
          }`}>
            <span className={`text-lg font-semibold ${
              staff.isActive ? 'text-orange-600' : 'text-gray-400'
            }`}>
              {staff.name.charAt(0)}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{staff.name}</h3>
            <p className="text-sm text-gray-500">{staff.email}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onEdit}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Role</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            staff.role === 'MANAGER' ? 'bg-purple-100 text-purple-700' :
            staff.role === 'CASHIER' ? 'bg-blue-100 text-blue-700' :
            'bg-green-100 text-green-700'
          }`}>
            {staff.role}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">PIN</span>
          <span className="font-mono text-gray-900">••••</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Status</span>
          <button
            onClick={onToggleActive}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              staff.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {staff.isActive ? 'Active' : 'Inactive'}
          </button>
        </div>
      </div>

      {staff.isActive && (
        <div className="border-t pt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 flex items-center">
              <ShoppingCart className="h-4 w-4 mr-1" />
              Orders Today
            </span>
            <span className="font-semibold text-gray-900">{staff.ordersToday}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />
              Revenue Today
            </span>
            <span className="font-semibold text-gray-900">${staff.revenueToday.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 flex items-center">
              <Star className="h-4 w-4 mr-1" />
              Rating
            </span>
            <span className="font-semibold text-gray-900">{staff.rating.toFixed(1)}</span>
          </div>
          {staff.shiftStart && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Shift Start
              </span>
              <span className="font-semibold text-gray-900">{staff.shiftStart}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StaffModal({ staff, onSave, onClose }: {
  staff: Staff | null;
  onSave: (data: Partial<Staff>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    name: staff?.name || '',
    email: staff?.email || '',
    role: staff?.role || 'CASHIER',
    pin: staff?.pin || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {staff ? 'Edit Staff' : 'Add Staff'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'MANAGER' | 'CASHIER' | 'KITCHEN' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="CASHIER">Cashier</option>
                <option value="KITCHEN">Kitchen</option>
                <option value="MANAGER">Manager</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PIN
              </label>
              <input
                type="password"
                value={formData.pin}
                onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                maxLength={4}
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
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function ShoppingCart({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  );
}

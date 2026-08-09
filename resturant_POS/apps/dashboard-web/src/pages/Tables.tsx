import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, MapPin, Clock, ArrowRightLeft, Merge } from 'lucide-react';

interface Table {
  id: string;
  name: string;
  seats: number;
  area: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'DIRTY';
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  currentOrderId?: string;
  guestCount?: number;
  occupiedSince?: string;
}

interface Area {
  id: string;
  name: string;
  color: string;
}

export default function Tables() {
  const [tables, setTables] = useState<Table[]>([]);
  const [areas, setAreas] = useState<Area[]>([
    { id: '1', name: 'Main Dining', color: '#f97316' },
    { id: '2', name: 'Patio', color: '#3b82f6' },
    { id: '3', name: 'Private Room', color: '#10b981' },
  ]);
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'visual'>('grid');
  const [showModal, setShowModal] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - replace with actual API calls
    setTimeout(() => {
      setTables([
        { id: '1', name: 'Table 1', seats: 4, area: 'Main Dining', status: 'OCCUPIED', guestCount: 3, occupiedSince: '19:30' },
        { id: '2', name: 'Table 2', seats: 2, area: 'Main Dining', status: 'AVAILABLE' },
        { id: '3', name: 'Table 3', seats: 6, area: 'Main Dining', status: 'RESERVED' },
        { id: '4', name: 'Table 4', seats: 4, area: 'Patio', status: 'OCCUPIED', guestCount: 4, occupiedSince: '20:15' },
        { id: '5', name: 'Table 5', seats: 2, area: 'Patio', status: 'AVAILABLE' },
        { id: '6', name: 'Table 6', seats: 8, area: 'Private Room', status: 'DIRTY' },
        { id: '7', name: 'Table 7', seats: 4, area: 'Main Dining', status: 'AVAILABLE' },
        { id: '8', name: 'Table 8', seats: 4, area: 'Main Dining', status: 'OCCUPIED', guestCount: 2, occupiedSince: '21:00' },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredTables = selectedArea === 'all' 
    ? tables 
    : tables.filter(table => table.area === selectedArea);

  const handleAddTable = () => {
    setEditingTable(null);
    setShowModal(true);
  };

  const handleEditTable = (table: Table) => {
    setEditingTable(table);
    setShowModal(true);
  };

  const handleDeleteTable = (id: string) => {
    if (confirm('Are you sure you want to delete this table?')) {
      setTables(tables.filter(table => table.id !== id));
    }
  };

  const handleSaveTable = (tableData: Partial<Table>) => {
    if (editingTable) {
      setTables(tables.map(table =>
        table.id === editingTable.id ? { ...table, ...tableData } : table
      ));
    } else {
      const newTable: Table = {
        id: Date.now().toString(),
        name: tableData.name || 'New Table',
        seats: tableData.seats || 4,
        area: tableData.area || 'Main Dining',
        status: 'AVAILABLE',
      };
      setTables([...tables, newTable]);
    }
    setShowModal(false);
  };

  const handleTransferTable = (tableId: string) => {
    // Implement table transfer logic
    console.log('Transfer table:', tableId);
  };

  const handleMergeTables = () => {
    // Implement table merge logic
    console.log('Merge tables');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-700';
      case 'OCCUPIED': return 'bg-orange-100 text-orange-700';
      case 'RESERVED': return 'bg-blue-100 text-blue-700';
      case 'DIRTY': return 'bg-red-100 text-red-700';
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
        <h1 className="text-2xl font-bold text-gray-900">Tables Management</h1>
        <div className="flex space-x-3">
          <button
            onClick={handleMergeTables}
            className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Merge className="h-5 w-5" />
            <span>Merge Tables</span>
          </button>
          <button
            onClick={handleAddTable}
            className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Add Table</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'grid'
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Grid View
          </button>
          <button
            onClick={() => setViewMode('visual')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'visual'
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Visual Layout
          </button>
        </div>
        <select
          value={selectedArea}
          onChange={(e) => setSelectedArea(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          <option value="all">All Areas</option>
          {areas.map(area => (
            <option key={area.id} value={area.name}>{area.name}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Tables" value={tables.length} icon={<MapPin className="h-5 w-5" />} />
        <StatCard label="Available" value={tables.filter(t => t.status === 'AVAILABLE').length} icon={<Users className="h-5 w-5" />} color="green" />
        <StatCard label="Occupied" value={tables.filter(t => t.status === 'OCCUPIED').length} icon={<Users className="h-5 w-5" />} color="orange" />
        <StatCard label="Reserved" value={tables.filter(t => t.status === 'RESERVED').length} icon={<Clock className="h-5 w-5" />} color="blue" />
      </div>

      {/* Tables Grid */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              onEdit={() => handleEditTable(table)}
              onDelete={() => handleDeleteTable(table.id)}
              onTransfer={() => handleTransferTable(table.id)}
              getStatusColor={getStatusColor}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 min-h-[500px] border-2 border-dashed border-gray-300">
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <MapPin className="h-16 w-16 mx-auto mb-4" />
              <p className="text-lg font-medium">Visual Floor Plan Editor</p>
              <p className="text-sm">Drag and drop tables to arrange your floor plan</p>
              <p className="text-xs mt-2">(Coming soon - drag-and-drop functionality)</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <TableModal
          table={editingTable}
          areas={areas}
          onSave={handleSaveTable}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

function TableCard({ table, onEdit, onDelete, onTransfer, getStatusColor }: {
  table: Table;
  onEdit: () => void;
  onDelete: () => void;
  onTransfer: () => void;
  getStatusColor: (status: string) => string;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{table.name}</h3>
          <p className="text-sm text-gray-500">{table.area}</p>
        </div>
        <div className="flex space-x-1">
          <button
            onClick={onEdit}
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 flex items-center">
            <Users className="h-4 w-4 mr-1" />
            Seats
          </span>
          <span className="font-medium text-gray-900">{table.seats}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Status</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(table.status)}`}>
            {table.status}
          </span>
        </div>
      </div>

      {table.status === 'OCCUPIED' && (
        <div className="border-t pt-3 space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Guests</span>
            <span className="font-medium text-gray-900">{table.guestCount}</span>
          </div>
          {table.occupiedSince && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Since
              </span>
              <span className="font-medium text-gray-900">{table.occupiedSince}</span>
            </div>
          )}
        </div>
      )}

      {table.status === 'OCCUPIED' && (
        <button
          onClick={onTransfer}
          className="mt-3 w-full flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
        >
          <ArrowRightLeft className="h-4 w-4" />
          <span>Transfer</span>
        </button>
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

function TableModal({ table, areas, onSave, onClose }: {
  table: Table | null;
  areas: Area[];
  onSave: (data: Partial<Table>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    name: table?.name || '',
    seats: table?.seats || 4,
    area: table?.area || areas[0].name,
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
            {table ? 'Edit Table' : 'Add Table'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Table Name
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
                Number of Seats
              </label>
              <input
                type="number"
                value={formData.seats}
                onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                min="1"
                max="20"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Area
              </label>
              <select
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {areas.map(area => (
                  <option key={area.id} value={area.name}>{area.name}</option>
                ))}
              </select>
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

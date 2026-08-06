import { useState, useEffect } from 'react';

interface Table {
  id: string;
  name: string;
  seats: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
  areaId?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  shape?: 'RECTANGLE' | 'SQUARE' | 'ROUND';
  guestCount?: number;
  serverId?: string;
}

interface TableArea {
  id: string;
  name: string;
  restaurantId: string;
}

export default function Tables() {
  const [tables, setTables] = useState<Table[]>([]);
  const [areas, setAreas] = useState<TableArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTable, setDraggedTable] = useState<Table | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [newTable, setNewTable] = useState({
    name: '',
    seats: 2,
    areaId: '',
    shape: 'RECTANGLE' as const,
    x: 50,
    y: 50,
    width: 100,
    height: 80,
  });

  useEffect(() => {
    loadTables();
    loadAreas();
  }, []);

  const loadTables = async () => {
    try {
      const API_BASE = 'http://localhost:4000';
      const res = await fetch(`${API_BASE}/tables`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (res.ok) {
        setTables(await res.json());
      }
    } catch (error) {
      console.error('Failed to load tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAreas = async () => {
    try {
      const API_BASE = 'http://localhost:4000';
      const res = await fetch(`${API_BASE}/tables/areas`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (res.ok) {
        setAreas(await res.json());
      }
    } catch (error) {
      console.error('Failed to load areas:', error);
    }
  };

  const createTable = async () => {
    try {
      const API_BASE = 'http://localhost:4000';
      const res = await fetch(`${API_BASE}/tables`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(newTable),
      });
      
      if (res.ok) {
        setShowAddModal(false);
        setNewTable({
          name: '',
          seats: 2,
          areaId: '',
          shape: 'RECTANGLE',
          x: 50,
          y: 50,
          width: 100,
          height: 80,
        });
        loadTables();
      } else {
        throw new Error('Failed to create table');
      }
    } catch (error) {
      console.error('Failed to create table:', error);
      alert('Failed to create table. Please try again.');
    }
  };

  const updateTableStatus = async (tableId: string, status: string) => {
    try {
      const API_BASE = 'http://localhost:4000';
      const res = await fetch(`${API_BASE}/tables/${tableId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status }),
      });
      
      if (res.ok) {
        loadTables();
      }
    } catch (error) {
      console.error('Failed to update table:', error);
    }
  };

  const updateTablePosition = async (tableId: string, x: number, y: number) => {
    try {
      const API_BASE = 'http://localhost:4000';
      const res = await fetch(`${API_BASE}/tables/${tableId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ x, y }),
      });
      
      if (res.ok) {
        loadTables();
      }
    } catch (error) {
      console.error('Failed to update table position:', error);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, table: Table) => {
    e.preventDefault();
    setIsDragging(true);
    setDraggedTable(table);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !draggedTable) return;
    
    const container = e.currentTarget as HTMLElement;
    const containerRect = container.getBoundingClientRect();
    
    const newX = e.clientX - containerRect.left - dragOffset.x;
    const newY = e.clientY - containerRect.top - dragOffset.y;
    
    // Constrain to container bounds
    const constrainedX = Math.max(0, Math.min(newX, containerRect.width - (draggedTable.width || 100)));
    const constrainedY = Math.max(0, Math.min(newY, containerRect.height - (draggedTable.height || 80)));
    
    setDraggedTable({ ...draggedTable, x: constrainedX, y: constrainedY });
  };

  const handleMouseUp = () => {
    if (isDragging && draggedTable) {
      updateTablePosition(draggedTable.id, draggedTable.x || 0, draggedTable.y || 0);
    }
    setIsDragging(false);
    setDraggedTable(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 border-green-500 text-green-800';
      case 'OCCUPIED': return 'bg-red-100 border-red-500 text-red-800';
      case 'RESERVED': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      default: return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  const filteredTables = selectedArea === 'all' 
    ? tables 
    : tables.filter(t => t.areaId === selectedArea);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading tables...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Table Management</h1>
            <p className="text-gray-600 mt-1">Visual floor plan and table status</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition"
          >
            + Add Table
          </button>
        </div>

        {/* Area Filter */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setSelectedArea('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              selectedArea === 'all' ? 'bg-orange-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            All Areas
          </button>
          {areas.map((area) => (
            <button
              key={area.id}
              onClick={() => setSelectedArea(area.id)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedArea === area.id ? 'bg-orange-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {area.name}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Total Tables</div>
            <div className="text-3xl font-bold text-gray-900">{filteredTables.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Available</div>
            <div className="text-3xl font-bold text-green-600">
              {filteredTables.filter(t => t.status === 'AVAILABLE').length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Occupied</div>
            <div className="text-3xl font-bold text-red-600">
              {filteredTables.filter(t => t.status === 'OCCUPIED').length}
            </div>
          </div>
        </div>

        {/* Visual Floor Plan */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Floor Plan (Drag tables to reposition)</h2>
          <div 
            className="relative bg-gray-100 rounded-lg h-96 overflow-hidden border-2 border-dashed border-gray-300"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {filteredTables.map((table) => {
              const displayTable = draggedTable?.id === table.id ? draggedTable : table;
              return (
                <div
                  key={table.id}
                  className={`absolute cursor-move border-2 rounded-lg flex flex-col items-center justify-center transition-all hover:scale-105 ${getStatusColor(displayTable.status)}`}
                  style={{
                    left: `${displayTable.x || 50}px`,
                    top: `${displayTable.y || 50}px`,
                    width: `${displayTable.width || 100}px`,
                    height: `${displayTable.height || 80}px`,
                    borderRadius: displayTable.shape === 'ROUND' ? '50%' : '8px',
                    zIndex: draggedTable?.id === table.id ? 1000 : 1,
                  }}
                  onMouseDown={(e) => handleMouseDown(e, table)}
                  onClick={() => setEditingTable(table)}
                >
                  <div className="font-bold text-sm">{displayTable.name}</div>
                  <div className="text-xs">{displayTable.seats} seats</div>
                  {displayTable.guestCount && displayTable.guestCount > 0 && (
                    <div className="text-xs mt-1">{displayTable.guestCount} guests</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Table List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Table List</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Table
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Seats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Guests
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTables.map((table) => (
                  <tr key={table.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{table.name}</td>
                    <td className="px-6 py-4 text-gray-600">{table.seats}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(table.status)}`}
                      >
                        {table.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{table.guestCount || 0}</td>
                    <td className="px-6 py-4">
                      {table.status === 'AVAILABLE' && (
                        <button
                          onClick={() => updateTableStatus(table.id, 'OCCUPIED')}
                          className="text-blue-600 hover:text-blue-900 font-medium text-sm"
                        >
                          Mark Occupied
                        </button>
                      )}
                      {table.status === 'OCCUPIED' && (
                        <button
                          onClick={() => updateTableStatus(table.id, 'AVAILABLE')}
                          className="text-green-600 hover:text-green-900 font-medium text-sm"
                        >
                          Clear Table
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Table Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Add New Table</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Table Name
                  </label>
                  <input
                    type="text"
                    value={newTable.name}
                    onChange={(e) => setNewTable({ ...newTable, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="e.g., Table 1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seats
                  </label>
                  <input
                    type="number"
                    value={newTable.seats}
                    onChange={(e) => setNewTable({ ...newTable, seats: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Area
                  </label>
                  <select
                    value={newTable.areaId}
                    onChange={(e) => setNewTable({ ...newTable, areaId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Select area</option>
                    {areas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shape
                  </label>
                  <select
                    value={newTable.shape}
                    onChange={(e) => setNewTable({ ...newTable, shape: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="RECTANGLE">Rectangle</option>
                    <option value="SQUARE">Square</option>
                    <option value="ROUND">Round</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Position X
                    </label>
                    <input
                      type="number"
                      value={newTable.x}
                      onChange={(e) => setNewTable({ ...newTable, x: parseInt(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Position Y
                    </label>
                    <input
                      type="number"
                      value={newTable.y}
                      onChange={(e) => setNewTable({ ...newTable, y: parseInt(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={createTable}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                >
                  Add Table
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
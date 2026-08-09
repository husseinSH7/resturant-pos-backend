import { useState, useRef, useCallback } from 'react';

interface Table {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  seats: number;
  name: string;
  shape: 'rect' | 'circle';
  rotation: number;
}

interface FloorPlanEditorProps {
  tables: Table[];
  onTablesChange: (tables: Table[]) => void;
  onSave: () => void;
}

export default function FloorPlanEditor({ tables, onTablesChange, onSave }: FloorPlanEditorProps) {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent, table: Table) => {
    e.stopPropagation();
    setSelectedTable(table);
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !selectedTable || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const newX = e.clientX - canvasRect.left - dragOffset.x;
    const newY = e.clientY - canvasRect.top - dragOffset.y;

    const updatedTables = tables.map((table) =>
      table.id === selectedTable.id
        ? { ...table, x: Math.max(0, newX), y: Math.max(0, newY) }
        : table
    );

    onTablesChange(updatedTables);
    setSelectedTable({ ...selectedTable, x: Math.max(0, newX), y: Math.max(0, newY) });
  }, [isDragging, selectedTable, tables, dragOffset, onTablesChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleAddTable = () => {
    const newTable: Table = {
      id: `table-${Date.now()}`,
      x: 50,
      y: 50,
      width: 80,
      height: 80,
      seats: 4,
      name: `Table ${tables.length + 1}`,
      shape: 'rect',
      rotation: 0,
    };
    onTablesChange([...tables, newTable]);
  };

  const handleDeleteTable = () => {
    if (!selectedTable) return;
    onTablesChange(tables.filter((t) => t.id !== selectedTable.id));
    setSelectedTable(null);
  };

  const handleUpdateTable = (updates: Partial<Table>) => {
    if (!selectedTable) return;
    const updatedTables = tables.map((table) =>
      table.id === selectedTable.id ? { ...table, ...updates } : table
    );
    onTablesChange(updatedTables);
    setSelectedTable({ ...selectedTable, ...updates });
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Floor Plan Editor</h2>
        
        <div className="space-y-4 mb-6">
          <button
            onClick={handleAddTable}
            className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            + Add Table
          </button>
          <button
            onClick={onSave}
            className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Save Layout
          </button>
        </div>

        {selectedTable && (
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold">Table Properties</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={selectedTable.name}
                onChange={(e) => handleUpdateTable({ name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seats</label>
              <input
                type="number"
                value={selectedTable.seats}
                onChange={(e) => handleUpdateTable({ seats: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shape</label>
              <select
                value={selectedTable.shape}
                onChange={(e) => handleUpdateTable({ shape: e.target.value as 'rect' | 'circle' })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="rect">Rectangle</option>
                <option value="circle">Circle</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Width</label>
              <input
                type="number"
                value={selectedTable.width}
                onChange={(e) => handleUpdateTable({ width: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
                min="40"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
              <input
                type="number"
                value={selectedTable.height}
                onChange={(e) => handleUpdateTable({ height: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
                min="40"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rotation (degrees)</label>
              <input
                type="number"
                value={selectedTable.rotation}
                onChange={(e) => handleUpdateTable({ rotation: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
                min="0"
                max="360"
              />
            </div>

            <button
              onClick={handleDeleteTable}
              className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete Table
            </button>
          </div>
        )}

        <div className="mt-6 text-sm text-gray-500">
          <p className="font-medium mb-2">Instructions:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Click on a table to select it</li>
            <li>Drag tables to reposition</li>
            <li>Use sidebar to edit properties</li>
            <li>Click outside to deselect</li>
          </ul>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 bg-gray-100 relative overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setSelectedTable(null);
          }
        }}
      >
        {/* Grid */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(to right, #e5e7eb 1px, transparent 1px),
            linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }} />

        {/* Tables */}
        {tables.map((table) => (
          <div
            key={table.id}
            className={`absolute cursor-move flex items-center justify-center text-sm font-medium ${
              selectedTable?.id === table.id ? 'ring-2 ring-orange-500 ring-offset-2' : ''
            } ${table.shape === 'circle' ? 'rounded-full' : 'rounded-lg'}`}
            style={{
              left: table.x,
              top: table.y,
              width: table.width,
              height: table.height,
              backgroundColor: selectedTable?.id === table.id ? '#f97316' : '#fbbf24',
              transform: `rotate(${table.rotation}deg)`,
            }}
            onMouseDown={(e) => handleMouseDown(e, table)}
          >
            <span className="text-gray-900">{table.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

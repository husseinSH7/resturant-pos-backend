import { useState, useEffect } from 'react';
import axios from 'axios';

interface Reservation {
  id: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  guestCount: number;
  date: string;
  time: string;
  status: 'PENDING' | 'CONFIRMED' | 'SEATED' | 'CANCELLED' | 'NO_SHOW';
  notes?: string;
  specialRequests?: string;
  table?: {
    id: string;
    name: string;
    seats: number;
  };
}

interface WaitlistEntry {
  id: string;
  customerName: string;
  customerPhone?: string;
  guestCount: number;
  status: 'WAITING' | 'CALLED' | 'SEATED' | 'CANCELLED';
  estimatedWait?: number;
  notes?: string;
  createdAt: string;
}

export default function Reservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'reservations' | 'waitlist'>('reservations');

  const [newReservation, setNewReservation] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    guestCount: 2,
    date: new Date().toISOString().split('T')[0],
    time: '',
    tableId: '',
    notes: '',
    specialRequests: '',
  });

  const [newWaitlistEntry, setNewWaitlistEntry] = useState({
    customerName: '',
    customerPhone: '',
    guestCount: 2,
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, [selectedDate, activeTab]);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('owner_token');
      const restaurantId = localStorage.getItem('owner_restaurant_id');
      const headers = { 
        Authorization: `Bearer ${token}`,
        'X-Restaurant-ID': restaurantId || ''
      };
      
      if (activeTab === 'reservations') {
        const res = await axios.get('http://localhost:4000/api/v1/reservations', { 
          params: { date: selectedDate },
          headers 
        });
        setReservations(res.data);
      } else {
        const res = await axios.get('http://localhost:4000/api/v1/reservations/waitlist', { headers });
        setWaitlist(res.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createReservation = async () => {
    try {
      const token = localStorage.getItem('owner_token');
      const restaurantId = localStorage.getItem('owner_restaurant_id');
      await axios.post(
        'http://localhost:4000/api/v1/reservations',
        newReservation,
        { headers: { Authorization: `Bearer ${token}`, 'X-Restaurant-ID': restaurantId || '' } }
      );
      
      setShowReservationModal(false);
      setNewReservation({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        guestCount: 2,
        date: new Date().toISOString().split('T')[0],
        time: '',
        tableId: '',
        notes: '',
        specialRequests: '',
      });
      loadData();
    } catch (error) {
      console.error('Failed to create reservation:', error);
      alert('Failed to create reservation. Please try again.');
    }
  };

  const addToWaitlist = async () => {
    try {
      const token = localStorage.getItem('owner_token');
      const restaurantId = localStorage.getItem('owner_restaurant_id');
      await axios.post(
        'http://localhost:4000/api/v1/reservations/waitlist',
        newWaitlistEntry,
        { headers: { Authorization: `Bearer ${token}`, 'X-Restaurant-ID': restaurantId || '' } }
      );
      
      setShowWaitlistModal(false);
      setNewWaitlistEntry({
        customerName: '',
        customerPhone: '',
        guestCount: 2,
        notes: '',
      });
      loadData();
    } catch (error) {
      console.error('Failed to add to waitlist:', error);
      alert('Failed to add to waitlist. Please try again.');
    }
  };

  const updateReservationStatus = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem('owner_token');
      const restaurantId = localStorage.getItem('owner_restaurant_id');
      await axios.put(
        `http://localhost:4000/api/v1/reservations/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}`, 'X-Restaurant-ID': restaurantId || '' } }
      );
      loadData();
    } catch (error) {
      console.error('Failed to update reservation:', error);
    }
  };

  const updateWaitlistStatus = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem('owner_token');
      const restaurantId = localStorage.getItem('owner_restaurant_id');
      await axios.put(
        `http://localhost:4000/api/v1/reservations/waitlist/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}`, 'X-Restaurant-ID': restaurantId || '' } }
      );
      loadData();
    } catch (error) {
      console.error('Failed to update waitlist:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'SEATED': return 'bg-blue-100 text-blue-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      case 'NO_SHOW': return 'bg-red-100 text-red-800';
      case 'WAITING': return 'bg-yellow-100 text-yellow-800';
      case 'CALLED': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading reservations...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reservations & Waitlist</h1>
            <p className="text-gray-600 mt-1">Manage reservations and waitlist entries</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowWaitlistModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              👥 Add to Waitlist
            </button>
            <button
              onClick={() => setShowReservationModal(true)}
              className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition"
            >
              + New Reservation
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('reservations')}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              activeTab === 'reservations'
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Reservations ({reservations.length})
          </button>
          <button
            onClick={() => setActiveTab('waitlist')}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              activeTab === 'waitlist'
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Waitlist ({waitlist.length})
          </button>
        </div>

        {/* Date Selector */}
        <div className="mb-6">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        {/* Reservations Tab */}
        {activeTab === 'reservations' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Guests
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Table
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reservations.map((reservation) => (
                  <tr key={reservation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{reservation.customerName}</div>
                      {reservation.customerPhone && (
                        <div className="text-sm text-gray-600">{reservation.customerPhone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(reservation.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{reservation.guestCount}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {reservation.table?.name || 'Not assigned'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}>
                        {reservation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {reservation.status === 'CONFIRMED' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateReservationStatus(reservation.id, 'SEATED')}
                            className="text-green-600 hover:text-green-900 font-medium text-sm"
                          >
                            Seat
                          </button>
                          <button
                            onClick={() => updateReservationStatus(reservation.id, 'CANCELLED')}
                            className="text-red-600 hover:text-red-900 font-medium text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Waitlist Tab */}
        {activeTab === 'waitlist' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Guests
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estimated Wait
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {waitlist.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{entry.customerName}</div>
                      {entry.customerPhone && (
                        <div className="text-sm text-gray-600">{entry.customerPhone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{entry.guestCount}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {entry.estimatedWait ? `${entry.estimatedWait} min` : 'TBD'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {entry.status === 'WAITING' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateWaitlistStatus(entry.id, 'CALLED')}
                            className="text-blue-600 hover:text-blue-900 font-medium text-sm"
                          >
                            Call
                          </button>
                          <button
                            onClick={() => updateWaitlistStatus(entry.id, 'SEATED')}
                            className="text-green-600 hover:text-green-900 font-medium text-sm"
                          >
                            Seat
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Reservation Modal */}
        {showReservationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">New Reservation</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={newReservation.customerName}
                    onChange={(e) => setNewReservation({ ...newReservation, customerName: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={newReservation.customerPhone}
                    onChange={(e) => setNewReservation({ ...newReservation, customerPhone: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Guest Count</label>
                  <input
                    type="number"
                    value={newReservation.guestCount}
                    onChange={(e) => setNewReservation({ ...newReservation, guestCount: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newReservation.date}
                    onChange={(e) => setNewReservation({ ...newReservation, date: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input
                    type="time"
                    value={newReservation.time}
                    onChange={(e) => setNewReservation({ ...newReservation, time: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests</label>
                  <textarea
                    value={newReservation.specialRequests}
                    onChange={(e) => setNewReservation({ ...newReservation, specialRequests: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    rows={3}
                    placeholder="Any special requests?"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowReservationModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={createReservation}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Waitlist Modal */}
        {showWaitlistModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Add to Waitlist</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={newWaitlistEntry.customerName}
                    onChange={(e) => setNewWaitlistEntry({ ...newWaitlistEntry, customerName: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={newWaitlistEntry.customerPhone}
                    onChange={(e) => setNewWaitlistEntry({ ...newWaitlistEntry, customerPhone: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Guest Count</label>
                  <input
                    type="number"
                    value={newWaitlistEntry.guestCount}
                    onChange={(e) => setNewWaitlistEntry({ ...newWaitlistEntry, guestCount: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={newWaitlistEntry.notes}
                    onChange={(e) => setNewWaitlistEntry({ ...newWaitlistEntry, notes: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    rows={3}
                    placeholder="Any notes?"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowWaitlistModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={addToWaitlist}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
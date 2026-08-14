import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'

interface Reservation {
  id: string
  customerName: string
  customerPhone?: string
  customerEmail?: string
  guestCount: number
  date: string
  time: string
  status: 'PENDING' | 'CONFIRMED' | 'SEATED' | 'CANCELLED' | 'NO_SHOW'
  notes?: string
  specialRequests?: string
  table?: { id: string; name: string; seats: number }
}

interface WaitlistEntry {
  id: string
  customerName: string
  customerPhone?: string
  guestCount: number
  status: 'WAITING' | 'CALLED' | 'SEATED' | 'CANCELLED'
  estimatedWait?: number
  notes?: string
  createdAt: string
}

export default function Reservations() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [activeTab, setActiveTab] = useState<'reservations' | 'waitlist'>('reservations')
  const [showReservationModal, setShowReservationModal] = useState(false)
  const [showWaitlistModal, setShowWaitlistModal] = useState(false)

  const loadData = useCallback(async () => {
    try {
      if (activeTab === 'reservations') {
        const res = await api.get('/reservations', { params: { date: selectedDate } })
        setReservations(res.data)
      } else {
        const res = await api.get('/reservations/waitlist')
        setWaitlist(res.data)
      }
    } catch (error) { console.error(error) } finally { setLoading(false) }
  }, [activeTab, selectedDate])

  useEffect(() => { loadData() }, [loadData])

  const updateStatus = async (id: string, status: string, type: 'reservation' | 'waitlist') => {
    try {
      await api.put(`/reservations/${type === 'reservation' ? id : `waitlist/${id}`}/status`, { status })
      loadData()
    } catch (error) { alert('Update failed') }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-800'
      case 'SEATED': return 'bg-blue-100 text-blue-800'
      case 'CANCELLED': return 'bg-gray-100 text-gray-800'
      case 'NO_SHOW': return 'bg-red-100 text-red-800'
      case 'WAITING': return 'bg-yellow-100 text-yellow-800'
      case 'CALLED': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reservations & Waitlist</h1>
          <p className="text-sm text-gray-500 mt-1">Manage reservations and waitlist entries</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowWaitlistModal(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">👥 Add to Waitlist</button>
          <button onClick={() => setShowReservationModal(true)} className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition">+ New Reservation</button>
        </div>
      </div>

      <div className="flex gap-4 flex-wrap">
        <button onClick={() => setActiveTab('reservations')} className={`px-6 py-2.5 rounded-lg font-medium transition ${activeTab === 'reservations' ? 'bg-orange-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}`}>Reservations ({reservations.length})</button>
        <button onClick={() => setActiveTab('waitlist')} className={`px-6 py-2.5 rounded-lg font-medium transition ${activeTab === 'waitlist' ? 'bg-orange-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}`}>Waitlist ({waitlist.length})</button>
        {activeTab === 'reservations' && (
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="px-4 py-2.5 border border-gray-300 rounded-lg" />
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === 'reservations' ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guests</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Table</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reservations.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{r.customerName}</div>
                      {r.customerPhone && <div className="text-sm text-gray-500">{r.customerPhone}</div>}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{new Date(r.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="px-6 py-4 text-gray-600">{r.guestCount}</td>
                    <td className="px-6 py-4 text-gray-600">{r.table?.name || 'Not assigned'}</td>
                    <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(r.status)}`}>{r.status}</span></td>
                    <td className="px-6 py-4">
                      {r.status === 'CONFIRMED' && <div className="flex gap-2"><button onClick={() => updateStatus(r.id, 'SEATED', 'reservation')} className="text-green-600 hover:text-green-900 text-sm font-medium">Seat</button><button onClick={() => updateStatus(r.id, 'CANCELLED', 'reservation')} className="text-red-600 hover:text-red-900 text-sm font-medium">Cancel</button></div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guests</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Est. Wait</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {waitlist.map(w => (
                  <tr key={w.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{w.customerName}</div>
                      {w.customerPhone && <div className="text-sm text-gray-500">{w.customerPhone}</div>}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{w.guestCount}</td>
                    <td className="px-6 py-4 text-gray-600">{w.estimatedWait ? `${w.estimatedWait} min` : 'TBD'}</td>
                    <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(w.status)}`}>{w.status}</span></td>
                    <td className="px-6 py-4">
                      {w.status === 'WAITING' && <div className="flex gap-2"><button onClick={() => updateStatus(w.id, 'CALLED', 'waitlist')} className="text-blue-600 hover:text-blue-900 text-sm font-medium">Call</button><button onClick={() => updateStatus(w.id, 'SEATED', 'waitlist')} className="text-green-600 hover:text-green-900 text-sm font-medium">Seat</button></div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showReservationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold mb-4">New Reservation</h2>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const form = e.target as HTMLFormElement
              const data = { customerName: (form.elements.namedItem('name') as HTMLInputElement).value, customerPhone: (form.elements.namedItem('phone') as HTMLInputElement).value, guestCount: parseInt((form.elements.namedItem('guests') as HTMLInputElement).value), date: (form.elements.namedItem('date') as HTMLInputElement).value, time: (form.elements.namedItem('time') as HTMLInputElement).value, specialRequests: (form.elements.namedItem('requests') as HTMLTextAreaElement).value }
              try { await api.post('/reservations', data); setShowReservationModal(false); loadData() } catch (error) { alert('Failed') }
            }}>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700">Name</label><input name="name" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" required /></div>
                <div><label className="block text-sm font-medium text-gray-700">Phone</label><input name="phone" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700">Guests</label><input name="guests" type="number" defaultValue={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" required /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700">Date</label><input name="date" type="date" defaultValue={selectedDate} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" required /></div>
                  <div><label className="block text-sm font-medium text-gray-700">Time</label><input name="time" type="time" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" required /></div>
                </div>
                <div><label className="block text-sm font-medium text-gray-700">Special Requests</label><textarea name="requests" rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" /></div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowReservationModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showWaitlistModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold mb-4">Add to Waitlist</h2>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const form = e.target as HTMLFormElement
              const data = { customerName: (form.elements.namedItem('name') as HTMLInputElement).value, customerPhone: (form.elements.namedItem('phone') as HTMLInputElement).value, guestCount: parseInt((form.elements.namedItem('guests') as HTMLInputElement).value), notes: (form.elements.namedItem('notes') as HTMLTextAreaElement).value }
              try { await api.post('/reservations/waitlist', data); setShowWaitlistModal(false); loadData() } catch (error) { alert('Failed') }
            }}>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700">Name</label><input name="name" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" required /></div>
                <div><label className="block text-sm font-medium text-gray-700">Phone</label><input name="phone" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700">Guests</label><input name="guests" type="number" defaultValue={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" required /></div>
                <div><label className="block text-sm font-medium text-gray-700">Notes</label><textarea name="notes" rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" /></div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowWaitlistModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
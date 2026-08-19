import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'
import { Calendar, Clock, Users, Phone, Plus, UserPlus, CheckCircle, XCircle, Bell, Clock as WaitClock } from 'lucide-react'

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
      case 'CONFIRMED': return 'bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 text-green-700 dark:text-green-400'
      case 'SEATED': return 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-700 dark:text-blue-400'
      case 'CANCELLED': return 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300'
      case 'NO_SHOW': return 'bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 text-red-700 dark:text-red-400'
      case 'WAITING': return 'bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30 text-yellow-700 dark:text-yellow-400'
      case 'CALLED': return 'bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 text-orange-700 dark:text-orange-400'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return <CheckCircle className="h-3 w-3" />
      case 'SEATED': return <Users className="h-3 w-3" />
      case 'CANCELLED': return <XCircle className="h-3 w-3" />
      case 'NO_SHOW': return <XCircle className="h-3 w-3" />
      case 'WAITING': return <WaitClock className="h-3 w-3" />
      case 'CALLED': return <Bell className="h-3 w-3" />
      default: return <Clock className="h-3 w-3" />
    }
  }

  if (loading) return <div className="flex justify-center p-12"><div className="relative"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div><div className="absolute top-0 left-0 animate-ping rounded-full h-12 w-12 border-2 border-orange-400 opacity-20"></div></div></div>

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Reservations & Waitlist</h1>
          <p className="text-sm text-gray-500 mt-2">Manage reservations and waitlist entries</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowWaitlistModal(true)} className="flex items-center gap-2 bg-linear-to-r from-blue-500 to-blue-600 text-white px-5 py-2.5 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 hover:scale-105 shadow-lg shadow-blue-500/30">
            <UserPlus className="h-5 w-5" /> Add to Waitlist
          </button>
          <button onClick={() => setShowReservationModal(true)} className="flex items-center gap-2 bg-linear-to-r from-orange-500 to-orange-600 text-white px-5 py-2.5 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 hover:scale-105 shadow-lg shadow-orange-500/30">
            <Plus className="h-5 w-5" /> New Reservation
          </button>
        </div>
      </div>

      <div className="flex gap-4 flex-wrap">
        <button onClick={() => setActiveTab('reservations')} className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${activeTab === 'reservations' ? 'bg-linear-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'}`}>
          <Calendar className="h-4 w-4 inline mr-2" />
          Reservations ({reservations.length})
        </button>
        <button onClick={() => setActiveTab('waitlist')} className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${activeTab === 'waitlist' ? 'bg-linear-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'}`}>
          <Users className="h-4 w-4 inline mr-2" />
          Waitlist ({waitlist.length})
        </button>
        {activeTab === 'reservations' && (
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 transition-all duration-200" />
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <div className="overflow-x-auto">
          {activeTab === 'reservations' ? (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Guests</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Table</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {reservations.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{r.customerName.charAt(0)}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">{r.customerName}</div>
                          {r.customerPhone && <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1"><Phone className="h-3 w-3" />{r.customerPhone}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {new Date(r.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">{r.guestCount}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{r.table?.name || 'Not assigned'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full ${getStatusColor(r.status)}`}>
                        {getStatusIcon(r.status)}
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {r.status === 'CONFIRMED' && (
                        <div className="flex gap-2">
                          <button onClick={() => updateStatus(r.id, 'SEATED', 'reservation')} className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 text-sm font-semibold transition-colors">Seat</button>
                          <button onClick={() => updateStatus(r.id, 'CANCELLED', 'reservation')} className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 text-sm font-semibold transition-colors">Cancel</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Guests</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Est. Wait</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {waitlist.map(w => (
                  <tr key={w.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30 flex items-center justify-center">
                          <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">{w.customerName.charAt(0)}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">{w.customerName}</div>
                          {w.customerPhone && <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1"><Phone className="h-3 w-3" />{w.customerPhone}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">{w.guestCount}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <WaitClock className="h-4 w-4" />
                      {w.estimatedWait ? `${w.estimatedWait} min` : 'TBD'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full ${getStatusColor(w.status)}`}>
                        {getStatusIcon(w.status)}
                        {w.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {w.status === 'WAITING' && (
                        <div className="flex gap-2">
                          <button onClick={() => updateStatus(w.id, 'CALLED', 'waitlist')} className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 text-sm font-semibold transition-colors">Call</button>
                          <button onClick={() => updateStatus(w.id, 'SEATED', 'waitlist')} className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 text-sm font-semibold transition-colors">Seat</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showReservationModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 transform transition-all">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">New Reservation</h2>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const form = e.target as HTMLFormElement
              const data = { customerName: (form.elements.namedItem('name') as HTMLInputElement).value, customerPhone: (form.elements.namedItem('phone') as HTMLInputElement).value, guestCount: parseInt((form.elements.namedItem('guests') as HTMLInputElement).value), date: (form.elements.namedItem('date') as HTMLInputElement).value, time: (form.elements.namedItem('time') as HTMLInputElement).value, specialRequests: (form.elements.namedItem('requests') as HTMLTextAreaElement).value }
              try { await api.post('/reservations', data); setShowReservationModal(false); loadData() } catch (error) { alert('Failed') }
            }}>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                  <input name="name" className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 transition-all duration-200" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                  <input name="phone" className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 transition-all duration-200" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Guests</label>
                  <input name="guests" type="number" defaultValue={2} className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 transition-all duration-200" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date</label>
                    <input name="date" type="date" defaultValue={selectedDate} className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 transition-all duration-200" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time</label>
                    <input name="time" type="time" className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 transition-all duration-200" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Special Requests</label>
                  <textarea name="requests" rows={3} className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 transition-all duration-200" />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setShowReservationModal(false)} className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-linear-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showWaitlistModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 transform transition-all">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Add to Waitlist</h2>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const form = e.target as HTMLFormElement
              const data = { customerName: (form.elements.namedItem('name') as HTMLInputElement).value, customerPhone: (form.elements.namedItem('phone') as HTMLInputElement).value, guestCount: parseInt((form.elements.namedItem('guests') as HTMLInputElement).value), notes: (form.elements.namedItem('notes') as HTMLTextAreaElement).value }
              try { await api.post('/reservations/waitlist', data); setShowWaitlistModal(false); loadData() } catch (error) { alert('Failed') }
            }}>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                  <input name="name" className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 transition-all duration-200" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                  <input name="phone" className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 transition-all duration-200" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Guests</label>
                  <input name="guests" type="number" defaultValue={2} className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 transition-all duration-200" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
                  <textarea name="notes" rows={3} className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 transition-all duration-200" />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setShowWaitlistModal(false)} className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-linear-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
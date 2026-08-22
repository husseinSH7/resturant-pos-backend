import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'
import { Calendar, Clock, Users, Phone, Plus, UserPlus, CheckCircle, XCircle, Bell, Clock as WaitClock, Loader2, X } from 'lucide-react'

interface Reservation {
  id: string
  customerName: string
  customerPhone?: string
  customerEmail?: string
  guestCount: number
  date: string // ISO string
  time: string // ISO string
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
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setError('')
      if (activeTab === 'reservations') {
        const res = await api.get('/reservations', { params: { date: selectedDate } })
        setReservations(res.data)
      } else {
        const res = await api.get('/reservations/waitlist')
        setWaitlist(res.data)
      }
    } catch (err: any) {
      console.error(err)
      setError(err?.response?.data?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [activeTab, selectedDate])

  useEffect(() => { loadData() }, [loadData])

  const updateStatus = async (id: string, status: string, type: 'reservation' | 'waitlist') => {
    try {
      const endpoint = type === 'reservation' 
        ? `/reservations/${id}/status` 
        : `/reservations/waitlist/${id}/status`
      await api.put(endpoint, { status })
      loadData()
    } catch (err: any) {
      alert('Update failed: ' + (err?.response?.data?.message || err.message))
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-900/30 text-green-400 border-green-700'
      case 'SEATED': return 'bg-blue-900/30 text-blue-400 border-blue-700'
      case 'CANCELLED': return 'bg-gray-700 text-gray-300 border-gray-600'
      case 'NO_SHOW': return 'bg-red-900/30 text-red-400 border-red-700'
      case 'WAITING': return 'bg-yellow-900/30 text-yellow-400 border-yellow-700'
      case 'CALLED': return 'bg-orange-900/30 text-orange-400 border-orange-700'
      default: return 'bg-gray-700 text-gray-300 border-gray-600'
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

  const handleCreateReservation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const form = e.currentTarget
    const name = (form.elements.namedItem('name') as HTMLInputElement).value
    const phone = (form.elements.namedItem('phone') as HTMLInputElement).value
    const guests = parseInt((form.elements.namedItem('guests') as HTMLInputElement).value)
    const date = (form.elements.namedItem('date') as HTMLInputElement).value // YYYY-MM-DD
    const time = (form.elements.namedItem('time') as HTMLInputElement).value // HH:mm
    const requests = (form.elements.namedItem('requests') as HTMLTextAreaElement).value

    // Ensure time is in HH:mm format (pad with leading zero if needed)
    const formattedTime = time.length === 4 ? `0${time}` : time

    const payload = {
      customerName: name,
      customerPhone: phone || undefined,
      guestCount: guests,
      date: date, // YYYY-MM-DD
      time: formattedTime, // HH:mm
      specialRequests: requests || undefined,
    }

    console.log('📤 Sending reservation payload:', payload) // Debug

    try {
      const response = await api.post('/reservations', payload)
      console.log('✅ Reservation created:', response.data)
      setShowReservationModal(false)
      loadData()
    } catch (err: any) {
      console.error('❌ Error creating reservation:', err)
      alert('Failed to create reservation: ' + (err?.response?.data?.message || err.message))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddToWaitlist = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const form = e.currentTarget
    const name = (form.elements.namedItem('name') as HTMLInputElement).value
    const phone = (form.elements.namedItem('phone') as HTMLInputElement).value
    const guests = parseInt((form.elements.namedItem('guests') as HTMLInputElement).value)
    const notes = (form.elements.namedItem('notes') as HTMLTextAreaElement).value

    const payload = {
      customerName: name,
      customerPhone: phone || undefined,
      guestCount: guests,
      notes: notes || undefined,
    }

    console.log('📤 Sending waitlist payload:', payload)

    try {
      await api.post('/reservations/waitlist', payload)
      setShowWaitlistModal(false)
      loadData()
    } catch (err: any) {
      alert('Failed to add to waitlist: ' + (err?.response?.data?.message || err.message))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Reservations & Waitlist</h1>
          <p className="text-sm text-gray-400 mt-1">Manage reservations and waitlist entries</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowWaitlistModal(true)}
            className="flex items-center gap-2 b-linear-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition shadow-lg shadow-blue-500/30"
          >
            <UserPlus className="h-5 w-5" /> Add to Waitlist
          </button>
          <button
            onClick={() => setShowReservationModal(true)}
            className="flex items-center gap-2 bg-linear-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-orange-700 transition shadow-lg shadow-orange-500/30"
          >
            <Plus className="h-5 w-5" /> New Reservation
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        <button
          onClick={() => setActiveTab('reservations')}
          className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
            activeTab === 'reservations'
              ? 'bg-linear-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
          }`}
        >
          <Calendar className="h-4 w-4 inline mr-2" />
          Reservations ({reservations.length})
        </button>
        <button
          onClick={() => setActiveTab('waitlist')}
          className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
            activeTab === 'waitlist'
              ? 'bg-linear-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
          }`}
        >
          <Users className="h-4 w-4 inline mr-2" />
          Waitlist ({waitlist.length})
        </button>
        {activeTab === 'reservations' && (
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 text-white transition-all duration-200"
          />
        )}
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === 'reservations' ? (
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Guests</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Table</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {reservations.map(r => (
                  <tr key={r.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-900/30 flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-400">{r.customerName.charAt(0)}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-white">{r.customerName}</div>
                          {r.customerPhone && (
                            <div className="text-sm text-gray-400 flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {r.customerPhone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        {new Date(r.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white font-medium">{r.guestCount}</td>
                    <td className="px-6 py-4 text-gray-300">{r.table?.name || 'Not assigned'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border ${getStatusColor(r.status)}`}>
                        {getStatusIcon(r.status)}
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {r.status === 'CONFIRMED' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateStatus(r.id, 'SEATED', 'reservation')}
                            className="text-green-400 hover:text-green-300 text-sm font-semibold transition-colors"
                          >
                            Seat
                          </button>
                          <button
                            onClick={() => updateStatus(r.id, 'CANCELLED', 'reservation')}
                            className="text-red-400 hover:text-red-300 text-sm font-semibold transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {reservations.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                      No reservations for this date.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Guests</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Est. Wait</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {waitlist.map(w => (
                  <tr key={w.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-yellow-900/30 flex items-center justify-center">
                          <span className="text-sm font-bold text-yellow-400">{w.customerName.charAt(0)}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-white">{w.customerName}</div>
                          {w.customerPhone && (
                            <div className="text-sm text-gray-400 flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {w.customerPhone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white font-medium">{w.guestCount}</td>
                    <td className="px-6 py-4 text-gray-300">
                      <div className="flex items-center gap-2">
                        <WaitClock className="h-4 w-4 text-gray-500" />
                        {w.estimatedWait ? `${w.estimatedWait} min` : 'TBD'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border ${getStatusColor(w.status)}`}>
                        {getStatusIcon(w.status)}
                        {w.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {w.status === 'WAITING' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateStatus(w.id, 'CALLED', 'waitlist')}
                            className="text-blue-400 hover:text-blue-300 text-sm font-semibold transition-colors"
                          >
                            Call
                          </button>
                          <button
                            onClick={() => updateStatus(w.id, 'SEATED', 'waitlist')}
                            className="text-green-400 hover:text-green-300 text-sm font-semibold transition-colors"
                          >
                            Seat
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {waitlist.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                      Waitlist is empty.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* New Reservation Modal */}
      {showReservationModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">New Reservation</h2>
              <button
                onClick={() => setShowReservationModal(false)}
                className="p-1 hover:bg-gray-700 rounded-lg"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleCreateReservation}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Name *</label>
                  <input
                    name="name"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
                  <input
                    name="phone"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Guests *</label>
                  <input
                    name="guests"
                    type="number"
                    defaultValue={2}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Date *</label>
                    <input
                      name="date"
                      type="date"
                      defaultValue={selectedDate}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Time *</label>
                    <input
                      name="time"
                      type="time"
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Special Requests</label>
                  <textarea
                    name="requests"
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowReservationModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 text-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-linear-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 flex items-center justify-center gap-2 disabled:opacity-50 transition"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add to Waitlist Modal */}
      {showWaitlistModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Add to Waitlist</h2>
              <button
                onClick={() => setShowWaitlistModal(false)}
                className="p-1 hover:bg-gray-700 rounded-lg"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleAddToWaitlist}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Name *</label>
                  <input
                    name="name"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
                  <input
                    name="phone"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Guests *</label>
                  <input
                    name="guests"
                    type="number"
                    defaultValue={2}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
                  <textarea
                    name="notes"
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-white"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowWaitlistModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 text-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-linear-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 flex items-center justify-center gap-2 disabled:opacity-50 transition"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
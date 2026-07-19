import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Ticket, MapPin, Clock, Navigation, Download, QrCode, X, Ban, Lock, Star, AlertTriangle, CheckCircle, CreditCard, FilterX, IndianRupee, Trash2, Tag } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'
import { getLockedSeats, getMyBookings, markRideComplete, createExitPaymentSession } from '../api/booking.api'
import { getMyWaitlist, removeFromWaitlist } from '../api/waitlist.api'
import { useNavigate, Link } from 'react-router-dom'
import ReviewForm from '../components/ReviewForm'
import DisputeFineModal from '../components/DisputeFineModal'
import api from '../api/axios'

// 🔥 Theme 1: Corporate Blue | Theme 2: Indigo
const PRIMARY_COLOR = '#0F4C75'

export default function Bookings() {
  const { user, cancelBooking } = useAuth()
  const [bookings, setBookings] = useState([])
  const [waitlists, setWaitlists] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('upcoming')
  const [showQR, setShowQR] = useState(null)
  const [lockedSeats, setLockedSeats] = useState([])
  const [reviewBooking, setReviewBooking] = useState(null)
  const [disputeModal, setDisputeModal] = useState(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (activeTab === 'upcoming') {
      const interval = setInterval(() => {
        fetchAllData()
      }, 8000)
      return () => clearInterval(interval)
    }
  }, [activeTab])

  const [filters, setFilters] = useState({
    status: 'all',
    pnr: '',
    date: '',
    page: 1
  })
  const [totalPages, setTotalPages] = useState(1)
  const navigate = useNavigate()

  useEffect(() => {
    if (localStorage.getItem('token') &&!hasFetched.current) {
      hasFetched.current = true
      fetchAllData()
      fetchLockedSeats()
      const interval = setInterval(fetchLockedSeats, 30000)
      return () => clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    if (hasFetched.current) {
      fetchAllData()
    }
  }, [filters.page, filters.status, filters.pnr, filters.date])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      console.log('Filters sent:', filters)

      const [bookingsRes, waitlistRes] = await Promise.all([
        getMyBookings({...filters, status: 'all' }),
        getMyWaitlist()
      ])

      console.log('Full API Response:', bookingsRes.data)

      const rawBookings = bookingsRes.data?.data?.data || []

      // faka object bad dao - Google Translate bug fix
      const validBookings = rawBookings.filter(b => b && (b._id || b.id))

      const bookingsArray = validBookings.map(b => ({
       ...b,
        id: b._id || b.id,
        _id: b._id || b.id
      }))

      setBookings(bookingsArray)

      const rawWaitlists = waitlistRes.data?.data?.data || waitlistRes.data?.data || []
      setWaitlists(rawWaitlists.map(w => ({...w, _id: w._id || w.id })))

      setTotalPages(bookingsRes.data?.data?.totalPages || bookingsRes.data?.totalPages || 1)

    } catch (err) {
      console.log(err)
      toast.error('Failed to fetch bookings')
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  const fetchLockedSeats = async () => {
    try {
      const res = await getLockedSeats()
      setLockedSeats(res.data?.lockedSeats || [])
    } catch (err) {
      console.log(err)
    }
  }

  // PayU Exit Payment
  const handlePayExit = async (bookingId) => {
    if (!bookingId) {
      toast.error("Booking ID missing. Refresh page.")
      return
    }
    try {
      const res = await createExitPaymentSession(bookingId)
      const payuData = res.data

      const form = document.createElement('form')
      form.method = 'POST'
      form.action = payuData.action
      form.style.display = 'none'

      Object.keys(payuData).forEach(key => {
        if (key!== 'action') {
          const input = document.createElement('input')
          input.type = 'hidden'
          input.name = key
          input.value = payuData[key]
          form.appendChild(input)
        }
      })

      document.body.appendChild(form)
      form.submit()
    } catch (err) {
      toast.error('Failed to create payment session')
    }
  }

  const checkPaymentStatus = async (bookingId) => {
    if (!bookingId) {
      toast.error("Booking ID missing")
      return
    }
    try {
      const res = await api.get(`/bookings/${bookingId}`)
      const updatedBooking = res.data?.data || res.data

      setShowQR(updatedBooking)
      fetchAllData()

      if (updatedBooking.paymentStatus === 'Paid') {
        toast.success('Payment confirmed! Exit code ready')
      } else {
        toast.error('Payment not found yet. Check after a minute')
      }
    } catch (err) {
      toast.error('Failed to check payment')
    }
  }

  const handleCancelWaitlist = async (waitlistId) => {
    if (!confirm('Remove from waitlist?')) return
    try {
      await removeFromWaitlist(waitlistId)
      toast.success('Removed from waitlist')
      fetchAllData()
    } catch (err) {
      toast.error('Failed to remove')
    }
  }

  const handleCompleteRide = async (bookingId) => {
    if (!bookingId) {
      toast.error("Booking ID missing")
      return
    }
    if (!confirm('Mark this ride as completed?')) return
    try {
      await markRideComplete(bookingId)
      toast.success('Ride completed! Please rate your journey')
      fetchAllData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete')
    }
  }

  const handleDeleteHistory = async (bookingId) => {
    if (!bookingId) {
      toast.error("Booking ID missing")
      return
    }
    if (!confirm('Remove this booking from history?')) return
    try {
      await api.delete(`/bookings/${bookingId}/history`)
      toast.success('Removed from history')
      fetchAllData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete')
    }
  }

  const handleClearAllHistory = async () => {
    try {
      const res = await api.delete('/bookings/history/clear-all')
      toast.success(res.data.message)
      setShowClearConfirm(false)
      fetchAllData()
    } catch (err) {
      toast.error('Failed to clear history')
    }
  }

  const groupLockedSeatsByBus = (locks) => {
    const grouped = {}
    locks.forEach(lock => {
      const key = `${lock.busId}_${lock.journeyDate}`
      if (!grouped[key]) {
        grouped[key] = {
          key,
          busId: lock.busId,
          busName: lock.busName,
          from: lock.from,
          to: lock.to,
          journeyDate: lock.journeyDate,
          price: lock.price,
          seats: [],
          expiresAt: lock.expiresAt
        }
      }
      grouped[key].seats.push(lock.seatNumber)
      if (new Date(lock.expiresAt) < new Date(grouped[key].expiresAt)) {
        grouped[key].expiresAt = lock.expiresAt
      }
    })
    return Object.values(grouped)
  }

  const clearAllFilters = () => {
    setFilters({ status: 'all', pnr: '', date: '', page: 1 })
    toast.success('Filters cleared')
  }

  if (loading && bookings.length === 0) return <div className="text-gray-900 text-center py-20">Loading...</div>

  const safeBookings = Array.isArray(bookings)? bookings : []

  const canCancel = (booking) => {
    if (!booking ||!booking._id) return false
    if (booking.status!== 'Confirmed' && booking.status!== 'PendingPayment') return false
    if (!booking.bus) return false
    const journeyDateTime = new Date(booking.journeyDate)
    const hoursLeft = (journeyDateTime - new Date()) / (1000 * 60 * 60)
    return hoursLeft > 2
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const boardedBookings = safeBookings.filter(b => b?.status === 'Boarded')

  const upcomingBookings = safeBookings.filter(b => {
    if (!b ||!b._id) return false
    const isActive = b.status === 'Confirmed' || b.status === 'PendingPayment'
    if (!isActive) return false
    const bookingDate = new Date(b.journeyDate)
    bookingDate.setHours(0, 0, 0, 0)
    return bookingDate >= today &&!b.boardedAt &&!b.completedAt
  })

  const completedBookings = safeBookings.filter(b => {
    if (!b ||!b._id) return false
    if (b?.status === 'Completed' || b?.status === 'Cancelled' || b?.completedAt) return true
    const bookingDate = new Date(b?.journeyDate)
    bookingDate.setHours(0, 0, 0, 0)
    return bookingDate < today && (b?.status === 'Confirmed' || b?.status === 'PendingPayment')
  })

  const cancelledBookings = safeBookings.filter(b => b?.status === 'Cancelled')

  const tabs = [
    { key: 'upcoming', label: 'Upcoming', count: upcomingBookings.length },
    { key: 'boarded', label: 'On Trip', count: boardedBookings.length },
    { key: 'waitlist', label: 'Waitlist', count: waitlists.length },
    { key: 'locked', label: 'Locked', count: lockedSeats.length },
    { key: 'completed', label: 'History', count: completedBookings.length },
    { key: 'cancelled', label: 'Cancelled', count: cancelledBookings.length },
  ]

  const getStatusInfo = (booking) => {
    if (!booking) return { text: 'Unknown', color: 'bg-gray-100 text-gray-700 border-gray-200' }
    if (booking.status === 'Cancelled')
      return { text: 'Cancelled', color: 'bg-red-100 text-red-700 border-red-200' }
    if (booking.status === 'Completed' || booking.completedAt)
      return { text: 'Completed', color: 'bg-gray-100 text-gray-700 border-gray-200' }
    if (booking.status === 'Boarded')
      return { text: 'On Trip', color: 'bg-blue-100 text-blue-700 border-blue-200' }
    if (booking.status === 'PendingPayment')
      return { text: 'Payment Pending', color: 'bg-orange-100 text-orange-700 border-orange-200' }
    if (booking.status === 'Pending')
      return { text: 'Pending', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' }

    const bookingDate = new Date(booking.journeyDate)
    bookingDate.setHours(0, 0, 0, 0)
    if (booking.status === 'Confirmed' && bookingDate < today)
      return { text: 'Expired', color: 'bg-orange-100 text-orange-700 border-orange-200' }

    return { text: 'Confirmed', color: 'bg-green-100 text-green-700 border-green-200' }
  }

  const getTimeLeft = (expiresAt) => {
    const diff = new Date(expiresAt) - new Date()
    if (diff <= 0) return 'Expired'
    const mins = Math.floor(diff / 60000)
    const secs = Math.floor((diff % 60000) / 1000)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleCancel = async (bookingId) => {
    if (!bookingId) {
      toast.error("Booking ID missing")
      return
    }
    if (!confirm('Are you sure you want to cancel this booking? Refund will be processed.')) return
    try {
      await cancelBooking(bookingId)
      toast.success('Booking cancelled & refunded')
      fetchAllData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancel failed')
    }
  }

  const filteredBookings = activeTab === 'upcoming'? upcomingBookings :
    activeTab === 'boarded'? boardedBookings :
      activeTab === 'completed'? completedBookings :
        activeTab === 'cancelled'? cancelledBookings : []

  const hasActiveFilters = filters.status!== 'all' || filters.pnr || filters.date

  console.log('Safe Bookings:', safeBookings)
  console.log('Upcoming:', upcomingBookings)
  console.log('Completed:', completedBookings)
  console.log('Active Tab:', activeTab)
  console.log('Filtered for render:', filteredBookings)

  const renderAmountSection = (booking) => (
    <div>
      <p className="text-gray-500 text-xs">Amount</p>
      {booking.discount > 0? (
        <div>
          <p className="text-gray-900 font-bold">₹{booking.totalAmount}</p>
          <p className="text-green-600 text-xs flex items-center gap-1">
            <Tag className="w-3 h-3" />
            Saved ₹{booking.discount}
          </p>
          {booking.couponCode && (
            <p className="text-gray-500 text-xs">Code: {booking.couponCode}</p>
          )}
        </div>
      ) : (
        <p className="text-gray-900 font-bold">₹{booking.totalAmount}</p>
      )}
    </div>
  )

  const renderBookingCard = (booking, showCancelBtn = false, isUpcoming = false) => {
    if (!booking ||!booking._id) return null

    const status = getStatusInfo(booking)
    const isModeA = booking.paymentType === 'pay_after_ride'
    const isPaymentPending = isModeA && booking.paymentStatus === 'Pending'

    return (
      <div key={booking._id} className="bg-white border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {booking.bus?.busName || 'Bus Deleted'}
              {!booking.bus && <span className="text-xs text-red-600 ml-2">(Deleted)</span>}
            </h3>
            <p className="text-gray-600">
              {booking.bus?.from || booking.boardingPoint} → {booking.bus?.to || booking.droppingPoint} • {new Date(booking.journeyDate).toLocaleDateString('en-GB')}
            </p>
            <p className="text-gray-500 text-sm mt-1">PNR: {booking.pnr}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`px-3 py-1 rounded-md text-sm font-semibold border ${status.color}`}>
              {status.text}
            </span>

            {isModeA && (
              <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-md text-xs font-bold border-yellow-200">
                Public Bus
              </span>
            )}

            {isPaymentPending && (
              <div className="bg-orange-100 border-orange-300 px-3 py-1 rounded-md">
                <span className="text-orange-700 text-xs font-bold flex items-center gap-1">
                  <IndianRupee className="w-3 h-3" />
                  Payment Pending
                </span>
              </div>
            )}

            {booking.fineStatus === 'pending' && (
              <div className="bg-orange-100 border-orange-300 px-3 py-1 rounded-md">
                <span className="text-orange-700 text-xs font-bold">₹{booking.fineAmount} Fine Due</span>
              </div>
            )}

            {booking.fineStatus === 'paid' && (
              <div className="bg-green-100 border-green-300 px-3 py-1 rounded-md">
                <span className="text-green-700 text-xs font-bold">Fine Paid</span>
              </div>
            )}
          </div>
        </div>

        {isPaymentPending && (
          <div className="mb-4 p-4 bg-orange-50 border-orange-200 rounded-lg">
            <div className="flex items-start gap-3 mb-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-gray-900 font-bold text-sm mb-1">Payment Required Before Exit</p>
                <p className="text-gray-600 text-xs">Pay online now to get your exit code instantly</p>
                <p className="text-2xl font-bold text-orange-600 mt-2">₹{booking.totalAmount}</p>
              </div>
            </div>
            <button
          onClick={() => {
            if (!booking?._id) {
              toast.error("Booking ID missing. Refresh page.")
              return
            }
            navigate(`/pay-on-exit/${booking._id}`)  // PayPage e niye jabe
          }}
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-lg font-bold"
        >
          Pay Before Exit
        </button>
          </div>
        )}

        {booking.fineStatus === 'pending' && booking._id && (
          <div className="mb-4 p-4 bg-orange-50 border-orange-200 rounded-lg">
            <div className="flex items-start gap-3 mb-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-gray-900 font-bold text-sm mb-1">Over-Travel Fine</p>
                <p className="text-gray-600 text-xs">{booking.fineReason || 'Travelled beyond ticket destination'}</p>
                <p className="text-2xl font-bold text-orange-600 mt-2">₹{booking.fineAmount}</p>
              </div>
            </div>
            <button
              onClick={() => {
                if (!booking._id) {
                  toast.error("Booking ID missing. Refresh page.")
                  return
                }
                navigate(`/pay-fine/${booking._id}`)
              }}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2.5 rounded-lg font-bold flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Pay Fine Now
            </button>
          </div>
        )}

        {booking.fineStatus === 'paid' && (
          <div className="mb-4 p-3 bg-green-50 border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div className="flex-1">
              <p className="text-green-700 text-sm font-bold">Fine Paid ₹{booking.fineAmount}</p>
              <p className="text-gray-500 text-xs">
                Paid on {new Date(booking.finePaidAt).toLocaleDateString('en-GB')}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
          <div>
            <p className="text-gray-500 text-xs">Departure</p>
            <p className="text-gray-900 font-semibold">{booking.bus?.departureTime || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Seats</p>
            <p className="text-gray-900 font-semibold">{booking.seats?.join(', ')}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Passengers</p>
            <p className="text-gray-900 font-semibold">{booking.passengerDetails?.length || booking.seats?.length}</p>
          </div>
          {renderAmountSection(booking)}
        </div>

        {isUpcoming && booking._id && booking.bus?._id && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Link
              to={`/track/${booking.bus._id}`}
              className="text-white px-6 py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 w-full md:w-auto"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              <Navigation className="w-4 h-4" /> Track Bus Live
            </Link>
          </div>
        )}

        {booking.fineStatus === 'paid' &&!booking.fineDisputed && (
          <button
            onClick={() => setDisputeModal(booking)}
            className="mt-3 bg-red-50 hover:bg-red-100 text-red-600 border-red-200 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold w-full md:w-auto"
          >
            <AlertTriangle className="w-4 h-4" />
            Report Unfair Fine
          </button>
        )}

        {booking.fineDisputed && (
          <div className="mt-3 p-3 bg-orange-50 border-orange-200 rounded-lg">
            <p className="text-orange-700 text-sm font-bold">Fine Disputed</p>
            <p className="text-gray-600 text-xs mt-1 capitalize">Status: {booking.fineDisputeStatus}</p>
            {booking.fineDisputeStatus === 'resolved' && (
              <p className="text-green-600 text-xs mt-1">
                ✓ Resolved - Refund: ₹{booking.fineDisputeRefund}
              </p>
            )}
            {booking.fineDisputeStatus === 'rejected' && (
              <p className="text-red-600 text-xs mt-1">✗ Dispute Rejected</p>
            )}
          </div>
        )}

        <div className="flex gap-3 mt-4">
          {showCancelBtn && (
            <button
              onClick={() => handleCancel(booking._id)}
              className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold"
            >
              <Ban className="w-4 h-4" />
              Cancel
            </button>
          )}
          {(booking.paymentType === 'prepay' || booking.paymentStatus === 'Paid') && (
            <button
              onClick={() => setShowQR(booking)}
              className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold"
            >
              <QrCode className="w-4 h-4" />
              QR Code
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">My Bookings</h1>

        <div className="bg-gray-50 border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-700 text-sm font-medium">Filters</p>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1 text-red-600 hover:text-red-700 text-sm"
              >
                <FilterX className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Search PNR..."
              value={filters.pnr}
              onChange={(e) => setFilters({...filters, pnr: e.target.value, page: 1 })}
              className="px-4 py-2 bg-white border-gray-300 rounded-lg text-gray-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters({...filters, date: e.target.value, page: 1 })}
              className="px-4 py-2 bg-white border-gray-300 rounded-lg text-gray-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value, page: 1 })}
              className="px-4 py-2 bg-white border-gray-300 rounded-lg text-gray-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="Confirmed">Confirmed</option>
              <option value="PendingPayment">Payment Pending</option>
              <option value="Boarded">Boarded</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 mb-6 bg-gray-50 p-2 rounded-lg overflow-x-auto border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 px-4 rounded-md font-semibold transition-all whitespace-nowrap text-sm ${activeTab === tab.key
               ? 'text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                }`}
              style={activeTab === tab.key? { backgroundColor: PRIMARY_COLOR } : {}}
            >
              {tab.key === 'locked' && <Lock className="w-4 h-4 inline mr-1" />}
              {tab.key === 'waitlist' && <Clock className="w-4 h-4 inline mr-1" />}
              {tab.key === 'boarded' && <Navigation className="w-4 h-4 inline mr-1" />}
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {activeTab === 'boarded' && (
          <div className="space-y-4">
            {boardedBookings.length === 0? (
              <div className="text-center text-gray-500 py-20 bg-white border-gray-200 rounded-lg">
                <Navigation className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg mb-2">No active trips</p>
                <p className="text-sm">Board a bus to see it here</p>
              </div>
            ) : (
              boardedBookings.map(booking => booking && booking._id && (
                <div key={booking._id} className="bg-blue-50 border-blue-200 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{booking.bus?.busName || 'Bus Deleted'}</h3>
                      <p className="text-gray-600">
                        {booking.bus?.from || booking.boardingPoint} → {booking.bus?.to || booking.droppingPoint}
                      </p>
                      <p className="text-green-600 text-sm mt-2">
                        ✓ Boarded at {new Date(booking.boardedAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <p className="text-gray-500 text-sm mt-1">PNR: {booking.pnr}</p>
                    </div>
                    <span className="px-3 py-1 rounded-md text-sm font-semibold bg-blue-100 text-blue-700 border-blue-200">
                      On Trip
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-blue-200">
                    <div>
                      <p className="text-gray-500 text-xs">Departure</p>
                      <p className="text-gray-900 font-semibold">{booking.bus?.departureTime || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Seats</p>
                      <p className="text-gray-900 font-semibold">{booking.seats?.join(', ')}</p>
                    </div>
                    {renderAmountSection(booking)}
                    <div>
                      <p className="text-gray-500 text-xs">Passengers</p>
                      <p className="text-gray-900 font-semibold">{booking.passengerDetails?.length || booking.seats?.length}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCompleteRide(booking._id)}
                    className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-semibold w-full flex items-center justify-center gap-2"
                  >
                    <Navigation className="w-5 h-5" />
                    Mark Ride as Completed
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'waitlist' && (
          <div className="space-y-4">
            {waitlists.length === 0? (
              <div className="text-center text-gray-500 py-20 bg-white border-gray-200 rounded-lg">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg mb-2">No active waitlists</p>
                <p className="text-sm">Join waitlist on booked seats to get notified</p>
              </div>
            ) : (
              waitlists.map(wl => wl && wl._id && (
                <div key={wl._id} className={`rounded-lg p-6 border-2 ${wl.notified
                 ? 'bg-green-50 border-green-300'
                  : 'bg-orange-50 border-orange-200'
                  }`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{wl.busId?.busName || 'Unknown Bus'}</h3>
                      <p className="text-gray-600">
                        {wl.busId?.from || 'N/A'} → {wl.busId?.to || 'N/A'}
                      </p>
                      <p className="text-gray-500 text-sm mt-1">
                        {new Date(wl.journeyDate).toLocaleDateString('en-GB', {
                          weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </p>
                      <p className="text-gray-500 text-sm">Seats needed: {wl.seatsNeeded}</p>
                    </div>

                    <div className="text-right">
                      {wl.notified? (
                        <>
                          <p className="text-green-600 text-sm font-semibold mb-1">🎉 Seats Available!</p>
                          <p className="text-3xl font-bold text-green-600 mb-2">
                            {getTimeLeft(wl.expiresAt)}
                          </p>
                          {wl.busId?._id && (
                            <button
                              onClick={() => navigate(`/bus/${wl.busId._id}/seats`)}
                              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-semibold"
                            >
                              Book Now
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-orange-600 text-sm font-semibold">⏳ Waiting...</p>
                          <p className="text-gray-500 text-xs mt-1">
                            Joined: {new Date(wl.createdAt).toLocaleDateString('en-GB')}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <p className="text-gray-500 text-xs">
                      {wl.notified
                       ? 'You have priority for 30 minutes'
                        : 'We will notify you if seats become available'}
                    </p>
                    <button
                      onClick={() => handleCancelWaitlist(wl._id)}
                      className="text-red-600 text-sm hover:text-red-600 flex items-center gap-1"
                    >
                      <Ban className="w-4 h-4" />
                      Cancel Waitlist
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'locked' && (
          <div className="space-y-4">
            {lockedSeats.length === 0? (
              <div className="text-center text-gray-500 py-20 bg-white border-gray-200 rounded-lg">
                No locked seats
              </div>
            ) : (
              groupLockedSeatsByBus(lockedSeats).map(lockGroup => (
                <div key={lockGroup.key} className="bg-yellow-50 border-yellow-200 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{lockGroup.busName}</h3>
                      <p className="text-gray-600">
                        {lockGroup.from} → {lockGroup.to} • {new Date(lockGroup.journeyDate).toLocaleDateString('en-GB')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-yellow-600 text-sm">Expires in</p>
                      <p className="text-3xl font-bold text-yellow-600">{getTimeLeft(lockGroup.expiresAt)}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-yellow-200">
                    <div>
                      <p className="text-gray-500 text-xs">Seat Numbers</p>
                      <p className="text-2xl font-bold text-gray-900">{lockGroup.seats.sort().join(', ')}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Total Amount</p>
                      <p className="text-xl font-bold text-gray-900">₹{lockGroup.price * lockGroup.seats.length}</p>
                    </div>
                    <button
                      onClick={() => navigate(`/bus/${lockGroup.busId}/seats`)}
                      className="text-white px-6 py-2.5 rounded-lg font-semibold"
                      style={{ backgroundColor: PRIMARY_COLOR }}
                    >
                      Complete Booking ({lockGroup.seats.length})
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'completed' && (
          <div className="space-y-4">
            {completedBookings.length > 0 && (
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg font-semibold flex items-center gap-2 border-red-200"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear History
                </button>
              </div>
            )}

            {completedBookings.length ===0 ? (
              <div className="text-center text-gray-500 py-20 bg-white border-gray-200 rounded-lg">
                No history yet
              </div>
            ) : (
              completedBookings.map(booking => {
                if (!booking ||!booking._id) return null
                const status = getStatusInfo(booking)
                return (
                  <div key={booking._id} className="bg-white border-gray-200 rounded-lg p-6 relative">
                    <button
                      onClick={() => handleDeleteHistory(booking._id)}
                      className="absolute top-4 right-4 text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-gray-50"
                      title="Remove from history"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="flex justify-between items-start mb-4 pr-10">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {booking.bus?.busName || 'Bus Deleted'}
                        </h3>
                        <p className="text-gray-600">
                          {booking.bus?.from || booking.boardingPoint} → {booking.bus?.to || booking.droppingPoint} • {new Date(booking.journeyDate).toLocaleDateString('en-GB')}
                        </p>
                        <p className="text-gray-500 text-sm mt-1">PNR: {booking.pnr}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-md text-sm font-semibold border ${status.color}`}>
                        {status.text}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                      <div>
                        <p className="text-gray-500 text-xs">Departure</p>
                        <p className="text-gray-900 font-semibold">{booking.bus?.departureTime || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Seats</p>
                        <p className="text-gray-900 font-semibold">{booking.seats?.join(', ')}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Passengers</p>
                        <p className="text-gray-900 font-semibold">{booking.passengerDetails?.length || booking.seats?.length}</p>
                      </div>
                      {renderAmountSection(booking)}
                    </div>

                    {booking.status === 'Completed' &&!booking.rating && (
                      <button
                        onClick={() => setReviewBooking(booking)}
                        className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold"
                      >
                        <Star className="w-4 h-4" />
                        Rate Your Experience
                      </button>
                    )}

                    {booking.rating && (
                      <div className="mt-4 bg-yellow-50 border-yellow-200 rounded-lg p-3">
                        <p className="text-yellow-700 text-sm font-semibold mb-1">Your Rating:</p>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star key={star} className={`w-4 h-4 ${star <= booking.rating? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                          ))}
                        </div>
                        {booking.review && <p className="text-gray-600 text-xs mt-2">{booking.review}</p>}
                      </div>
                    )}

                    <button
                      onClick={() => setShowQR(booking)}
                      className="mt-4 bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold"
                    >
                      <QrCode className="w-4 h-4" />
                      QR Code
                    </button>
                  </div>
                )
              })
            )}
          </div>
        )}

        {(activeTab === 'upcoming' || activeTab === 'cancelled') && (
          <div className="space-y-4">
            {filteredBookings.length === 0? (
              <div className="text-center text-gray-500 py-20 bg-white border-gray-200 rounded-lg">
                <Ticket className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg mb-2">No {activeTab} bookings</p>
                <p className="text-sm">
                  {activeTab === 'upcoming'? 'Book your first journey!' : 'No cancelled bookings'}
                </p>
              </div>
            ) : (
              filteredBookings.map(booking => renderBookingCard(booking, activeTab === 'upcoming' && canCancel(booking), activeTab === 'upcoming'))
            )}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => setFilters({...filters, page: filters.page - 1 })}
              disabled={filters.page === 1}
              className="px-4 py-2 bg-white border-gray-300 rounded-lg text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-700">
              Page {filters.page} of {totalPages}
            </span>
            <button
              onClick={() => setFilters({...filters, page: filters.page + 1 })}
              disabled={filters.page === totalPages}
              className="px-4 py-2 bg-white border-gray-300 rounded-lg text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}

        {/* QR Modal */}
        {showQR && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white border-gray-200 rounded-lg p-8 max-w-sm w-full relative">
              <button
                onClick={() => setShowQR(null)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-900"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="text-center space-y-4">
                {showQR.paymentType === 'pay_after_ride' && showQR.paymentStatus === 'Paid' && showQR.exitCode && (
                  <>
                    <div className="bg-green-50 border-green-200 p-4 rounded-lg">
                      <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                      <p className="text-green-700 font-bold text-lg">Payment Successful!</p>
                    </div>

                    <div className="bg-yellow-50 border-yellow-200 p-4 rounded-lg">
                      <p className="text-gray-700 text-xs font-semibold mb-1">Your Exit Code</p>
                      <p className="text-3xl font-bold tracking-widest text-yellow-700">
                        {showQR.exitCode}
                      </p>
                      <p className="text-gray-600 text-xs mt-2">
                        Bus theke namar somoy conductor ke eta bolo
                      </p>
                    </div>
                  </>
                )}

                {showQR.paymentType === 'prepay' && (
                  <>
                    <h3 className="text-2xl font-bold text-gray-900">Pay with Stripe</h3>
                    <div className="bg-white p-4 rounded-lg inline-block border-gray-200">
                      <QRCodeSVG
                        value={`${window.location.origin}/pay/${showQR._id}`}
                        size={200}
                      />
                    </div>
                    <p className="text-gray-600 text-sm">QR scan kore card diye pay koro</p>
                    <p className="font-mono text-sm" style={{ color: PRIMARY_COLOR }}>{showQR.pnr}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Review Form Modal */}
        {reviewBooking && (
          <ReviewForm
            booking={reviewBooking}
            onClose={() => setReviewBooking(null)}
            onSuccess={() => {
              setReviewBooking(null)
              fetchAllData()
            }}
          />
        )}

        {/* Dispute Fine Modal */}
        {disputeModal && (
          <DisputeFineModal
            booking={disputeModal}
            onClose={() => setDisputeModal(null)}
            onSuccess={() => {
              setDisputeModal(null)
              fetchAllData()
            }}
          />
        )}

        {/* Clear History Confirmation Modal */}
        {showClearConfirm && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white border-gray-200 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Clear All History?</h3>
              <p className="text-gray-600 mb-6">
                This will permanently remove all completed and cancelled bookings from your history. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 py-2 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearAllHistory}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
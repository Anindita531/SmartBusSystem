import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getBookingById } from '../api/booking.api'
import { Ticket as TicketIcon, MapPin, Clock, QrCode, X, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'

export default function Ticket() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showQR, setShowQR] = useState(false)

  useEffect(() => {
    fetchBooking()

    const params = new URLSearchParams(window.location.search)
    if (params.get('paid') === '1') {
      toast.success('Payment successful!')
      fetchBooking()
      window.history.replaceState({}, document.title, `/ticket/${id}`)
    }
  }, [id])

  const fetchBooking = async () => {
    try {
      setLoading(true)
      const res = await getBookingById(id)
      const bookingData = res.data?.data || res.data
      setBooking(bookingData)

      // Debug log - eta delete kore dio pore
      console.log('Booking Debug:', {
        paymentStatus: bookingData?.paymentStatus,
        exitCode: bookingData?.exitCode,
        exitCodeUsed: bookingData?.exitCodeUsed,
        exitCodeExpiresAt: bookingData?.exitCodeExpiresAt,
        now: new Date().toISOString()
      })
    } catch (err) {
      toast.error('Failed to fetch ticket')
      navigate('/bookings')
    } finally {
      setLoading(false)
    }
  }

  // Auto refresh if code expired
  useEffect(() => {
    if (!booking) return

    const isCodeValid = booking.exitCodeExpiresAt && new Date(booking.exitCodeExpiresAt).getTime() > Date.now()
    if (booking.paymentStatus === 'Paid' &&!isCodeValid &&!booking.exitCodeUsed) {
      const timer = setTimeout(() => {
        fetchBooking()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [booking?.exitCodeExpiresAt, booking?.paymentStatus, booking?.exitCodeUsed])

  if (loading) {
    return <div className="text-center py-20">Loading ticket...</div>
  }

  if (!booking) {
    return <div className="text-center py-20">Ticket not found</div>
  }

  // FIX: getTime() use koro timezone issue avoid korte
  const isCodeValid = booking.exitCodeExpiresAt && new Date(booking.exitCodeExpiresAt).getTime() > Date.now()
  const isPaidAndHasCode = booking.paymentStatus === 'Paid' && booking.exitCode &&!booking.exitCodeUsed && isCodeValid
  const isCodeExpired = booking.paymentStatus === 'Paid' && booking.exitCode &&!booking.exitCodeUsed &&!isCodeValid
  const isPaymentPending = booking.paymentType === 'pay_after_ride' && booking.paymentStatus === 'Pending'

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {isPaidAndHasCode && (
          <div className="bg-green-50 border-green-200 rounded-lg p-4 text-center mb-6">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
            <h2 className="text-xl font-bold text-green-700">Payment Successful!</h2>
            <p className="text-gray-600 text-sm mt-1">Show this exit code to the conductor</p>
          </div>
        )}

        {isPaidAndHasCode && (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mb-6 text-center">
            <p className="text-gray-700 text-sm font-semibold mb-2">Your Exit Code</p>
            <p className="text-6xl font-bold tracking-widest text-yellow-700 mb-2">
              {booking.exitCode}
            </p>
            <p className="text-gray-600 text-xs">
              Valid till {new Date(booking.exitCodeExpiresAt).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            <p className="text-gray-500 text-xs mt-2">Refresh page if code expires</p>
          </div>
        )}

        {isCodeExpired && (
          <div className="bg-red-50 border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <RefreshCw className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-700">Exit Code Expired</p>
              <p className="text-sm text-gray-600">Ask conductor to generate a new code</p>
              <button
                onClick={fetchBooking}
                className="mt-2 text-sm text-red-600 font-semibold underline"
              >
                Refresh Now
              </button>
            </div>
          </div>
        )}

        {isPaymentPending && (
          <div className="bg-orange-50 border-orange-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-gray-900">Payment Pending</p>
              <p className="text-sm text-gray-600">Pay before exit to get your exit code</p>
              <p className="text-2xl font-bold text-orange-600 mt-2">₹{booking.totalAmount}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg border-gray-200 p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{booking.bus?.busName}</h1>
              <p className="text-gray-600">PNR: {booking.pnr}</p>
            </div>
            <span className={`px-3 py-1 rounded-md text-sm font-semibold ${
              booking.status === 'Completed'? 'bg-gray-100 text-gray-700' :
              booking.status === 'Boarded'? 'bg-blue-100 text-blue-700' :
              'bg-green-100 text-green-700'
            }`}>
              {booking.status}
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Route</p>
                <p className="font-semibold">{booking.boardingPoint} → {booking.droppingPoint}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Journey Date</p>
                <p className="font-semibold">{new Date(booking.journeyDate).toLocaleDateString('en-GB')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <TicketIcon className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Seats</p>
                <p className="font-semibold">{booking.seats?.join(', ')}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-xs text-gray-500">Amount Paid</p>
              <p className="text-2xl font-bold text-gray-900">₹{booking.totalAmount}</p>
            </div>
          </div>

          {booking.status!== 'Cancelled' && (
            <button
              onClick={() => setShowQR(true)}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
            >
              <QrCode className="w-5 h-5" />
              Show QR Code
            </button>
          )}
        </div>

        <div className="bg-white rounded-lg border-gray-200 p-6 mt-4">
          <h3 className="font-bold text-gray-900 mb-4">Passenger Details</h3>
          {booking.passengerDetails?.map((p, idx) => (
            <div key={idx} className="border-b last:border-b-0 py-3">
              <p className="font-semibold">{p.name}</p>
              <p className="text-sm text-gray-600">
                {p.age} yrs • {p.gender} • Seat {booking.seats[idx]}
              </p>
            </div>
          ))}
        </div>
      </div>

      {showQR && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-sm w-full relative">
            <button
              onClick={() => setShowQR(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-900"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center space-y-4">
              <h3 className="text-xl font-bold text-gray-900">Ticket QR</h3>
              <div className="bg-white p-4 rounded-lg inline-block border">
                <QRCodeSVG value={booking.pnr} size={200} />
              </div>
              <p className="font-mono text-lg font-bold">{booking.pnr}</p>
              <p className="text-sm text-gray-600">Show this to the conductor for boarding</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
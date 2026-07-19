import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { Loader, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'

// 🔥 Theme 1: Corporate Blue | Theme 2: Indigo
const PRIMARY_COLOR = '#0F4C75' // Change to '#3730A3' for Theme 2

export default function Refund() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [booking, setBooking] = useState(null)
  const [error, setError] = useState('')
  const [refundData, setRefundData] = useState(null)

  const bookingId = searchParams.get('bookingId')

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails()
    } else {
      setError('No booking ID provided')
      setLoading(false)
    }
  }, [bookingId])

  const fetchBookingDetails = async () => {
    try {
      const res = await api.get(`/booking/${bookingId}`)
      setBooking(res.data.data)
      calculateRefund(res.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch booking')
    } finally {
      setLoading(false)
    }
  }

  const calculateRefund = (booking) => {
    const journeyDate = new Date(booking.journeyDate)
    const now = new Date()
    const hoursLeft = (journeyDate - now) / (1000 * 60 * 60)

    let refundPercent = 0
    let reason = ''

    if (hoursLeft > 24) {
      refundPercent = 100
      reason = '100% refund - Cancelled 24+ hours before journey'
    } else if (hoursLeft > 12) {
      refundPercent = 50
      reason = '50% refund - Cancelled 12-24 hours before journey'
    } else if (hoursLeft > 0) {
      refundPercent = 0
      reason = 'No refund - Cancelled less than 12 hours before journey'
    } else {
      refundPercent = 0
      reason = 'No refund - Journey date passed'
    }

    const refundAmount = (booking.totalAmount * refundPercent) / 100

    setRefundData({
      hoursLeft: hoursLeft.toFixed(1),
      refundPercent,
      refundAmount,
      reason,
      totalAmount: booking.totalAmount
    })
  }

  const handleRefund = async () => {
    if (!refundData || refundData.refundAmount === 0) {
      toast.error('No refund applicable')
      return
    }

    if (!confirm(`Confirm refund of ₹${refundData.refundAmount}?`)) return

    setProcessing(true)
    try {
      await api.post(`/booking/cancel/${bookingId}`, {
        refundAmount: refundData.refundAmount,
        refundPercent: refundData.refundPercent
      })
      toast.success('Refund processed successfully!')
      navigate('/my-bookings')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Refund failed')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin" style={{ color: PRIMARY_COLOR }} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-700 font-semibold mb-2">Error</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/my-bookings')}
            className="px-6 py-2 rounded-lg text-white font-semibold hover:opacity-90"
            style={{ backgroundColor: PRIMARY_COLOR }}
          >
            Go to My Bookings
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/my-bookings')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to My Bookings
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">Cancel Booking & Refund</h1>

        {/* Booking Details */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Booking Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-500 text-sm">PNR</p>
              <p className="text-gray-900 font-mono font-bold">{booking.pnr}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Bus</p>
              <p className="text-gray-900">{booking.bus?.busName}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Route</p>
              <p className="text-gray-900">{booking.boardingPoint} → {booking.droppingPoint}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Journey Date</p>
              <p className="text-gray-900">{new Date(booking.journeyDate).toLocaleDateString('en-IN')}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Seats</p>
              <p className="text-gray-900">{booking.seats?.join(', ')}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Amount</p>
              <p className="text-gray-900 font-bold">₹{booking.totalAmount}</p>
            </div>
          </div>
        </div>

        {/* Refund Calculation */}
        {refundData && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Refund Calculation</h2>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Time Left</span>
                <span className="text-gray-900 font-semibold">{refundData.hoursLeft} hours</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Refund Policy</span>
                <span className="text-gray-900 font-semibold">{refundData.refundPercent}%</span>
              </div>
              <div className="border-t border-gray-200 mt-3 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-900 font-bold">Refund Amount</span>
                  <span className="text-2xl font-bold" style={{ color: PRIMARY_COLOR }}>₹{refundData.refundAmount}</span>
                </div>
              </div>
            </div>

            <div className={`p-3 rounded-lg border ${
              refundData.refundPercent === 100
               ? 'bg-green-50 border-green-200'
                : refundData.refundPercent === 50
               ? 'bg-yellow-50 border-yellow-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <p className={`text-sm font-semibold ${
                refundData.refundPercent === 100
                 ? 'text-green-700'
                  : refundData.refundPercent === 50
                 ? 'text-yellow-700'
                  : 'text-red-700'
              }`}>
                {refundData.reason}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/my-bookings')}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleRefund}
            disabled={processing ||!refundData || refundData.refundAmount === 0}
            className="flex-1 text-white py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: PRIMARY_COLOR }}
          >
            {processing? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Confirm Refund
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
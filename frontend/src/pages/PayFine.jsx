import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { AlertTriangle, CreditCard, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'
import { payFine } from '../api/booking.api'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUB_KEY)

function FineCheckout({ booking }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('Ready to pay')
  const navigate = useNavigate()
  const isPayingRef = useRef(false)

  const handlePay = async () => {
    if (!stripe ||!elements) {
      setStatus('ERROR: Stripe not loaded')
      return
    }

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      setStatus('ERROR: Enter card details')
      toast.error('Enter card details')
      return
    }

    if (loading || isPayingRef.current) return
    isPayingRef.current = true
    setLoading(true)

    try {
      setStatus('Creating payment...')
      const response = await api.post(`/bookings/${booking._id}/create-fine-intent`)
      const clientSecret = response.data.data?.clientSecret || response.data.clientSecret

      if (!clientSecret) {
        setStatus('ERROR: Payment setup failed')
        return
      }

      setStatus('Processing card...')
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement }
      })

      if (result.error) {
        setStatus('PAYMENT ERROR: ' + result.error.message)
        toast.error(result.error.message)
        return
      }

      if (result.paymentIntent.status!== 'succeeded') {
        setStatus('ERROR: Payment not completed')
        return
      }

      setStatus('Updating records...')
      await payFine(booking._id, result.paymentIntent.id, 'online')
      setStatus('SUCCESS! Receipt sent to email.')

      toast.success('Fine paid successfully! Receipt sent to email.')
      setTimeout(() => navigate('/bookings'), 2000)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Unknown error'
      setStatus('ERROR: ' + msg)
      toast.error(msg)
    } finally {
      setLoading(false)
      isPayingRef.current = false
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <div className="max-w-md mx-auto bg-slate-800 rounded-2xl p-6 border border-orange-500/50">
        <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2 text-center">Pay Fine</h2>
        <p className="text-slate-400 text-center mb-6">Clear your pending fine to avoid penalty</p>

        <div className="bg-slate-700/50 rounded-lg p-4 mb-6 space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-400 text-sm">PNR:</span>
            <span className="text-white font-mono">{booking.pnr}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 text-sm">Route:</span>
            <span className="text-white text-sm">{booking.boardingPoint} → {booking.droppingPoint}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 text-sm">Reason:</span>
            <span className="text-white text-sm text-right">{booking.fineReason}</span>
          </div>
          <div className="border-t border-slate-600 pt-3 mt-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Fine Amount:</span>
              <span className="text-3xl font-bold text-orange-400">₹{booking.fineAmount}</span>
            </div>
          </div>
        </div>

        {booking.fineStatus === 'paid'? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-green-400 font-bold">Fine Already Paid</p>
            <p className="text-slate-400 text-sm mt-1">Receipt sent to your email</p>
          </div>
        ) : (
          <>
            <div className="bg-slate-700 p-4 rounded-lg mb-4">
              <CardElement options={{
                style: { base: { fontSize: '16px', color: '#fff', '::placeholder': { color: '#94a3b8' } } },
                hidePostalCode: true
              }} />
            </div>

            <div className={`p-3 rounded-lg mb-4 text-xs font-mono ${
              status.includes('ERROR')? 'bg-red-500/20 border border-red-500 text-red-400' :
              status.includes('SUCCESS')? 'bg-green-500/20 border border-green-500 text-green-400' :
              'bg-blue-500/20 border border-blue-500 text-blue-400'
            }`}>
              {status}
            </div>

            <button
              onClick={handlePay}
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              {loading? 'Processing...' : `Pay ₹${booking.fineAmount} Now`}
            </button>

            <p className="text-slate-500 text-xs mt-4 text-center">
              Test: 4242 4242 4242 4242 | 12/34 | 123
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default function PayFine() {
  const { bookingId } = useParams()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true

    const fetchBooking = async () => {
      try {
        const { data } = await api.get(`/bookings/${bookingId}`)
        setBooking(data.data)
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load fine details')
      } finally {
        setLoading(false)
      }
    }
    fetchBooking()
  }, [bookingId])

  if (loading) return <div className="text-white text-center py-20">Loading...</div>
  if (!booking) return <div className="text-white text-center py-20">Booking not found</div>

  return (
    <Elements stripe={stripePromise}>
      <FineCheckout booking={booking} />
    </Elements>
  )
}
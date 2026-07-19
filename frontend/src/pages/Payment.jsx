import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { createPaymentIntent, confirmPayment } from '../api/payment.api'
import { lockSeats } from '../api/booking.api'
import { applyCoupon } from '../api/coupon.api.js'
import toast from 'react-hot-toast'
import { CreditCard, Shield, Tag, MapPin, Calendar, Users, Lock, CheckCircle, ArrowLeft, Ticket, X } from 'lucide-react'

const stripeKey = import.meta.env.VITE_STRIPE_PUB_KEY
const stripePromise = loadStripe(stripeKey)

function CheckoutForm({ state, clientSecret, bookingId }) {
  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { busId, busName, from, to, journeyDate, seats, passengerDetails, totalAmount, finalAmount: initialFinalAmount, discount: initialDiscount, couponCode: initialCouponCode, boardingPoint, droppingPoint, departureTime } = state

  const [couponCode, setCouponCode] = useState(initialCouponCode || '')
  const [discount, setDiscount] = useState(initialDiscount || 0)
  const [finalAmount, setFinalAmount] = useState(initialFinalAmount || totalAmount)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponApplied, setCouponApplied] = useState(!!initialCouponCode)
  const [couponAlreadyUsed, setCouponAlreadyUsed] = useState(false)

  const applyCouponHandler = async () => {
    if (!couponCode.trim()) {
      toast.error('Enter coupon code')
      return
    }
    setCouponLoading(true)
    try {
      const res = await applyCoupon({ code: couponCode, amount: totalAmount, busId })
      const data = res.data || res.data
      setDiscount(data.discount)
      setFinalAmount(data.finalAmount)
      setCouponApplied(true)
      setCouponAlreadyUsed(false)
      toast.success(`Coupon applied! You saved ₹${data.discount}`)
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid coupon'
      if (msg.includes('only') || msg.includes('used')) setCouponAlreadyUsed(true)
      setDiscount(0)
      setFinalAmount(totalAmount)
      setCouponApplied(false)
      toast.error(msg)
    } finally {
      setCouponLoading(false)
    }
  }

  const removeCoupon = () => {
    setCouponCode('')
    setDiscount(0)
    setFinalAmount(totalAmount)
    setCouponApplied(false)
    setCouponAlreadyUsed(false)
    toast.success('Coupon removed')
  }

  const handlePay = async (e) => {
    e.preventDefault()
    if (!stripe ||!elements) return

    setLoading(true)
    setError('')

    try {
      await lockSeats(busId, { seats, boardingPoint, droppingPoint })

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement) }
      })

      if (stripeError) throw stripeError

      await confirmPayment(bookingId, { paymentIntentId: paymentIntent.id })

      toast.success('Payment successful! Ticket sent to email.')
      navigate(`/ticket/${bookingId}`)

    } catch (err) {
      console.error('Payment failed:', err)
      const errMsg = err.response?.data?.message || err.message || 'Payment failed'
      setError(errMsg)
      toast.error(errMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handlePay} className="space-y-6">
      {/* Booking Summary */}
      <div className="bg-white/60 backdrop-blur-xl border-slate-700/50 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Ticket className="w-5 h-5 text-blue-500" />
          Booking Summary
        </h3>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-sm">Bus</span>
            <span className="text-black font-semibold">{busName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-sm">Route</span>
            <span className="text-black">{from} → {to}</span>
          </div>
          <div className="flex justify-between items-center bg-green-500/10 border border-green-500/30 rounded-lg p-3">
            <span className="text-green-400 text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Stage Journey
            </span>
            <span className="text-green-400 font-semibold">{boardingPoint} → {droppingPoint}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date & Time
            </span>
            <span className="text-white">{new Date(journeyDate).toLocaleDateString('en-GB')} • {departureTime}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-black text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />
              Seats
            </span>
            <span className="text-black font-semibold">{seats.join(', ')}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-sm">Passengers</span>
            <span className="text-black">{passengerDetails.length}</span>
          </div>
        </div>

        <div className="border-t border-slate-700 mt-4 pt-4 space-y-2">
          <div className="flex justify-between text-slate-300">
            <span>Subtotal</span>
            <span className="text-black">₹{totalAmount}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-green-400">
              <span className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Discount {couponApplied && `(${couponCode})`}
              </span>
              <span className="font-semibold">-₹{discount}</span>
            </div>
          )}
          <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-slate-700">
            <span>Total Payable</span>
            <span>₹{finalAmount}</span>
          </div>
        </div>
      </div>

      {/* Coupon Section */}
      <div className="bg-white/60 backdrop-blur-xl border-slate-700/50 rounded-2xl p-6">
        <label className="text-black font-semibold mb-3 block flex items-center gap-2">
          <Tag className="w-5 h-5 text-blue-500" />
          Have a coupon?
        </label>
        {!couponApplied? (
          <div className="flex gap-2">
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Enter coupon code"
              disabled={couponLoading || couponAlreadyUsed}
              className="flex-1 px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
            <button
              onClick={applyCouponHandler}
              type="button"
              disabled={couponLoading ||!couponCode || couponAlreadyUsed}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-semibold disabled:opacity-50"
            >
              {couponAlreadyUsed? 'Used' : couponLoading? 'Checking...' : 'Apply'}
            </button>
          </div>
        ) : (
          <div className="flex gap-2 items-center">
            <div className="flex-1 px-4 py-3 bg-green-500/10 border-green-500/30 rounded-xl text-green-400 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {couponCode} Applied
            </div>
            <button onClick={removeCoupon} type="button" className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl text-white font-semibold">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Card Details - WHITE BOX */}
      <div className="bg-white border-slate-200 rounded-2xl p-6 shadow-sm">
        <label className="text-slate-900 font-semibold mb-3 block flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-600" />
          Card Details
        </label>
        <div className="bg-white border-slate-300 rounded-xl p-4">
          <CardElement options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#1e293b', // black text
                '::placeholder': { color: '#64748b' }, // gray placeholder
                iconColor: '#3b82f6',
                fontFamily: 'Inter, sans-serif'
              },
              invalid: { 
                color: '#ef4444',
                iconColor: '#ef4444'
              }
            },
            hidePostalCode: true
          }} />
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-center gap-2 text-slate-500 text-xs">
        <Shield className="w-4 h-4" />
        <span>Secured by Stripe • 256-bit SSL Encryption</span>
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full py-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 rounded-xl font-bold text-white shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Processing Payment...
          </>
        ) : (
          <>
            <Lock className="w-5 h-5" />
            Pay ₹{finalAmount} Securely
          </>
        )}
      </button>
    </form>
  )
}

export default function Payment() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [clientSecret, setClientSecret] = useState("")
  const [bookingId, setBookingId] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!state?.seats?.length ||!state?.busId ||!state?.boardingPoint ||!state?.droppingPoint) {
      toast.error('Invalid booking data. Please start again.')
      navigate('/search')
      return
    }

    const makeIntent = async () => {
      try {
        const res = await createPaymentIntent({
          busId: state.busId,
          seats: state.seats,
          amount: state.finalAmount,
          couponCode: state.couponCode || null,
          passengerDetails: state.passengerDetails,
          journeyDate: state.journeyDate,
          boardingPoint: state.boardingPoint,
          droppingPoint: state.droppingPoint
        })
        const data = res.data.data || res.data // backend onujayi
        setClientSecret(data.clientSecret)
        setBookingId(data.bookingId)
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to create payment")
        navigate(-1)
      } finally {
        setLoading(false)
      }
    }
    makeIntent()
  }, [state, navigate])

  if (loading) return <div className="min-h-screen flex items-center justify-center text-black">Creating Payment...</div>

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-black mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>

        <div className="bg-white  backdrop-blur-2xl border border-black-700/50 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/50">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-black mb-2">Complete Payment</h2>
            <p className="text-slate-400">Secure checkout powered by Stripe</p>
          </div>

          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm state={state} clientSecret={clientSecret} bookingId={bookingId} />
          </Elements>
        </div>
      </div>
    </div>
  )
}
import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { createBooking } from '../api/booking.api'
import { applyCoupon } from '../api/coupon.api.js'
import { useAuth } from '../context/AuthContext'
import { User, Calendar, Phone, Users, ArrowLeft, MapPin, AlertTriangle, CheckCircle, Bus, Clock, CreditCard, Tag, X } from 'lucide-react'

const PRIMARY_COLOR = '#0F4C75'

export default function PassengerInfo() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [passengers, setPassengers] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [applying, setApplying] = useState(false)
  const [couponAlreadyUsed, setCouponAlreadyUsed] = useState(false)

  useEffect(() => {
    if (!location.state ||!location.state.seats) {
      navigate('/search')
      return
    }

    const initialPassengers = location.state.seats.map(seat => ({
      seat,
      name: user?.name || '',
      age: user?.age || '',
      gender: user?.gender || 'Male',
      phone: user?.phone || ''
    }))
    setPassengers(initialPassengers)
  }, [location.state, navigate, user])

  if (!location.state) return null

  const {
    busId, seats, price, busName, from, to, journeyDate, totalAmount,
    boardingPoint, droppingPoint, mode, paymentType, departureTime
  } = location.state

  const handleChange = (index, field, value) => {
    const updated = [...passengers]
    updated[index][field] = value
    setPassengers(updated)
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return toast.error('Enter coupon code')

    setApplying(true)
    try {
      const res = await applyCoupon({
        code: couponCode,
        amount: totalAmount,
        busId
      })

      setDiscount(res.data.discount)
      setAppliedCoupon({
        code: res.data.code,
        description: res.data.description || `${couponCode} Applied`
      })
      setCouponAlreadyUsed(false)
      toast.success(`Coupon applied! You saved ₹${res.data.discount}`)
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid coupon'
      if (msg.includes('only') || msg.includes('used')) {
        setCouponAlreadyUsed(true)
      }
      toast.error(msg)
      setDiscount(0)
      setAppliedCoupon(null)
    } finally {
      setApplying(false)
    }
  }

  const removeCoupon = () => {
    setCouponCode('')
    setDiscount(0)
    setAppliedCoupon(null)
    setCouponAlreadyUsed(false)
    toast.success('Coupon removed')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return

    const isValid = passengers.every(p => p.name && p.age)
    if (!isValid) {
      toast.error('Please fill all passenger details')
      return
    }

    setSubmitting(true)
    const finalAmount = totalAmount - discount

    try {
      if (mode === 'A' || paymentType === 'pay_after_ride') {
        const bookingRes = await createBooking({
          busId,
          journeyDate,
          seats,
          passengerDetails: passengers.map(p => ({
            name: p.name,
            age: Number(p.age),
            gender: p.gender,
            phone: p.phone
          })),
          boardingPoint: boardingPoint || from,
          droppingPoint: droppingPoint || to,
          discount,
          couponCode: appliedCoupon?.code,
          totalAmount: finalAmount
        })

        toast.success('Seat Booked! Pay when you exit the bus')
        navigate(`/ticket/${bookingRes.data._id}`)

      } else {
        navigate('/payment', {
          state: {
            busId,
            busName,
            from,
            to,
            seats,
            passengerDetails: passengers,
            totalAmount: totalAmount,
            finalAmount: finalAmount,
            discount,
            couponCode: appliedCoupon?.code,
            journeyDate,
            price,
            boardingPoint,
            droppingPoint,
            departureTime
          }
        })
      }
    } catch (err) {
      console.error('Booking error:', err)
      toast.error(err.response?.data?.message || 'Booking failed')
    } finally {
      setSubmitting(false)
    }
  }

  const isModeA = mode === 'A' || paymentType === 'pay_after_ride'
  const finalAmount = totalAmount - discount

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>

        <div className="bg-white border-gray-200 rounded-lg p-8 mb-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 rounded-lg flex items-center justify-center" style={{ backgroundColor: PRIMARY_COLOR }}>
              <Bus className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{busName}</h1>
              <div className="flex flex-wrap items-center gap-4 text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" style={{ color: PRIMARY_COLOR }} />
                  <span>{from} → {to}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" style={{ color: PRIMARY_COLOR }} />
                  <span>{new Date(journeyDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" style={{ color: PRIMARY_COLOR }} />
                  <span>{departureTime}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-green-600" />
              <p className="text-green-700 font-semibold text-sm">Your Stage Journey</p>
            </div>
            <p className="text-gray-900 text-lg font-bold">
              {boardingPoint} <span className="text-green-600">→</span> {droppingPoint}
            </p>
          </div>

          {isModeA && (
            <div className="bg-yellow-50 border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-700 font-semibold mb-1">Public Bus - Pay After Ride</p>
                <p className="text-gray-600 text-sm">You'll pay the conductor before exiting the bus. No advance payment required.</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border-gray-200 rounded-lg p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Passenger Details</h2>
              <p className="text-gray-600 text-sm">{seats.length} {seats.length === 1? 'seat' : 'seats'} selected</p>
            </div>
          </div>

          <div className="space-y-5 mb-6">
            {passengers.map((p, i) => (
              <div key={i} className="bg-gray-50 border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">{p.seat}</span>
                  </div>
                  <p className="text-blue-600 font-semibold">Seat {p.seat}</p>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={p.name}
                      onChange={e => handleChange(i, 'name', e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        placeholder="Age"
                        value={p.age}
                        onChange={e => handleChange(i, 'age', e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <select
                      value={p.gender}
                      onChange={e => handleChange(i, 'gender', e.target.value)}
                      className="w-full px-4 py-3 bg-white border-gray-300 rounded-lg text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={p.phone}
                      onChange={e => handleChange(i, 'phone', e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border-gray-200 rounded-lg p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <Tag className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Apply Coupon</h2>
              <p className="text-gray-600 text-sm">
                {couponAlreadyUsed? 'You have already used this coupon' : 'Save more on your booking'}
              </p>
            </div>
          </div>

          {!appliedCoupon? (
            <div className="flex gap-3">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter coupon code"
                disabled={couponAlreadyUsed}
                className="flex-1 bg-white border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleApplyCoupon}
                disabled={applying || couponAlreadyUsed}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed px-8 py-3 rounded-lg text-white font-bold"
              >
                {couponAlreadyUsed? 'Used' : applying? 'Applying...' : 'Apply'}
              </button>
            </div>
          ) : (
            <div className="bg-green-50 border-green-200 rounded-lg p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-green-700 font-bold text-lg">{appliedCoupon.code}</p>
                  <p className="text-gray-600 text-sm">{appliedCoupon.description}</p>
                  <p className="text-green-600 text-sm font-semibold mt-1">You saved ₹{discount}</p>
                </div>
              </div>
              <button onClick={removeCoupon} className="text-red-600 hover:text-red-700 p-2">
                <X className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>

        <div className="bg-white border-gray-200 rounded-lg p-8">
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>₹{totalAmount}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount ({appliedCoupon?.code})</span>
                <span>-₹{discount}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-900 font-bold text-2xl pt-4 border-t border-gray-200">
              <span>Total Payable</span>
              <span>₹{finalAmount}</span>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full px-8 py-4 rounded-lg font-bold text-white hover:opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ backgroundColor: submitting? undefined : PRIMARY_COLOR }}
          >
            {submitting? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {isModeA? 'Confirming...' : 'Processing...'}
              </>
            ) : (
              <>
                {isModeA? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Confirm Booking
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Proceed to Payment
                  </>
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
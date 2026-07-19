import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { getSeats } from '../api/bus.api'
import { lockSeats, releaseSeats, getLockedSeats } from '../api/booking.api'
import { useAuth } from '../hooks/useAuth'
import SeatMap from '../components/SeatMap'
import Loader from '../components/Loader'
import { Clock, MapPin, IndianRupee, ArrowRight, AlertCircle, Bus, Users } from 'lucide-react'
import toast from 'react-hot-toast'

const PRIMARY_COLOR = '#0F4C75'

export default function SeatSelect() {
  const { busId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const [selectedSeats, setSelectedSeats] = useState([])
  const [busData, setBusData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [locking, setLocking] = useState(false)
  const [error, setError] = useState('')
  const [lockExpiresAt, setLockExpiresAt] = useState(null)
  const [timeLeft, setTimeLeft] = useState(0)

  const timerRef = useRef(null)
  const pollRef = useRef(null)

  const { boardingPoint, droppingPoint, calculatedFare } = location.state || {}
  const isModeA = busData?.paymentType === 'pay_after_ride'

  useEffect(() => {
    if (!boardingPoint ||!droppingPoint) {
      toast.error('Please select route from bus details first')
      navigate(`/bus/${busId}`)
      return
    }

    const fetchSeats = async () => {
      try {
        const [seatRes, lockedRes] = await Promise.all([
          getSeats(busId),
          getLockedSeats()
        ])

        const bus = seatRes.data?.data || seatRes.data
        const myLocks = lockedRes.data?.data?.lockedSeats || []
        const myLockedForThisBus = myLocks.filter(
          l => l.busId === busId && new Date(l.expiresAt) > new Date()
        )

        if (myLockedForThisBus.length > 0) {
          setSelectedSeats(myLockedForThisBus.map(l => l.seatNumber))
          const minExpiry = myLockedForThisBus.reduce((min, l) =>
            new Date(l.expiresAt) < new Date(min)? l.expiresAt : min,
            myLockedForThisBus[0].expiresAt
          )
          setLockExpiresAt(minExpiry)
        }

        setBusData(bus)
        setError('')
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load bus')
      } finally {
        setLoading(false)
      }
    }

    fetchSeats()
    pollRef.current = setInterval(fetchSeats, 3000)

    return () => {
      clearInterval(pollRef.current)
      clearInterval(timerRef.current)
    }
  }, [busId, boardingPoint, droppingPoint, navigate])

  useEffect(() => {
    if (!lockExpiresAt) return

    const updateTimer = () => {
      const diff = Math.max(0, Math.floor((new Date(lockExpiresAt) - Date.now()) / 1000))
      setTimeLeft(diff)
      if (diff === 0) {
        toast.error('Lock expired! Please select seats again.')
        setSelectedSeats([])
        setLockExpiresAt(null)
        clearInterval(timerRef.current)
        getSeats(busId).then(res => setBusData(res.data))
      }
    }

    updateTimer()
    timerRef.current = setInterval(updateTimer, 1000)
    return () => clearInterval(timerRef.current)
  }, [lockExpiresAt, busId])

  const handleSeatToggle = async (seat) => {
    if (!busData || locking) return
    setLocking(true)

    const isSelected = selectedSeats.includes(seat)
    const newSelected = isSelected? selectedSeats.filter(s => s!== seat) : [...selectedSeats, seat]

    try {
      if (newSelected.length === 0) {
        await releaseSeats(busId)
        setSelectedSeats([])
        setLockExpiresAt(null)
        toast.success('Seats released')
      } else {
        const res = await lockSeats(busId, { seats: newSelected, boardingPoint, droppingPoint })
        setSelectedSeats(newSelected)
        setLockExpiresAt(res.data.expiresAt)
        toast.success(`Locked for 20 minutes`)
      }
      const seatRes = await getSeats(busId)
      setBusData(seatRes.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to lock seat')
      getSeats(busId).then(res => setBusData(res.data))
    } finally {
      setLocking(false)
    }
  }

  const handleProceed = () => {
    if (selectedSeats.length === 0) return
    if (timeLeft === 0) {
      toast.error('Lock expired! Select seats again.')
      return
    }

    const pricePerSeat = calculatedFare || busData.price
    const commonState = {
      busId: busData._id,
      busName: busData.busName,
      from: busData.from,
      to: busData.to,
      journeyDate: busData.journeyDate,
      departureTime: busData.departureTime,
      price: pricePerSeat,
      seats: selectedSeats,
      totalAmount: selectedSeats.length * pricePerSeat,
      lockExpiresAt,
      boardingPoint,
      droppingPoint,
      paymentType: busData.paymentType,
      mode: busData.mode
    }

    navigate('/passenger-info', { state: commonState })
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  if (loading &&!busData) return <Loader />
  if (error) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-red-50 border-red-200 rounded-lg p-8 text-center max-w-md">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <p className="text-red-700 font-medium">{error}</p>
      </div>
    </div>
  )
  if (!busData) return <div className="text-gray-900 text-center py-20">Bus not found</div>

  const pricePerSeat = calculatedFare || busData.price

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">{busData.busName}</h2>
        <div className="flex items-center gap-3 text-gray-600 text-sm">
          <span>{busData.from}</span>
          <ArrowRight className="w-4 h-4" />
          <span>{busData.to}</span>
          <span className="text-gray-400">•</span>
          <span>{new Date(busData.journeyDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
        </div>
      </div>

      <div className="bg-blue-50 border-blue-200 rounded-lg p-5 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Journey Route</p>
              <p className="text-gray-900 font-semibold">
                {boardingPoint} <ArrowRight className="w-4 h-4 inline mx-1" /> {droppingPoint}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <IndianRupee className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Per Seat</p>
              <p className="text-gray-900 font-bold text-xl">₹{pricePerSeat}</p>
            </div>
          </div>
        </div>
        {isModeA && (
          <div className="mt-4 pt-4 border-t border-blue-200">
            <p className="text-blue-700 text-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
              Pay after you exit the bus
            </p>
          </div>
        )}
      </div>

      {isModeA && lockExpiresAt && timeLeft > 0 && (
        <div className="bg-green-50 border-green-200 rounded-lg p-5 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-600 rounded-full"></div>
              <div>
                <p className="text-green-700 font-semibold">Booking Confirmed</p>
                <p className="text-gray-500 text-xs">Pay before you exit the bus</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-600" />
              <span className="text-3xl font-bold text-gray-900">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>
      )}

      {!isModeA && lockExpiresAt && timeLeft > 0 && (
        <div className="bg-blue-50 border-blue-300 rounded-lg p-5 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              <div>
                <p className="text-blue-700 font-semibold">Seats Locked</p>
                <p className="text-gray-500 text-xs">Complete booking before timer ends</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="text-3xl font-bold text-gray-900">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border-gray-200 rounded-lg p-6 mb-6">
        <SeatMap
          busData={busData}
          selectedSeats={selectedSeats}
          onSeatToggle={handleSeatToggle}
          userId={user?._id}
          disabled={locking}
        />

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-gray-500 text-sm mb-2">Selected Seats</p>
              <p className="text-xl font-bold text-gray-900">
                {selectedSeats.length > 0? selectedSeats.sort().join(', ') : 'None'}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-sm mb-2">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">₹{selectedSeats.length * pricePerSeat}</p>
            </div>
            <button
              onClick={handleProceed}
              disabled={selectedSeats.length === 0 || timeLeft === 0 || locking}
              className="text-white px-8 py-3 rounded-lg font-semibold disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ backgroundColor: selectedSeats.length === 0 || timeLeft === 0 || locking? undefined : PRIMARY_COLOR }}
            >
              {locking && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
              Continue
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
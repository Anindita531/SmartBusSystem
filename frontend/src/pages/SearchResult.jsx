import { useSearchParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { searchBuses, quickBook, quickBookOptions } from '../api/bus.api'
import { createBooking } from '../api/booking.api'
import BusCard from '../components/BusCard'
import Loader from '../components/Loader'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { Zap, Filter, SlidersHorizontal, ArrowUpDown, Bus, Clock } from 'lucide-react'

const PRIMARY_COLOR = '#0F4C75'

export default function SearchResult() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [buses, setBuses] = useState([])
  const [filteredBuses, setFilteredBuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [quickBooking, setQuickBooking] = useState(false)
  const [sortBy, setSortBy] = useState('departure')
  const [filterMode, setFilterMode] = useState('all')

  const [quickOptions, setQuickOptions] = useState(null)
  const [loadingOptions, setLoadingOptions] = useState(false)

  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const date = searchParams.get('date')

  useEffect(() => {
    const fetchBuses = async () => {
      if (!from ||!to ||!date) {
        setError('Invalid search. Please go back and search again.')
        setLoading(false)
        return
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        setError('Invalid date format')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const res = await searchBuses({ from: from.trim(), to: to.trim(), date })
        const busData = res.data?.data || res.data || []
        setBuses(Array.isArray(busData)? busData : [])
        setFilteredBuses(Array.isArray(busData)? busData : [])
      } catch (err) {
        console.error('Search failed:', err.response?.data)
        setError(err.response?.data?.message || 'Failed to fetch buses')
        setBuses([])
        setFilteredBuses([])
      } finally {
        setLoading(false)
      }
    }
    fetchBuses()
  }, [from, to, date])

  useEffect(() => {
    const fetchOptions = async () => {
      if (!from ||!to ||!date) return

      setLoadingOptions(true)
      try {
        const res = await quickBookOptions({ from, to, date })
        setQuickOptions(res.data)
      } catch (err) {
        console.error('Quick options failed:', err)
        setQuickOptions(null)
      } finally {
        setLoadingOptions(false)
      }
    }
    fetchOptions()
  }, [from, to, date])

  useEffect(() => {
    let result = [...buses]

    if (filterMode!== 'all') {
      result = result.filter(bus => bus.mode === filterMode)
    }

    result.sort((a, b) => {
      if (sortBy === 'price') return a.price - b.price
      if (sortBy === 'departure') return a.departureTime.localeCompare(b.departureTime)
      if (sortBy === 'duration') return a.duration - b.duration
      return 0
    })

    setFilteredBuses(result)
  }, [buses, sortBy, filterMode])

  const handleQuickBook = async () => {
    if (quickBooking) return
    if (!user) {
      toast.error('Please login first')
      navigate('/login')
      return
    }

    setQuickBooking(true)

    try {
      const lockRes = await quickBook({ from, to })
      const { bus, seatNumber, price, boardingPoint, droppingPoint } = lockRes.data

      if (bus.mode === 'A' || bus.paymentType === 'pay_after_ride') {
        const bookingRes = await createBooking({
          busId: bus._id,
          journeyDate: bus.journeyDate,
          seats: [seatNumber],
          passengerDetails: [{
            name: user.name || 'Passenger',
            age: user.age || 25,
            gender: user.gender || 'Male',
            phone: user.phone || ''
          }],
          boardingPoint: boardingPoint || bus.from,
          droppingPoint: droppingPoint || bus.to
        })

        toast.success('Seat Booked! Pay when you exit')
        navigate(`/ticket/${bookingRes.data._id}`)

      } else {
        navigate(`/payment`, {
          state: {
            busId: bus._id,
            busName: bus.busName,
            from: bus.from,
            to: bus.to,
            journeyDate: bus.journeyDate,
            departureTime: bus.departureTime,
            arrivalTime: bus.arrivalTime,
            seats: [seatNumber],
            passengerDetails: [{
              name: user.name || 'Passenger',
              age: user.age || 25,
              gender: user.gender || 'Male',
              phone: user.phone || ''
            }],
            totalAmount: price,
            boardingPoint: boardingPoint || bus.from,
            droppingPoint: droppingPoint || bus.to
          }
        })
      }
    } catch (err) {
      console.error('Quick book error:', err)
      toast.error(err.response?.data?.message || 'Quick book failed')
    } finally {
      setQuickBooking(false)
    }
  }

  const handleBookOption = async (bus, paymentType) => {
    if (paymentType === 'pay_after_ride') {
      try {
        const res = await createBooking({
          busId: bus.busId,
          journeyDate: date,
          seats: [bus.seat],
          passengerDetails: [{
            name: user.name || 'Passenger',
            age: user.age || 25,
            gender: user.gender || 'Male',
            phone: user.phone || ''
          }],
          boardingPoint: bus.boardingPoint,
          droppingPoint: bus.droppingPoint
        })

        toast.success('Seat Booked! Pay when you exit')
        navigate(`/ticket/${res.data._id}`)
      } catch (err) {
        toast.error(err.response?.data?.message || 'Booking failed')
      }
    } else {
      navigate('/payment', {
        state: {
          busId: bus.busId,
          busName: bus.busName,
          from: bus.from,
          to: bus.to,
          journeyDate: bus.journeyDate,
          seats: [bus.seat],
          totalAmount: bus.price,
          boardingPoint: bus.boardingPoint,
          droppingPoint: bus.droppingPoint,
          paymentType: 'prepay'
        }
      })
    }
  }

  if (loading) return <Loader />

  if (error) return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center py-12 px-8 bg-red-50 border-red-200 rounded-lg max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Bus className="w-8 h-8 text-red-600" />
        </div>
        <p className="text-xl text-gray-900 mb-4">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="text-white px-8 py-3 rounded-lg hover:opacity-90"
          style={{ backgroundColor: PRIMARY_COLOR }}
        >
          Go Back to Search
        </button>
      </div>
    </div>
  )

  const hasQuickOptions =!!(quickOptions?.payAfterRide || quickOptions?.payNow)

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
                {from} <span style={{ color: PRIMARY_COLOR }}>→</span> {to}
              </h1>
              <div className="flex items-center gap-4 text-gray-600">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {new Date(date).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                <div className="flex items-center gap-2">
                  <Bus className="w-4 h-4" />
                  {filteredBuses.length} {filteredBuses.length === 1? 'bus' : 'buses'} found
                </div>
              </div>
            </div>

            {buses.length > 0 && (
              <button
                onClick={handleQuickBook}
                disabled={quickBooking}
                className="text-white px-8 py-4 rounded-lg font-bold hover:opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-3"
                style={{ backgroundColor: quickBooking? undefined : PRIMARY_COLOR }}
              >
                {quickBooking? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Booking...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Quick Book - Next Bus
                  </>
                )}
              </button>
            )}
          </div>

          {/* Quick Book Options Cards */}
          {hasQuickOptions && (
            <div className="mb-8 grid md:grid-cols-2 gap-4">
              {quickOptions?.payAfterRide && (
                <div className="border-2 border-green-500 rounded-lg p-6 bg-green-50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                        Pay on Exit
                      </span>
                      <h3 className="text-xl font-bold mt-2">{quickOptions.payAfterRide.busName}</h3>
                      <p className="text-gray-600">{quickOptions.payAfterRide.busNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold" style={{ color: PRIMARY_COLOR }}>
                        ৳{quickOptions.payAfterRide.price}
                      </p>
                      <p className="text-sm text-gray-600">Seat {quickOptions.payAfterRide.seat}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleBookOption(quickOptions.payAfterRide, 'pay_after_ride')}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700"
                  >
                    Book Now - Pay Later
                  </button>
                </div>
              )}

              {quickOptions?.payNow && (
                <div className="border-2 border-blue-500 rounded-lg p-6 bg-blue-50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                        Pay Now
                      </span>
                      <h3 className="text-xl font-bold mt-2">{quickOptions.payNow.busName}</h3>
                      <p className="text-gray-600">{quickOptions.payNow.busNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold" style={{ color: PRIMARY_COLOR }}>
                        ৳{quickOptions.payNow.price}
                      </p>
                      <p className="text-sm text-gray-600">Seat {quickOptions.payNow.seat}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleBookOption(quickOptions.payNow, 'prepay')}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700"
                  >
                    Book & Pay
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Filters & Sort */}
          {buses.length > 0 && (
            <div className="bg-gray-50 border-gray-200 rounded-lg p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <SlidersHorizontal className="w-4 h-4" />
                  <span className="text-sm font-semibold">Filter & Sort</span>
                </div>

                <div className="flex flex-wrap gap-3">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 bg-white border-gray-300 rounded-lg text-gray-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="departure">Sort by Departure</option>
                    <option value="price">Sort by Price</option>
                    <option value="duration">Sort by Duration</option>
                  </select>

                  <select
                    value={filterMode}
                    onChange={(e) => setFilterMode(e.target.value)}
                    className="px-4 py-2 bg-white border-gray-300 rounded-lg text-gray-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All Buses</option>
                    <option value="A">Pay After Ride</option>
                    <option value="B">Pay Now</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bus List */}
        <div className="space-y-4">
          {filteredBuses.length === 0? (
            <div className="text-center py-20 bg-white border-gray-200 rounded-lg">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bus className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-2xl text-gray-900 mb-2">No buses found</p>
              <p className="text-gray-600 mb-6">Try different cities or dates</p>
              <button
                onClick={() => navigate('/')}
                className="text-white px-8 py-3 rounded-lg hover:opacity-90"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                Search Again
              </button>
            </div>
          ) : (
            filteredBuses.map(bus => <BusCard key={bus._id} bus={bus} />)
          )}
        </div>
      </div>
    </div>
  )
}
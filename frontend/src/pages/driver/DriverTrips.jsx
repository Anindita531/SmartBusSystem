import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bus, Calendar, Clock, MapPin, ArrowLeft, PlayCircle, CheckCircle, Loader, Navigation, Square, KeyRound, Banknote } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const PRIMARY_COLOR = '#0F4C75'

function VerifyExitCode({ bookingId, passengerName, onSuccess }) {
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)

  const handleVerify = async () => {
    if (code.length!== 6) {
      toast.error('6 digit code din')
      return
    }
    try {
      setVerifying(true)
      await api.post(`/bookings/${bookingId}/verify-exit-code`, { code })
      toast.success(`${passengerName} er exit verified`)
      setCode('')
      onSuccess()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid code')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="bg-purple-50 border-purple-200 rounded-lg p-3 w-full">
      <p className="text-xs font-semibold text-purple-800 mb-2 flex items-center gap-1">
        <KeyRound className="w-3 h-3" /> Exit Code Verify
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="123456"
          maxLength={6}
          className="flex-1 px-3 py-2 border-2 border-purple-300 rounded-lg text-center font-bold tracking-[0.3em] text-lg 
                     text-gray-900 bg-white placeholder:text-gray-400
                     focus:border-purple-600 focus:ring-2 focus:ring-purple-200 outline-none"
          inputMode="numeric"
        />
        <button
          onClick={handleVerify}
          disabled={verifying || code.length!== 6}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition min-w-16"
        >
          {verifying? '...' : 'OK'}
        </button>
      </div>
      <p className="text-xs text-gray-600 mt-1">Passenger   6 digit code dekhabe</p>
    </div>
  )
}

export default function DriverTrips() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [assignedBuses, setAssignedBuses] = useState([])
  const [selectedBus, setSelectedBus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [tracking, setTracking] = useState(false)
  const [currentLocation, setCurrentLocation] = useState(null)
  const [activeBookings, setActiveBookings] = useState([])

  const watchIdRef = useRef(null)
  const wakeLockRef = useRef(null)
  const lastSentRef = useRef(0)

  useEffect(() => {
    fetchAssignedBuses()
    return () => stopTracking()
  }, [])

  useEffect(() => {
    const savedBusId = localStorage.getItem('tracking_bus_id')
    const savedTracking = localStorage.getItem('gps_tracking')

    if (savedTracking === 'true' && savedBusId && assignedBuses.length > 0) {
      const bus = assignedBuses.find(b => b._id === savedBusId)
      if (bus && bus.tripStatus === 'started' && bus.mode === 'A') {
        setSelectedBus(bus)
        setTracking(true)
        startGPSTracking(bus._id)
      }
    }
  }, [assignedBuses])

  useEffect(() => {
    if (selectedBus?.tripStatus === 'started' && selectedBus?.mode === 'A') {
      fetchActiveBookings()
      const interval = setInterval(fetchActiveBookings, 8000)
      return () => clearInterval(interval)
    }
  }, [selectedBus])

  const fetchAssignedBuses = async () => {
    try {
      setLoading(true)
      const res = await api.get('/buses/conductor-buses')
      setAssignedBuses(res.data?.data || res.data || [])
    } catch (err) {
      toast.error('Failed to load buses')
    } finally {
      setLoading(false)
    }
  }

  const fetchBusDetails = async (busId) => {
    try {
      const res = await api.get(`/buses/${busId}`)
      setSelectedBus(res.data?.data || res.data)
    } catch (err) {
      toast.error('Failed to load bus details')
    }
  }

  const fetchActiveBookings = async () => {
    if (!selectedBus) return
    try {
      const res = await api.get(`/buses/${selectedBus._id}/active-bookings`)
      setActiveBookings(res.data?.data || res.data || [])
    } catch (err) {
      setActiveBookings([])
    }
  }

  const handleMarkCash = async (bookingId) => {
    if (!confirm('Confirm cash received from passenger?')) return
    try {
      await api.post(`/buses/${selectedBus._id}/mark-cash-payment`, { bookingId })
      toast.success('Cash marked. Exit code sent to passenger')
      fetchActiveBookings()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  const startGPSTracking = async (busId) => {
    if (!navigator.geolocation) {
      toast.error('GPS not supported')
      return
    }

    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
      } catch (err) {
        console.log('Wake Lock failed:', err)
      }
    }

    setTracking(true)
    localStorage.setItem('gps_tracking', 'true')
    localStorage.setItem('tracking_bus_id', busId)
    toast.success('GPS tracking started')

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        setCurrentLocation({ lat: latitude, lng: longitude })

        const now = Date.now()
        if (now - lastSentRef.current > 5000) {
          lastSentRef.current = now
          try {
            await api.put(`/buses/${busId}/location`, { lat: latitude, lng: longitude })
          } catch (err) {
            console.log('GPS update failed:', err)
          }
        }
      },
      (err) => {
        toast.error('GPS error: ' + err.message)
        stopTracking()
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const stopTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    if (wakeLockRef.current) {
      wakeLockRef.current.release()
      wakeLockRef.current = null
    }
    setTracking(false)
    setCurrentLocation(null)
    localStorage.removeItem('gps_tracking')
    localStorage.removeItem('tracking_bus_id')
  }

  const startTrip = async () => {
    try {
      setActionLoading(true)
      await api.put(`/buses/${selectedBus._id}/status`, { status: 'started' })
      toast.success('Trip Started')

      if (selectedBus.mode === 'A') {
        startGPSTracking(selectedBus._id)
      }

      await fetchBusDetails(selectedBus._id)
      await fetchAssignedBuses()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start trip')
    } finally {
      setActionLoading(false)
    }
  }

  const completeTrip = async () => {
    try {
      setActionLoading(true)
      await api.put(`/buses/${selectedBus._id}/status`, { status: 'completed' })
      toast.success('Trip Completed')
      stopTracking()
      await fetchBusDetails(selectedBus._id)
      await fetchAssignedBuses()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete trip')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin" style={{ color: PRIMARY_COLOR }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/driver')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Today's Trips</h1>
            <p className="text-gray-600">Driver: {user?.name}</p>
          </div>
        </div>

        {!selectedBus? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedBuses.length === 0? (
              <div className="col-span-full text-center py-12 bg-white border border-gray-200 rounded-lg">
                <Bus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No buses assigned yet</p>
              </div>
            ) : (
              assignedBuses.map(bus => (
                <div key={bus._id} onClick={() => fetchBusDetails(bus._id)} className="bg-white border-gray-200 rounded-lg p-5 cursor-pointer hover:border-gray-300 hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <Bus className="w-6 h-6" style={{ color: PRIMARY_COLOR }} />
                    <div>
                      <h3 className="text-gray-900 font-semibold">{bus.busName}</h3>
                      <p className="text-gray-600 text-sm">{bus.busNumber}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <MapPin className="w-4 h-4" style={{ color: PRIMARY_COLOR }} />
                      <span>{bus.from} → {bus.to}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-4 h-4" style={{ color: PRIMARY_COLOR }} />
                      <span>{new Date(bus.journeyDate).toLocaleDateString('en-GB')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock className="w-4 h-4" style={{ color: PRIMARY_COLOR }} />
                      <span>{bus.departureTime}</span>
                    </div>

                    <div className="mt-3 flex gap-2 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                        bus.tripStatus === 'started'? 'bg-green-50 text-green-700 border-green-200' :
                        bus.tripStatus === 'completed'? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-gray-50 text-gray-700 border-gray-200'
                      }`}>
                        {bus.tripStatus === 'started'? 'On Trip' :
                         bus.tripStatus === 'completed'? 'Completed' :
                         'Not Started'}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                        bus.mode === 'A'? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-orange-50 text-orange-700 border-orange-200'
                      }`}>
                        {bus.mode === 'A'? 'Mode A - Pay on Exit' : 'Mode B - Prepay'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <button onClick={() => setSelectedBus(null)} className="hover:text-gray-900 mb-4 text-sm flex items-center gap-1" style={{ color: PRIMARY_COLOR }}>
              <ArrowLeft className="w-4 h-4" /> Back to list
            </button>

            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">{selectedBus.busName} - {selectedBus.busNumber}</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg border-gray-200">
                <p className="text-gray-500 text-sm mb-1">Route</p>
                <p className="text-gray-900 font-semibold text-lg">{selectedBus.from} → {selectedBus.to}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border-gray-200">
                <p className="text-gray-500 text-sm mb-1">Date & Time</p>
                <p className="text-gray-900 font-semibold">{new Date(selectedBus.journeyDate).toLocaleDateString('en-GB')}</p>
                <p className="text-gray-600 text-sm">{selectedBus.departureTime}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border-gray-200">
                <p className="text-gray-500 text-sm mb-1">Mode</p>
                <p className={`font-semibold text-lg ${selectedBus.mode === 'A'? 'text-purple-600' : 'text-orange-600'}`}>
                  {selectedBus.mode === 'A'? 'Mode A - Pay on Exit' : 'Mode B - Prepay'}
                </p>
              </div>
            </div>

            {selectedBus.mode === 'A' && selectedBus.tripStatus === 'started' && activeBookings.length > 0 && (
              <div className="mb-6 bg-green-50 border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-bold text-green-800 mb-3 flex items-center gap-2">
                  <KeyRound className="w-5 h-5" />
                  Pay on Exit - Pending ({activeBookings.length})
                </h3>
                <div className="space-y-4">
                  {activeBookings.map(b => (
                    <div key={b._id} className="bg-white border-gray-200 p-4 rounded-lg shadow-sm">
                      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">

                        {/* Passenger Info */}
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 text-lg">{b.passengerDetails[0]?.name}</p>
                          <p className="text-sm text-gray-600">Seat {b.seats?.join(', ')} | PNR: {b.pnr}</p>
                          <p className="text-sm font-semibold text-gray-900 mt-1">Amount: ₹{b.totalAmount}</p>
                          <span className={`inline-block mt-2 px-3 py-1 text-xs rounded-full font-semibold ${
                            b.paymentStatus === 'Pending'? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {b.paymentStatus === 'Pending'? 'Payment Pending' : 'Paid'}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 min-w-[260px]">
                          {b.paymentStatus === 'Pending' && (
                            <button
                              onClick={() => handleMarkCash(b._id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                            >
                              <Banknote className="w-4 h-4" />
                              Cash Received
                            </button>
                          )}
                          <VerifyExitCode
                            bookingId={b._id}
                            passengerName={b.passengerDetails[0]?.name}
                            onSuccess={fetchActiveBookings}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedBus.mode === 'A' && selectedBus.tripStatus === 'started' && activeBookings.length === 0 && (
              <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-gray-600">No pending exits</p>
              </div>
            )}

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={startTrip}
                disabled={actionLoading || selectedBus.tripStatus === 'started' || selectedBus.tripStatus === 'completed'}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-medium"
              >
                {actionLoading? <Loader className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5" />}
                Start Trip
              </button>

              {selectedBus.mode === 'A' && selectedBus.tripStatus === 'started' && (
               !tracking? (
                  <button
                    onClick={() => startGPSTracking(selectedBus._id)}
                    className="flex items-center gap-2 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90"
                    style={{ backgroundColor: PRIMARY_COLOR }}
                  >
                    <Navigation className="w-5 h-5" /> Start GPS
                  </button>
                ) : (
                  <button
                    onClick={stopTracking}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium"
                  >
                    <Square className="w-5 h-5" /> Stop GPS
                  </button>
                )
              )}

              <button
                onClick={completeTrip}
                disabled={actionLoading || selectedBus.tripStatus === 'completed' || selectedBus.tripStatus!== 'started'}
                className="flex items-center gap-2 text-white px-6 py-3 rounded-lg font-medium disabled:bg-gray-300 hover:opacity-90"
                style={{ backgroundColor: selectedBus.tripStatus!== 'started'? undefined : PRIMARY_COLOR }}
              >
                {actionLoading? <Loader className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                Complete Trip
              </button>
            </div>

            {selectedBus.mode === 'A' && tracking && currentLocation && (
              <div className="mt-6 bg-green-50 border-green-200 rounded-lg p-4">
                <p className="text-green-700 font-semibold flex items-center gap-2 mb-2">
                  <Navigation className="w-5 h-5 animate-pulse" /> GPS Active
                </p>
                <p className="text-gray-900 text-sm">
                  Lat: {currentLocation.lat.toFixed(6)}, Lng: {currentLocation.lng.toFixed(6)}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
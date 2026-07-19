import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Bus, MapPin, Clock, CheckCircle, ArrowLeft, Navigation, Loader } from 'lucide-react'
import L from 'leaflet'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { useSocket } from '../context/SocketContext'

// 🔥 Theme 1: Corporate Blue | Theme 2: Indigo
const PRIMARY_COLOR = '#0F4C75' // Change to '#3730A3' for Theme 2

// Leaflet icon fix
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const busIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
  iconSize: [40, 40],
  iconAnchor: [20, 20]
})

export default function TrackBus() {
  const { busId } = useParams()
  const navigate = useNavigate()
  const socket = useSocket()
  const [bus, setBus] = useState(null)
  const [busLocation, setBusLocation] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [loading, setLoading] = useState(true)
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const busMarkerRef = useRef(null)
  const routeLineRef = useRef(null)

  // 1. Initial fetch + polling
  useEffect(() => {
    if (!busId || busId === 'undefined' || busId === 'null') {
      toast.error('Please select a bus to track from My Tickets')
      navigate('/bookings')
      return
    }
    fetchBusLocation()
    const interval = setInterval(fetchBusLocation, 30000)
    return () => clearInterval(interval)
  }, [busId, navigate])

  // 2. Socket listener
  useEffect(() => {
    if (!socket ||!busId) return

    socket.emit('joinBus', busId)

    socket.on('locationUpdate', (data) => {
      if (data.busId === busId && data.mode === 'A') {
        setBusLocation({ lat: data.latitude, lng: data.longitude })
        setLastUpdate(data.timestamp)
      }
    })

    socket.on('checkpointUpdate', (data) => {
      if (data.busId === busId) {
        fetchBusLocation()
        toast.success(`Bus ${data.status} ${data.checkpoint}`)
      }
    })

    return () => {
      socket.off('locationUpdate')
      socket.off('checkpointUpdate')
    }
  }, [socket, busId])

  // 3. Map INIT - শুধু একবার চলবে
  useEffect(() => {
    if (bus && busLocation && bus.mode === 'A' && mapRef.current &&!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([busLocation.lat, busLocation.lng], 15)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(mapInstanceRef.current)

      busMarkerRef.current = L.marker([busLocation.lat, busLocation.lng], { icon: busIcon })
      .addTo(mapInstanceRef.current)
      .bindPopup(bus.busName)

      const routePath = bus.checkpoints
      ?.filter(cp => cp.lat && cp.lng)
      ?.sort((a, b) => a.order - b.order)
      ?.map(cp => [cp.lat, cp.lng]) || []

      if (routePath.length > 1) {
        routeLineRef.current = L.polyline(routePath, { color: PRIMARY_COLOR, weight: 5 })
        .addTo(mapInstanceRef.current)
      }

      bus.checkpoints?.filter(cp => cp.lat && cp.lng).forEach(cp => {
        L.marker([cp.lat, cp.lng])
        .addTo(mapInstanceRef.current)
        .bindPopup(cp.name)
      })
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [bus])

  // 4. Marker UPDATE - busLocation change হলেই চলবে
  useEffect(() => {
    if (busLocation && busMarkerRef.current && mapInstanceRef.current) {
      busMarkerRef.current.setLatLng([busLocation.lat, busLocation.lng])
      mapInstanceRef.current.panTo([busLocation.lat, busLocation.lng], { animate: true, duration: 1 })
    }
  }, [busLocation])

  const fetchBusLocation = async () => {
    try {
      const res = await api.get(`/buses/${busId}/track`)
      const busData = res.data.data
      setBus(busData)

      if (busData.mode === 'A' && busData.gpsLocation?.coordinates) {
        setBusLocation({
          lat: busData.gpsLocation.coordinates[1],
          lng: busData.gpsLocation.coordinates[0]
        })
        setLastUpdate(busData.lastLocationUpdate)
      }
    } catch (err) {
      console.log('Track error:', err)
      toast.error('Failed to load bus location')
      navigate('/bookings')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin" style={{ color: PRIMARY_COLOR }} />
      </div>
    )
  }

  if (!bus) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-900 text-center">
          <p className="mb-4">Bus not found</p>
          <button onClick={() => navigate('/bookings')} className="text-white px-6 py-2 rounded-lg" style={{ backgroundColor: PRIMARY_COLOR }}>
            Go to My Tickets
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-900 mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>

        <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bus className="w-8 h-8" style={{ color: PRIMARY_COLOR }} />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{bus.busName}</h1>
              <p className="text-gray-600">{bus.busNumber}</p>
            </div>
            <span className={`ml-auto px-3 py-1 rounded-md text-xs font-semibold ${
              bus.mode === 'A'? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-orange-100 text-orange-700 border border-orange-200'
            }`}>
              {bus.mode === 'A'? 'GPS Live' : 'Manual Update'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-500 text-sm">Route</p>
              <p className="text-gray-900 font-semibold">{bus.from} → {bus.to}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-500 text-sm">Status</p>
              <p className={`font-semibold ${
                bus.tripStatus === 'started'? 'text-green-600' :
                bus.tripStatus === 'completed'? 'text-blue-600' :
                'text-gray-600'
              }`}>
                {bus.tripStatus === 'started'? 'On The Way' :
                 bus.tripStatus === 'completed'? 'Reached' :
                 'Not Started'}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-500 text-sm">Last Update</p>
              <p className="text-gray-900 font-semibold">
                {lastUpdate? new Date(lastUpdate).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                }) : 'N/A'}
              </p>
            </div>
          </div>

          {bus.mode === 'A' && bus.tripStatus === 'started' && busLocation && (
            <div className="mb-6">
              <div className="flex items-center gap-2 text-green-600 mb-3">
                <Navigation className="w-5 h-5 animate-pulse" />
                <p className="font-semibold">Live GPS Tracking</p>
              </div>
              <div
                ref={mapRef}
                style={{ height: '450px', width: '100%', borderRadius: '8px', zIndex: 0 }}
              />
            </div>
          )}

          {bus.mode === 'B' && bus.tripStatus === 'started' && bus.currentLocationName && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-orange-700">
                <MapPin className="w-5 h-5" />
                <p className="font-semibold">Currently At: {bus.currentLocationName}</p>
              </div>
              <p className="text-gray-600 text-sm mt-1">
                Last updated: {bus.lastUpdatedAt? new Date(bus.lastUpdatedAt).toLocaleTimeString('en-IN') : 'N/A'}
              </p>
            </div>
          )}

          <h3 className="text-gray-900 font-semibold mb-4 flex items-center gap-2">
            <Navigation className="w-5 h-5" style={{ color: PRIMARY_COLOR }} /> Journey Progress
          </h3>

          <div className="space-y-4">
            {bus.checkpoints
            ?.sort((a, b) => a.order - b.order)
            ?.map((cp, idx) => {
                const isCompleted =!!cp.actualArrivalTime
                const isCurrent = bus.currentCheckpointOrder === cp.order

                return (
                  <div key={idx} className="flex items-start gap-4">
                    <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isCompleted? 'bg-green-100 text-green-600' :
                      isCurrent? 'bg-yellow-100 text-yellow-600' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {isCompleted? <CheckCircle className="w-5 h-5" /> : cp.order}
                    </div>

                    <div className="flex-1 pb-4 border-l-2 border-gray-200 pl-4">
                      <p className={`font-semibold ${isCompleted? 'text-gray-900' : 'text-gray-600'}`}>
                        {cp.name}
                      </p>
                      <div className="flex flex-wrap gap-4 text-xs mt-1">
                        <span className="text-gray-500">
                          ETA: {cp.estimatedTime || 'N/A'}
                        </span>
                        {cp.actualArrivalTime && (
                          <span className="text-green-600">
                            Arrived: {cp.actualArrivalTime}
                          </span>
                        )}
                        {cp.actualDepartedTime && (
                          <span className="text-blue-600">
                            Departed: {cp.actualDepartedTime}
                          </span>
                        )}
                      </div>
                      {isCurrent && (
                        <span className="inline-block mt-2 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
                          Bus is here now
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>

          {bus.tripStatus === 'not_started' && (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>Trip hasn't started yet</p>
              <p className="text-sm">Scheduled: {bus.departureTime}</p>
            </div>
          )}

          {bus.tripStatus === 'completed' && (
            <div className="text-center py-8 text-green-600">
              <CheckCircle className="w-12 h-12 mx-auto mb-3" />
              <p className="font-semibold">Journey Completed</p>
              <p className="text-gray-500 text-sm">Bus has reached destination</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
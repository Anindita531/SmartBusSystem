import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Bus, MapPin, Calendar, User, Download, CheckCircle, Clock, IndianRupee, AlertTriangle, Star, Zap, Users, ArrowLeft, Route, Calculator } from 'lucide-react'
import { getBus } from '../api/bus.api'
import ReviewList from '../components/ReviewList'
import toast from 'react-hot-toast'

// 🔥 Theme 1: Corporate Blue | Theme 2: Indigo
const PRIMARY_COLOR = '#0F4C75' // Change to '#3730A3' for Theme 2

export default function BusDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [bus, setBus] = useState(null)
  const [activeTab, setActiveTab] = useState('details')
  const [loading, setLoading] = useState(true)

  const [boardingPoint, setBoardingPoint] = useState('')
  const [droppingPoint, setDroppingPoint] = useState('')
  const [calculatedFare, setCalculatedFare] = useState(0)
  const [distance, setDistance] = useState(0)

  useEffect(() => {
    fetchBus()
  }, [id])

  useEffect(() => {
    if (boardingPoint && droppingPoint && bus) {
      const fromIdx = bus.checkpoints.findIndex(c => c.name === boardingPoint)
      const toIdx = bus.checkpoints.findIndex(c => c.name === droppingPoint)

      if (fromIdx!== -1 && toIdx!== -1 && fromIdx < toIdx) {
        let fare = 0
        for (let i = fromIdx; i < toIdx; i++) {
          fare += bus.checkpoints[i + 1].fareFromHere
        }
        setCalculatedFare(fare)
        setDistance(bus.checkpoints[toIdx].distanceFromStart - bus.checkpoints[fromIdx].distanceFromStart)
      } else {
        setCalculatedFare(0)
        setDistance(0)
      }
    }
  }, [boardingPoint, droppingPoint, bus])

  const fetchBus = async () => {
    try {
      const res = await getBus(id)
      setBus(res.data.data)
    } catch (err) {
      console.log(err)
      toast.error('Failed to load bus details')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectSeats = () => {
    if (!boardingPoint ||!droppingPoint) {
      toast.error('Please select boarding and dropping points')
      return
    }
    navigate(`/bus/${bus._id}/seats`, {
      state: { boardingPoint, droppingPoint, calculatedFare, distance }
    })
  }

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: PRIMARY_COLOR, borderTopColor: 'transparent' }}></div>
    </div>
  )

  if (!bus) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-900 text-xl mb-4">Bus not found</p>
        <button onClick={() => navigate(-1)} className="hover:underline" style={{ color: PRIMARY_COLOR }}>Go Back</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Search
        </button>

        {/* Bus Header */}
        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{bus.busName}</h1>
                <span className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-md font-semibold">
                  {bus.busType}
                </span>
                {bus.ac && (
                  <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-yellow-600" />
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-6 text-gray-600">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" style={{ color: PRIMARY_COLOR }} />
                  <span>{bus.departureTime} - {bus.arrivalTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" style={{ color: PRIMARY_COLOR }} />
                  <span>{bus.availableSeats} seats available</span>
                </div>
                <div
                  className="flex items-center gap-2 cursor-pointer hover:text-yellow-600 transition-colors"
                  onClick={() => setActiveTab('reviews')}
                >
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <span className="font-bold text-gray-900">{bus.averageRating?.toFixed(1) || '4.0'}</span>
                  <span className="text-gray-500">({bus.totalReviews || 0} reviews)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stage Fare Selection */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Route className="w-5 h-5" style={{ color: PRIMARY_COLOR }} />
              <h3 className="text-gray-900 font-semibold">Select Your Journey Points</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-gray-600 text-sm mb-2 block font-medium">Boarding Point</label>
                <select
                  value={boardingPoint}
                  onChange={(e) => setBoardingPoint(e.target.value)}
                  className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select Boarding Point</option>
                  {bus.checkpoints?.slice(0, -1).map(cp => (
                    <option key={cp.order} value={cp.name}>{cp.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-gray-600 text-sm mb-2 block font-medium">Dropping Point</label>
                <select
                  value={droppingPoint}
                  onChange={(e) => setDroppingPoint(e.target.value)}
                  className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                  disabled={!boardingPoint}
                >
                  <option value="">Select Dropping Point</option>
                  {bus.checkpoints
                 ?.filter(cp => {
                      const boardIdx = bus.checkpoints.findIndex(c => c.name === boardingPoint)
                      return cp.order > (bus.checkpoints[boardIdx]?.order || 0)
                    })
                 .map(cp => (
                      <option key={cp.order} value={cp.name}>{cp.name}</option>
                    ))
                  }
                </select>
              </div>
            </div>

            {/* Calculated Fare Display */}
            {calculatedFare > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-green-600" />
                    <p className="text-green-700 font-semibold">Stage Fare Calculated</p>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">₹{calculatedFare}</p>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <p className="text-sm">
                    {boardingPoint} → {droppingPoint} • {distance.toFixed(1)} km
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-gray-500 text-sm mb-1">Full Route Fare</p>
                <p className="text-2xl font-bold text-gray-400 line-through">₹{bus.price}</p>
              </div>
              <button
                onClick={handleSelectSeats}
                disabled={!boardingPoint ||!droppingPoint}
                className="w-full sm:w-auto px-8 py-3 rounded-lg font-semibold text-white hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                <CheckCircle className="w-5 h-5" />
                Select Seats
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-gray-50 p-2 rounded-lg border border-gray-200">
          {['details', 'amenities', 'reviews', 'policies'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 rounded-md font-semibold capitalize transition-all ${
                activeTab === tab
             ? 'text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white'
              }`}
              style={activeTab === tab? { backgroundColor: PRIMARY_COLOR } : {}}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white border border-gray-200 rounded-lg p-8">
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-500 text-sm mb-1">From</p>
                  <p className="text-gray-900 font-semibold text-lg">{bus.from}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-500 text-sm mb-1">To</p>
                  <p className="text-gray-900 font-semibold text-lg">{bus.to}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-500 text-sm mb-1">Duration</p>
                  <p className="text-gray-900 font-semibold text-lg">{bus.duration}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-500 text-sm mb-1">Total Seats</p>
                  <p className="text-gray-900 font-semibold text-lg">{bus.totalSeats}</p>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-gray-900 font-semibold mb-4 flex items-center gap-2">
                  <Route className="w-5 h-5" style={{ color: PRIMARY_COLOR }} />
                  Route Checkpoints & Fares
                </h3>
                <div className="space-y-3">
                  {bus.checkpoints?.map((cp, i) => (
                    <div key={i} className="flex justify-between items-center bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-gray-900 font-semibold">{cp.name}</p>
                          <p className="text-gray-500 text-sm">{cp.estimatedTime}</p>
                        </div>
                      </div>
                      {i > 0 && (
                        <div className="text-right">
                          <p className="text-green-600 font-bold text-lg">₹{cp.fareFromHere}</p>
                          <p className="text-gray-500 text-xs">from start</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'amenities' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {bus.amenities?.map((amenity, i) => (
                <div key={i} className="bg-gray-50 border border-gray-200 p-4 rounded-lg text-gray-900 hover:border-blue-300 transition-all">
                  <CheckCircle className="w-5 h-5 text-green-600 mb-2" />
                  {amenity}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'reviews' && <ReviewList busId={bus._id} />}

          {activeTab === 'policies' && (
            <div className="space-y-4 text-gray-700">
              {[
                'Cancellation allowed 2 hours before departure',
                '100% refund if cancelled 24 hours before',
                'Stage fare applicable for partial journey',
                'Valid ID proof required during boarding'
              ].map((policy, i) => (
                <div key={i} className="flex items-start gap-3 bg-gray-50 p-4 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p>{policy}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
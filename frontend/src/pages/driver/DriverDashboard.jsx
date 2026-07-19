import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Bus, MapPin, Calendar, LogOut, Bell, KeyRound } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'

const PRIMARY_COLOR = '#0F4C75'

export default function DriverDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [pendingCount, setPendingCount] = useState(0)
  const [activeBusId, setActiveBusId] = useState(null)

  useEffect(() => {
    fetchActiveBusAndCount()
    const interval = setInterval(fetchActiveBusAndCount, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchActiveBusAndCount = async () => {
  try {
    const res = await api.get('/buses/conductor-buses')
    const buses = res.data?.data || res.data || []
    
    const activeBus = buses.find(b => b.tripStatus === 'started')
    
    if (activeBus) {
      setActiveBusId(activeBus._id)
      const bookingsRes = await api.get(`/buses/${activeBus._id}/active-bookings`)
      const bookings = bookingsRes.data?.data || bookingsRes.data || []
      
      // শুধু যারা pay করেছে কিন্তু exit করেনি
      const pending = bookings.filter(b => 
        b.paymentStatus === 'Paid' && !b.exitCodeUsed
      )
      setPendingCount(pending.length)
    } else {
      setActiveBusId(null)
      setPendingCount(0)
    }
  } catch (err) {
    console.log('Fetch error:', err)
  }
}
  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Driver Dashboard</h1>
            <p className="text-gray-600">Welcome, {user?.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div 
            onClick={() => navigate('/driver/trips')}
            className="bg-white border-gray-200 p-6 rounded-lg cursor-pointer hover:border-gray-300 hover:shadow-md transition-all"
          >
            <Bus className="w-12 h-12 mb-4" style={{ color: PRIMARY_COLOR }} />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">My Trips</h3>
            <p className="text-gray-600">View assigned buses & routes</p>
          </div>

          <div 
            onClick={() => {
              if (activeBusId) {
                navigate('/driver/trips')
              } else {
                alert('No active trip running')
              }
            }}
            className="bg-white border-gray-200 p-6 rounded-lg cursor-pointer hover:border-green-400 hover:shadow-md transition-all relative"
          >
            <KeyRound className="w-12 h-12 mb-4 text-green-600" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Pay on Exit</h3>
            <p className="text-gray-600">Verify passenger codes</p>
            
            {pendingCount > 0 && (
              <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                {pendingCount} Pending
              </div>
            )}
            
            {!activeBusId && (
              <p className="text-xs text-gray-500 mt-2">Start a trip to enable</p>
            )}
          </div>

          <div 
            onClick={() => navigate('/notifications')}
            className="bg-white border-gray-200 p-6 rounded-lg cursor-pointer hover:border-gray-300 hover:shadow-md transition-all"
          >
            <Bell className="w-12 h-12 mb-4" style={{ color: PRIMARY_COLOR }} />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Notifications</h3>
            <p className="text-gray-600">Check new assignments</p>
          </div>
        </div>
      </div>
    </div>
  )
}
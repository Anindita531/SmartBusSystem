import { useNavigate } from 'react-router-dom'
import { QrCode, Bus, LogOut, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

// 🔥 Theme 1: Corporate Blue | Theme 2: Indigo
const PRIMARY_COLOR = '#0F4C75' // Change to '#3730A3' for Theme 2

export default function ConductorDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Conductor Panel</h1>
            <div className="flex items-center gap-2 text-gray-600">
              <User className="w-4 h-4" />
              <p>Welcome, {user?.name}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-200"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => navigate('/conductor/scan')}
            className="bg-white border border-gray-200 rounded-lg p-8 hover:border-blue-300 hover:bg-blue-50 transition-all group"
          >
            <QrCode className="w-12 h-12 text-blue-600 mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Scan Ticket</h2>
            <p className="text-gray-600">Scan QR code to verify passenger ticket</p>
          </button>

          <button
            onClick={() => navigate('/conductor/trips')}
            className="bg-white border border-gray-200 rounded-lg p-8 hover:border-green-300 hover:bg-green-50 transition-all group"
          >
            <Bus className="w-12 h-12 text-green-600 mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Today's Trips</h2>
            <p className="text-gray-600">View today's assigned duty list</p>
          </button>
        </div>

        {/* Stats Section - Optional */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-gray-500 text-sm mb-1">Total Scans Today</p>
            <p className="text-3xl font-bold text-gray-900">0</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-gray-500 text-sm mb-1">Active Trip</p>
            <p className="text-3xl font-bold text-gray-900">None</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-gray-500 text-sm mb-1">Completed Trips</p>
            <p className="text-3xl font-bold text-gray-900">0</p>
          </div>
        </div>
      </div>
    </div>
  )
}
import { useState, useEffect } from 'react'
import { Bus, Users, Calendar, DollarSign, Loader, TrendingUp, Ticket, AlertTriangle, Tag, Quote as QuoteIcon, HelpCircle } from 'lucide-react'
import { getDashboardStats, getSalesData } from '../../api/admin.api'
import { Link, useNavigate } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

// 🔥 Theme 1: Corporate Blue | Theme 2: Indigo
const PRIMARY_COLOR = '#0F4C75' // Change to '#3730A3' for Theme 2

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [salesData, setSalesData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [statsRes, salesRes] = await Promise.all([
        getDashboardStats(),
        getSalesData()
      ])

      // Safety: handle both {data: {...}} and direct object/array
      const statsPayload = statsRes.data?.data || statsRes.data || {}
      const salesPayload = salesRes.data?.data || salesRes.data || []

      setStats(statsPayload)
      setSalesData(Array.isArray(salesPayload)? salesPayload : [])

    } catch (err) {
      console.error('Dashboard fetch error:', err)
      setError(err.response?.data?.message || 'Failed to load stats')
      setSalesData([])
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

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-red-600 bg-red-50 border-red-200 rounded-lg px-6 py-4">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Live data from your bus service.</p>
      </div>

      {/* Stats Grid - 6 cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        <div className="bg-white border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Bus className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-gray-600 text-sm mb-1">Total Buses</h3>
          <p className="text-3xl font-bold text-gray-900">{stats?.totalBuses || 0}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-gray-600 text-sm mb-1">Total Bookings</h3>
          <p className="text-3xl font-bold text-gray-900">{stats?.totalBookings || 0}</p>
        </div>

        <div className="bg-white border-gray-200 rounded-lg p-6 hover:border-green-300 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-gray-600 text-sm mb-1">Total Revenue</h3>
          <p className="text-3xl font-bold text-gray-900">₹{stats?.totalRevenue?.toLocaleString() || 0}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-orange-300 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <h3 className="text-gray-600 text-sm mb-1">Total Users</h3>
          <p className="text-3xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
        </div>

        <div className="bg-white border-gray-200 rounded-lg p-6 hover:border-pink-300 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-pink-50 rounded-lg flex items-center justify-center">
              <Ticket className="w-6 h-6 text-pink-600" />
            </div>
          </div>
          <h3 className="text-gray-600 text-sm mb-1">Active Coupons</h3>
          <p className="text-3xl font-bold text-gray-900">{stats?.activeCoupons || 0}</p>
        </div>

        {/* Active Offers Card */}
        <div
          onClick={() => navigate('/admin/offers')}
          className="bg-white border-gray-200 rounded-lg p-6 hover:border-cyan-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-cyan-50 rounded-lg flex items-center justify-center">
              <Tag className="w-6 h-6 text-cyan-600" />
            </div>
          </div>
          <h3 className="text-gray-600 text-sm mb-1">Active Offers</h3>
          <p className="text-3xl font-bold text-gray-900">{stats?.activeOffers || 0}</p>
          <p className="text-gray-500 text-xs mt-1">Live on /offers</p>
        </div>
      </div>

      {/* Sales Chart */}
      <div className="bg-white border-gray-200 rounded-lg p-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-6 h-6" style={{ color: PRIMARY_COLOR }} />
          <h2 className="text-xl font-bold text-gray-900">Last 7 Days Sales</h2>
        </div>

        {Array.isArray(salesData) && salesData.length > 0? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                stroke="#6b7280"
                tickFormatter={(val) => new Date(val).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
              />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                labelStyle={{ color: '#111827' }}
              />
              <Line
                type="monotone"
                dataKey="totalSales"
                stroke={PRIMARY_COLOR}
                strokeWidth={3}
                dot={{ fill: PRIMARY_COLOR, r: 5 }}
                name="Revenue (₹)"
              />
              <Line
                type="monotone"
                dataKey="bookings"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ fill: '#8b5cf6', r: 4 }}
                name="Bookings"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            No sales data available
          </div>
        )}
      </div>

      {/* Quick Actions - 7 cards now */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-6">
        <Link to="/admin/buses" className="bg-white border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:bg-blue-50 transition-all group">
          <Bus className="w-8 h-8 text-blue-600 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Manage Buses</h3>
          <p className="text-gray-600 text-sm">Add, edit or remove buses</p>
        </Link>

        <Link to="/admin/bookings" className="bg-white border-gray-200 rounded-lg p-6 hover:border-purple-300 hover:bg-purple-50 transition-all group">
          <Calendar className="w-8 h-8 text-purple-600 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Manage Bookings</h3>
          <p className="text-gray-600 text-sm">View all customer bookings</p>
        </Link>

        <Link to="/admin/users" className="bg-white border border-gray-200 rounded-lg p-6 hover:border-green-300 hover:bg-green-50 transition-all group">
          <Users className="w-8 h-8 text-green-600 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Manage Users</h3>
          <p className="text-gray-600 text-sm">Control user roles</p>
        </Link>

        <Link to="/admin/coupons" className="bg-white border-gray-200 rounded-lg p-6 hover:border-pink-300 hover:bg-pink-50 transition-all group">
          <Ticket className="w-8 h-8 text-pink-600 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Manage Coupons</h3>
          <p className="text-gray-600 text-sm">Create discount codes</p>
        </Link>

        <Link to="/admin/quotes" className="bg-white border border-gray-200 rounded-lg p-6 hover:border-yellow-300 hover:bg-yellow-50 transition-all group">
          <QuoteIcon className="w-8 h-8 text-yellow-600 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Manage Quotes</h3>
          <p className="text-gray-600 text-sm">Add inspirational quotes</p>
        </Link>

        {/* NEW FAQ CARD */}
        <Link to="/admin/faqs" className="bg-white border border-gray-200 rounded-lg p-6 hover:border-indigo-300 hover:bg-indigo-50 transition-all group">
          <HelpCircle className="w-8 h-8 text-indigo-600 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Manage FAQs</h3>
          <p className="text-gray-600 text-sm">Add & edit FAQ questions</p>
        </Link>

        <Link to="/admin/offers" className="bg-white border-gray-200 rounded-lg p-6 hover:border-cyan-300 hover:bg-cyan-50 transition-all group">
          <Tag className="w-8 h-8 text-cyan-600 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Manage Offers</h3>
          <p className="text-gray-600 text-sm">Create offer banners</p>
        </Link>

        <Link to="/admin/fine-disputes" className="bg-white border border-gray-200 rounded-lg p-6 hover:border-red-300 hover:bg-red-50 transition-all group relative">
          <AlertTriangle className="w-8 h-8 text-red-600 mb-4" />
          {stats?.pendingFineDisputes > 0 && (
            <span className="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
              {stats.pendingFineDisputes}
            </span>
          )}
          <h3 className="text-xl font-bold text-gray-900 mb-2">Fine Disputes</h3>
          <p className="text-gray-600 text-sm">Review disputes</p>
        </Link>
      </div>
    </div>
  )
}
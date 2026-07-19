import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, Loader } from 'lucide-react'
import { getDashboardStats } from '../../api/admin.api'

export default function Revenue() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStats() }, [])

  const fetchStats = async () => {
    try {
      const res = await getDashboardStats()
      setStats(res.data.data)
    } catch (err) {
      alert('Failed to load revenue')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader className="w-8 h-8 text-blue-500 animate-spin" /></div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <h1 className="text-4xl font-bold text-white mb-8 flex items-center gap-3">
        <DollarSign className="w-8 h-8 text-green-500" /> Revenue Report
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 text-lg">Total Revenue</h3>
            <TrendingUp className="w-6 h-6 text-green-500" />
          </div>
          <p className="text-5xl font-bold text-white">₹{stats?.totalRevenue?.toLocaleString() || 0}</p>
          <p className="text-slate-500 text-sm mt-2">From {stats?.totalBookings || 0} confirmed bookings</p>
        </div>

        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 text-lg">Avg per Booking</h3>
            <DollarSign className="w-6 h-6 text-blue-500" />
          </div>
          <p className="text-5xl font-bold text-white">
            ₹{stats?.totalBookings > 0? Math.round(stats.totalRevenue / stats.totalBookings) : 0}
          </p>
          <p className="text-slate-500 text-sm mt-2">Average ticket value</p>
        </div>
      </div>
    </div>
  )
}
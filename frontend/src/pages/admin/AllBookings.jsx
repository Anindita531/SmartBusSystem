import { useState, useEffect } from 'react'
import { Calendar, Loader, Download, Filter, Search } from 'lucide-react'
import { getAllBookings } from '../../api/admin.api'
import toast from 'react-hot-toast'

export default function AllBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [refundFilter, setRefundFilter] = useState('all')
  const [pnrSearch, setPnrSearch] = useState('')

  useEffect(() => {
    fetchBookings()
  }, [currentPage, statusFilter, refundFilter, pnrSearch])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const params = {
        page: currentPage,
        limit: 20,
        status: statusFilter,
        pnr: pnrSearch,
        refundStatus: refundFilter
      }
      const res = await getAllBookings(params)
      const data = res.data.data
      setBookings(data.bookings || [])
      setTotalPages(data.totalPages || 1)
    } catch (err) {
      console.error('Error:', err)
      setBookings([])
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    const csv = [
      ['PNR', 'User', 'Email', 'Bus', 'Route', 'Seats', 'Amount', 'Discount', 'Status', 'Refund Status', 'Refund Amount', 'Refund Date', 'Journey Date', 'Cancelled At'].join(','),
     ...bookings.map(b => [
        b.pnr,
        b.user?.name || 'N/A',
        b.user?.email || 'N/A',
        b.bus?.busName || 'N/A',
        `${b.bus?.from || 'N/A'} - ${b.bus?.to || 'N/A'}`,
        b.seats?.join(' ') || 'N/A',
        b.totalAmount || 0,
        b.discount || 0,
        b.status,
        b.refundStatus || 'N/A',
        b.refundAmount || 0,
        b.refundDate? new Date(b.refundDate).toLocaleDateString('en-GB') : 'N/A',
        new Date(b.journeyDate).toLocaleDateString('en-GB'),
        b.cancelledAt? new Date(b.cancelledAt).toLocaleDateString('en-GB') : 'N/A'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bookings-${Date.now()}.csv`
    a.click()
    toast.success('Exported successfully')
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white flex items-center gap-3">
            <Calendar className="w-8 h-8 text-purple-500" /> All Bookings
          </h1>
          <button
            onClick={handleExport}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by PNR..."
                value={pnrSearch}
                onChange={(e) => setPnrSearch(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:border-blue-500 outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900/60 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none"
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Completed">Completed</option>
              <option value="Expired">Expired</option>
            </select>

            <select
              value={refundFilter}
              onChange={(e) => setRefundFilter(e.target.value)}
              className="bg-slate-900/60 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none"
            >
              <option value="all">All Refunds</option>
              <option value="Pending">Refund Pending</option>
              <option value="Processing">Processing</option>
              <option value="Completed">Refund Completed</option>
              <option value="Failed">Refund Failed</option>
              <option value="Not Required">Not Required</option>
            </select>

            {(statusFilter!== 'all' || refundFilter!== 'all' || pnrSearch) && (
              <button
                onClick={() => {
                  setStatusFilter('all')
                  setRefundFilter('all')
                  setPnrSearch('')
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
          {bookings.length === 0? (
            <div className="text-center py-20 text-slate-500">
              <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No bookings found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="text-left py-3 px-4 text-slate-400 text-sm font-semibold">PNR</th>
                      <th className="text-left py-3 px-4 text-slate-400 text-sm font-semibold">User</th>
                      <th className="text-left py-3 px-4 text-slate-400 text-sm font-semibold">Bus</th>
                      <th className="text-left py-3 px-4 text-slate-400 text-sm font-semibold">Route</th>
                      <th className="text-left py-3 px-4 text-slate-400 text-sm font-semibold">Seats</th>
                      <th className="text-left py-3 px-4 text-slate-400 text-sm font-semibold">Amount</th>
                      <th className="text-left py-3 px-4 text-slate-400 text-sm font-semibold">Journey</th>
                      <th className="text-left py-3 px-4 text-slate-400 text-sm font-semibold">Status</th>
                      <th className="text-left py-3 px-4 text-slate-400 text-sm font-semibold">Refund</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b._id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition">
                        <td className="py-4 px-4">
                          <span className="text-white font-mono text-sm font-semibold">{b.pnr}</span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-slate-300 text-sm font-medium">{b.user?.name || 'N/A'}</div>
                          <div className="text-slate-500 text-xs">{b.user?.email || ''}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-slate-300 text-sm">{b.bus?.busName || 'N/A'}</div>
                          <div className="text-slate-500 text-xs">{b.bus?.busNumber || ''}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-slate-300 text-sm">
                            {b.bus?.from || 'N/A'} → {b.bus?.to || 'N/A'}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-1">
                            {b.seats?.map(seat => (
                              <span key={seat} className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs font-semibold">
                                {seat}
                              </span>
                            )) || 'N/A'}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-white font-semibold">₹{b.totalAmount || 0}</div>
                          {b.discount > 0 && (
                            <div className="text-green-400 text-xs">-₹{b.discount} off</div>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-slate-300 text-sm">
                            {new Date(b.journeyDate).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short'
                            })}
                          </div>
                          <div className="text-slate-500 text-xs">
                            {b.bus?.departureTime || ''}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            b.status === 'Confirmed'? 'bg-green-500/20 text-green-400' :
                            b.status === 'Pending'? 'bg-yellow-500/20 text-yellow-400' :
                            b.status === 'Cancelled'? 'bg-red-500/20 text-red-400' :
                            b.status === 'Completed'? 'bg-blue-500/20 text-blue-400' :
                            'bg-slate-500/20 text-slate-400'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {b.status === 'Cancelled'? (
                            <div className="flex flex-col gap-1">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold w-fit ${
                                b.refundStatus === 'Completed'? 'bg-green-500/20 text-green-400' :
                                b.refundStatus === 'Pending'? 'bg-yellow-500/20 text-yellow-400' :
                                b.refundStatus === 'Processing'? 'bg-blue-500/20 text-blue-400' :
                                b.refundStatus === 'Failed'? 'bg-red-500/20 text-red-400' :
                                'bg-slate-500/20 text-slate-400'
                              }`}>
                                {b.refundStatus || 'Not Required'}
                              </span>
                              {b.refundAmount > 0 && (
                                <div className="text-xs text-slate-400 font-semibold">₹{b.refundAmount}</div>
                              )}
                              {b.refundDate && (
                                <div className="text-xs text-slate-500">
                                  {new Date(b.refundDate).toLocaleDateString('en-GB')}
                                </div>
                              )}
                              {b.cancelledAt && (
                                <div className="text-xs text-slate-600">
                                  Cancelled: {new Date(b.cancelledAt).toLocaleDateString('en-GB')}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500 text-xs">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-700/50">
                  <div className="text-slate-400 text-sm">
                    Showing {bookings.length} bookings | Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
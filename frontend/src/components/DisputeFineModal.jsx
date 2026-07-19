// components/DisputeFineModal.jsx
import { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'

export default function DisputeFineModal({ booking, onClose, onSuccess }) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!reason.trim()) {
      toast.error('Please provide a reason')
      return
    }

    setLoading(true)
    try {
      await api.post(`/bookings/${booking._id}/dispute-fine`, { reason })
      toast.success('Dispute submitted. Admin will review.')
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Report Unfair Fine</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 mb-4">
          <p className="text-orange-400 text-sm font-bold">PNR: {booking.pnr}</p>
          <p className="text-slate-300 text-sm">Fine Amount: ₹{booking.fineAmount}</p>
          <p className="text-slate-400 text-xs mt-1">Reason: {booking.fineReason}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="block text-slate-300 text-sm mb-2">
            Why do you think this fine is unfair?
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="E.g: Conductor forced me to pay extra, I boarded at correct stop but he claimed otherwise..."
            className="w-full bg-slate-700 text-white rounded-lg p-3 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
            required
          />

          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-bold disabled:opacity-50 transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit Dispute'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
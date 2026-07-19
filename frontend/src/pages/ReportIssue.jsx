import { useState } from 'react'
import { AlertTriangle, Upload, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios' // তোর axios instance

export default function ReportIssue() {
  const navigate = useNavigate()
  const [issueType, setIssueType] = useState('')
  const [bookingId, setBookingId] = useState('')
  const [description, setDescription] = useState('')
  const [proof, setProof] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!issueType) return toast.error('Select issue type')
    if (!description.trim()) return toast.error('Please describe the issue')
    if (issueType === 'cash_fine_no_receipt' &&!proof) {
      return toast.error('Proof is required for cash fine complaints')
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('issueType', issueType)
      formData.append('bookingId', bookingId)
      formData.append('description', description)
      if (proof) formData.append('proof', proof)

      await api.post('/issues/report', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      toast.success('Report submitted. Admin will verify within 48 hours')
      navigate('/profile')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-8 px-4">
      <div className="max-w-md mx-auto">
        <button onClick={() => navigate(-1)} className="text-slate-400 mb-4 flex items-center gap-2">
          <X className="w-5 h-5" /> Back
        </button>

        <div className="bg-slate-800/40 backdrop-blur-2xl border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
            Report an Issue
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-slate-300 text-sm mb-2 block">Issue Type *</label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-4 py-3 text-white"
              >
                <option value="">Select Issue Type</option>
                <option value="cash_fine_no_receipt">Conductor took cash, no receipt</option>
                <option value="overcharge">Charged more than ticket price</option>
                <option value="misbehavior">Conductor/Driver misbehaved</option>
                <option value="other">Other issue</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 text-sm mb-2 block">PNR / Booking ID (Optional)</label>
              <input
                type="text"
                placeholder="Enter PNR if you have"
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-4 py-3 text-white"
              />
            </div>

            <div>
              <label className="text-slate-300 text-sm mb-2 block">Description *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Bus number, time, conductor details, what happened..."
                className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-4 py-3 text-white h-32 resize-none"
              />
            </div>

            <div>
              <label className="text-yellow-400 text-sm font-bold mb-2 flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload Proof {issueType === 'cash_fine_no_receipt' && '(Required)'}
              </label>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => setProof(e.target.files[0])}
                className="text-slate-300 text-sm w-full file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-500/20 file:text-blue-400"
              />
              <p className="text-slate-500 text-xs mt-2">
                Photo/video of bus, conductor, location. No proof = case may be rejected
              </p>
            </div>

            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-400 text-xs">
                ⚠️ False reports will result in account suspension.
                Admin will verify with conductor GPS data & trip logs.
              </p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold disabled:opacity-50 transition-colors"
            >
              {loading? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
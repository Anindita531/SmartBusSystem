import { useEffect, useState } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { AlertTriangle, CheckCircle, XCircle, Loader, X, FileText } from 'lucide-react'

// 🔥 Theme 1: Corporate Blue | Theme 2: Indigo
const PRIMARY_COLOR = '#0F4C75' // Change to '#3730A3' for Theme 2

export default function FineDisputes() {
  const [disputes, setDisputes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDispute, setSelectedDispute] = useState(null)
  const [resolution, setResolution] = useState('')
  const [refundAmount, setRefundAmount] = useState(0)
  const [processing, setProcessing] = useState(false)
  const [investigation, setInvestigation] = useState(null)

  useEffect(() => {
    fetchDisputes()
  }, [])

  const fetchDisputes = async () => {
    try {
      const res = await api.get('/admin/fine-disputes')
      console.log('API Response:', res.data)
      setDisputes(res.data.data || [])
    } catch (err) {
      toast.error('Failed to fetch disputes')
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchInvestigation = async (bookingId) => {
    try {
      const res = await api.get(`/admin/investigate-dispute/${bookingId}`)
      setInvestigation(res.data.data.investigation)
    } catch (err) {
      console.log('Investigation fetch failed:', err)
    }
  }

  const handleOpenModal = (dispute) => {
    setSelectedDispute(dispute)
    setRefundAmount(dispute.fineAmount)
    setResolution('')
    fetchInvestigation(dispute._id)
  }

  const handleResolve = async (action) => {
    if (!resolution.trim()) {
      toast.error('Please provide a resolution note')
      return
    }

    setProcessing(true)
    try {
      await api.post(`/admin/resolve-fine-dispute/${selectedDispute._id}`, {
        action: action === 'approve'? 'resolved' : 'rejected',
        resolution,
        refundAmount: action === 'approve'? Number(refundAmount) : 0,
        adminNotes: resolution
      })
      toast.success(`Dispute ${action}ed successfully`)
      setSelectedDispute(null)
      setResolution('')
      setRefundAmount(0)
      setInvestigation(null)
      fetchDisputes()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resolve')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin" style={{ color: PRIMARY_COLOR }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Fine Disputes</h1>
        <p className="text-gray-600">Review and resolve passenger fine disputes</p>
      </div>

      {disputes.length === 0? (
        <div className="text-center text-gray-600 py-20 bg-gray-50 rounded-lg border border-gray-200">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg mb-2">No pending disputes</p>
          <p className="text-sm">All fine disputes have been resolved</p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map(dispute => (
            <div key={dispute._id} className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">PNR: {dispute.pnr}</h3>
                  <p className="text-gray-700">
                    {dispute.user?.name} • {dispute.user?.phone}
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    {dispute.bus?.busName} • {dispute.boardingPoint} → {dispute.droppingPoint}
                  </p>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                  dispute.fineDisputeStatus === 'pending' || dispute.fineDisputeStatus === 'under_review'
                   ? 'bg-orange-50 text-orange-700 border border-orange-200'
                    : dispute.fineDisputeStatus === 'resolved'
                   ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {dispute.fineDisputeStatus}
                </span>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-gray-500 text-xs">Fine Amount</p>
                    <p className="text-2xl font-bold text-red-600">₹{dispute.fineAmount}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Original Fine Reason</p>
                    <p className="text-gray-900 text-sm">{dispute.fineReason}</p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Passenger's Dispute Reason</p>
                  <p className="text-gray-700 text-sm bg-white p-3 rounded-lg border border-gray-200">
                    {dispute.fineDisputeReason}
                  </p>
                </div>
              </div>

              {(dispute.fineDisputeStatus === 'pending' || dispute.fineDisputeStatus === 'under_review') && (
                <button
                  onClick={() => handleOpenModal(dispute)}
                  className="text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90"
                  style={{ backgroundColor: PRIMARY_COLOR }}
                >
                  Review & Resolve
                </button>
              )}

              {dispute.fineDisputeStatus === 'resolved' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-700 text-sm font-bold">
                    ✓ Resolved - Refund: ₹{dispute.fineDisputeRefund}
                  </p>
                  <p className="text-gray-600 text-xs mt-1">
                    Note: {dispute.fineDisputeResolution}
                  </p>
                </div>
              )}

              {dispute.fineDisputeStatus === 'rejected' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm font-bold">✗ Dispute Rejected</p>
                  <p className="text-gray-600 text-xs mt-1">
                    Note: {dispute.fineDisputeResolution}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Resolve Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Resolve Dispute</h3>
              <button onClick={() => {
                setSelectedDispute(null)
                setInvestigation(null)
              }} className="text-gray-400 hover:text-gray-900">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-gray-900 font-bold">PNR: {selectedDispute.pnr}</p>
              <p className="text-gray-700 text-sm">Passenger: {selectedDispute.user?.name}</p>
              <p className="text-gray-700 text-sm">Fine: ₹{selectedDispute.fineAmount}</p>
              <p className="text-gray-600 text-xs mt-2">{selectedDispute.fineDisputeReason}</p>
            </div>

            {/* Auto Investigation */}
            {investigation && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                <p className="text-blue-700 font-semibold text-sm mb-2">Auto Investigation:</p>
                <p className="text-gray-700 text-xs">Conductor Dispute Rate: {investigation.conductorDisputeRate}</p>
                <p className="text-gray-700 text-xs">Passenger Past Disputes: {investigation.passengerPastDisputes}</p>
                <p className="text-gray-700 text-xs">Suggestion:
                  <span className={`font-bold ml-1 ${
                    investigation.suggestion === 'APPROVE_REFUND'? 'text-green-600' : 'text-red-600'
                  }`}>
                    {investigation.suggestion}
                  </span>
                </p>
              </div>
            )}

            {/* Passenger Proof */}
            {selectedDispute?.fineDisputeProof? (
              <div className="mb-4">
                <p className="text-gray-700 text-sm mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Passenger Uploaded Proof:
                </p>
                <a href={selectedDispute.fineDisputeProof} target="_blank" rel="noopener noreferrer">
                  <img
                    src={selectedDispute.fineDisputeProof}
                    className="rounded-lg max-h-60 border border-gray-300 hover:opacity-80 cursor-pointer"
                    alt="Dispute proof"
                  />
                </a>
                {selectedDispute.fineDisputeProofUploadedAt && (
                  <p className="text-gray-500 text-xs mt-1">
                    Uploaded: {new Date(selectedDispute.fineDisputeProofUploadedAt).toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            ) : (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm font-semibold">⚠️ No proof uploaded by passenger</p>
                <p className="text-gray-600 text-xs mt-1">Recommend reject without valid proof</p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-gray-700 text-sm mb-2">Resolution Note *</label>
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Explain your decision... e.g., 'Rejected - No valid proof provided'"
                className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg p-3 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm mb-2">Refund Amount (₹)</label>
              <input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                max={selectedDispute.fineAmount}
                min={0}
                className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-gray-500 text-xs mt-1">Max: ₹{selectedDispute.fineAmount}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleResolve('reject')}
                disabled={processing ||!resolution.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-bold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                <XCircle className="w-5 h-5" />
                Reject
              </button>
              <button
                onClick={() => handleResolve('approve')}
                disabled={processing ||!resolution.trim()}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-bold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                <CheckCircle className="w-5 h-5" />
                Approve & Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
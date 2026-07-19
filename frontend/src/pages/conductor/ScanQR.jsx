import { useState, useEffect } from 'react'
import { QrCode, ArrowLeft, AlertTriangle, CheckCircle, Loader, MapPin, Bus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { verifyBooking, verifyBoarding, verifyExit } from '../../api/booking.api'
import api from '../../api/axios'
import toast from 'react-hot-toast'

// 🔥 Theme 1: Corporate Blue | Theme 2: Indigo
const PRIMARY_COLOR = '#0F4C75' // Change to '#3730A3' for Theme 2

export default function ScanQR() {
  const navigate = useNavigate()
  const [pnr, setPnr] = useState('')
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(false)
  const [currentCheckpointOrder, setCurrentCheckpointOrder] = useState(1)
  const [currentBus, setCurrentBus] = useState(null)
  const [scanMode, setScanMode] = useState('boarding')
  const [lastScanResult, setLastScanResult] = useState(null)

  useEffect(() => {
    fetchCurrentBus()
  }, [])

  const fetchCurrentBus = async () => {
    try {
      const res = await api.get('/buses/conductor-buses')
      const buses = res.data.data || []
      const activeBus = buses.find(b => b.tripStatus === 'started')

      if (activeBus) {
        setCurrentBus(activeBus)
        setCurrentCheckpointOrder(activeBus.currentCheckpointOrder || 1)
      } else {
        toast.error('No active trip. Start trip first.')
      }
    } catch (err) {
      console.error('Fetch bus error:', err)
    }
  }

  const handleVerify = async () => {
    if (!pnr) return toast.error('Enter PNR')

    try {
      setLoading(true)
      setLastScanResult(null)
      const res = await verifyBooking(pnr)

      if (!res.data.success) {
        toast.error(res.data.message || 'Verification failed')
        setBooking(null)
        return
      }

      setBooking(res.data.data)
      toast.success('Ticket verified')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid PNR')
      setBooking(null)
    } finally {
      setLoading(false)
    }
  }

const handleBoardingScan = async () => {
    if (!currentBus || loading) return // 1. double click bondho

    try {
      setLoading(true)
      const res = await verifyBoarding(pnr, currentCheckpointOrder)
      
      if (!res.data.success) {
        toast.error(res.data.message || 'Boarding failed')
        return
      }

      const data = res.data
      setLastScanResult(data)
      setBooking(null)
      setPnr('') // 2. PNR clear kore dao

      if (data.fineAmount > 0) {
        toast.error(`Fine Issued: ₹${data.fineAmount}. Mail sent to passenger.`)
      } else {
        toast.success('Boarding successful - No Fine')
      }
    } catch (err) {
      console.error('Scan error:', err)
      toast.error(err.response?.data?.message || 'Scan failed')
    } finally {
      setLoading(false)
    }
  }
  const handleExitScan = async () => {
    if (!currentBus) {
      toast.error('No active bus. Start trip first.')
      return
    }

    try {
      setLoading(true)
      const res = await verifyExit(pnr, currentCheckpointOrder)

      if (!res.data.success) {
        toast.error(res.data.message || 'Exit failed')
        return
      }

      const data = res.data.data
      setLastScanResult(data)
      setBooking(null)

      if (data.fineAmount > 0) {
        toast.error(`Over-Travel Fine: ₹${data.fineAmount}. Mail sent.`)
      } else {
        toast.success('Journey completed - No Fine')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Scan failed')
    } finally {
      setLoading(false)
    }
  }

  const resetScan = () => {
    setLastScanResult(null)
    setBooking(null)
    setPnr('')
  }

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => navigate('/conductor')}
          className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <QrCode className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Scan Ticket</h2>
              <p className="text-gray-600 text-sm">Verify passenger PNR</p>
            </div>
          </div>

          {currentBus && !lastScanResult && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-blue-700 text-sm">
                <MapPin className="w-4 h-4" />
                <span className="font-semibold">{currentBus.busName}</span>
              </div>
              <p className="text-gray-600 text-xs mt-1">
                Scanning at: {currentBus.currentLocation || currentBus.from}
              </p>
            </div>
          )}

          {/* Fine Issued Screen */}
          {lastScanResult && lastScanResult.fineAmount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-700 font-bold text-lg">
                    Fine Issued: ₹{lastScanResult.fineAmount}
                  </p>
                  <p className="text-gray-700 text-sm mt-1">
                    {scanMode === 'boarding'
                     ? 'Passenger boarded from earlier stop'
                      : 'Passenger travelled beyond destination'}
                  </p>
                  <p className="text-gray-600 text-xs mt-2">
                    PNR: {lastScanResult.booking?.pnr || pnr} | {lastScanResult.booking?.user?.name || 'N/A'}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    {lastScanResult.fineReason || 'Early boarding detected'}
                  </p>
                  <p className="text-green-600 text-xs mt-3 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Payment link sent to passenger email
                  </p>

                  <button
                    onClick={resetScan}
                    className="w-full mt-4 bg-gray-200 hover:bg-gray-300 text-gray-900 py-3 rounded-lg font-bold"
                  >
                    Next Passenger
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Success Screen - No Fine */}
          {lastScanResult && lastScanResult.fineAmount === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-green-700 font-bold text-lg">
                    {scanMode === 'boarding'? 'Boarding Successful' : 'Journey Completed'}
                  </p>
                  <div className="space-y-1 text-sm mt-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">PNR:</span>
                      <span className="text-gray-900 font-mono">{lastScanResult.booking?.pnr || pnr}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Passenger:</span>
                      <span className="text-gray-900">{lastScanResult.booking?.user?.name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Route:</span>
                      <span className="text-gray-900 text-xs">{lastScanResult.booking?.boardingPoint} → {lastScanResult.booking?.droppingPoint}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fine:</span>
                      <span className="text-green-600 font-bold">₹0 (No Fine)</span>
                    </div>
                  </div>

                  <button
                    onClick={resetScan}
                    className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Normal Scan UI */}
          {!lastScanResult && (
            <>
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setScanMode('boarding')}
                  className={`flex-1 py-2 rounded-lg font-medium text-sm ${
                    scanMode === 'boarding'
                     ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Boarding
                </button>
                <button
                  onClick={() => setScanMode('exit')}
                  className={`flex-1 py-2 rounded-lg font-medium text-sm ${
                    scanMode === 'exit'
                     ? 'bg-orange-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Exit
                </button>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Enter PNR or scan QR"
                  value={pnr}
                  onChange={(e) => setPnr(e.target.value.toUpperCase())}
                  className="w-full bg-white border border-gray-300 text-gray-900 px-4 py-3 rounded-lg focus:border-blue-500 outline-none"
                />

                <button
                  onClick={handleVerify}
                  disabled={loading || !pnr || !currentBus}
                  className="w-full text-white py-3 rounded-lg font-bold disabled:bg-gray-300"
                  style={{ backgroundColor: loading || !pnr || !currentBus ? undefined : PRIMARY_COLOR }}
                >
                  {loading? 'Verifying...' : 'Verify Ticket'}
                </button>
              </div>
            </>
          )}

          {booking && !lastScanResult && (
            <div className="mt-6 bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-600 font-semibold">Valid Ticket</span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">PNR:</span>
                  <span className="text-gray-900 font-mono">{booking.pnr}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Passenger:</span>
                  <span className="text-gray-900">{booking.user?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Route:</span>
                  <span className="text-gray-900 text-xs">{booking.boardingPoint} → {booking.droppingPoint}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="text-gray-900">{booking.status}</span>
                </div>
              </div>

              <button
                onClick={scanMode === 'boarding'? handleBoardingScan : handleExitScan}
                disabled={loading}
                className={`w-full mt-4 py-3 rounded-lg font-bold text-white ${
                  scanMode === 'boarding'
                   ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-orange-600 hover:bg-orange-700'
                } disabled:bg-gray-300`}
              >
                {loading? 'Processing...' : scanMode === 'boarding'? 'Confirm Boarding' : 'Confirm Exit'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
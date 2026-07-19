import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bus, Calendar, Clock, MapPin, ArrowLeft, CheckCircle, User, Phone, Loader, Navigation, AlertTriangle, Info, PlayCircle, QrCode, ScanLine, CreditCard } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import { updateCheckpoint } from '../../api/bus.api'
import { verifyBoarding, verifyExit, payFine } from '../../api/booking.api'
import toast from 'react-hot-toast'

// 🔥 Theme 1: Corporate Blue | Theme 2: Indigo
const PRIMARY_COLOR = '#0F4C75' // Change to '#3730A3' for Theme 2

export default function ConductorTrips() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [assignedBuses, setAssignedBuses] = useState([])
  const [selectedBus, setSelectedBus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [scannedPNR, setScannedPNR] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [lastScanResult, setLastScanResult] = useState(null)
  const [paying, setPaying] = useState(false)
  const [paymentMode, setPaymentMode] = useState('cash')
  
  const upiId = user?.upiId || 'busapp@paytm'

  useEffect(() => {
    fetchAssignedBuses()
  }, [])

  const fetchAssignedBuses = async () => {
    try {
      setLoading(true)
      const res = await api.get('/buses/conductor-buses')
      setAssignedBuses(res.data.data || [])
    } catch (err) {
      console.error('Fetch buses error:', err)
      toast.error('Failed to load buses')
      setAssignedBuses([])
    } finally {
      setLoading(false)
    }
  }

  const fetchBusDetails = async (busId) => {
    try {
      const res = await api.get(`/buses/${busId}`)
      setSelectedBus(res.data.data)
    } catch (err) {
      toast.error('Failed to load bus details')
    }
  }

  const handleUpdateCheckpoint = async (checkpointOrder, action) => {
    if (!selectedBus) return
    
    try {
      setActionLoading(true)
      const response = await updateCheckpoint(selectedBus._id, Number(checkpointOrder), action)
      
      if (!response.data.success) {
        toast.error(response.data.message || 'Update failed')
        return
      }
      
      const updatedBus = response.data.data
      setSelectedBus(updatedBus)
      setAssignedBuses(prev => 
        prev.map(bus => bus._id === updatedBus._id ? updatedBus : bus)
      )
      toast.success(`${action === 'arrived' ? 'Arrived at' : 'Departed from'} checkpoint`)
    } catch (err) {
      console.error('Update checkpoint error:', err)
      toast.error(err.response?.data?.message || 'Failed to update')
    } finally {
      setActionLoading(false)
    }
  }

  const handleBoardingScan = async (pnr) => {
    if (!selectedBus) return
    if (!pnr) return toast.error('Enter PNR')
    
    try {
      setActionLoading(true)
      const res = await verifyBoarding(pnr, selectedBus.currentCheckpointOrder)
      
      if (!res.data.success) {
        toast.error(res.data.message || 'Boarding failed')
        return
      }
      
      const data = res.data.data
      setLastScanResult(data)
      
      if (data.fineAmount > 0) {
        toast.error(`Early Boarding! Fine: ₹${data.fineAmount}`)
      } else {
        toast.success('Boarding successful')
        setScannedPNR('')
        setShowScanner(false)
        setLastScanResult(null)
      }
    } catch (err) {
      console.error('Boarding error:', err)
      toast.error(err.response?.data?.message || 'Boarding scan failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleExitScan = async (pnr) => {
    if (!selectedBus) return
    if (!pnr) return toast.error('Enter PNR')
    
    try {
      setActionLoading(true)
      const res = await verifyExit(pnr, selectedBus.currentCheckpointOrder)
      
      if (!res.data.success) {
        toast.error(res.data.message || 'Exit failed')
        return
      }
      
      const data = res.data.data
      setLastScanResult(data)
      
      if (data.fineAmount > 0) {
        toast.error(`Over-Travel! Fine: ₹${data.fineAmount}`)
      } else {
        toast.success('Journey completed successfully')
        setScannedPNR('')
        setShowScanner(false)
        setLastScanResult(null)
      }
    } catch (err) {
      console.error('Exit error:', err)
      toast.error(err.response?.data?.message || 'Exit scan failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handlePayFine = async () => {
    if (!lastScanResult || paying) return
    setPaying(true)
    
    try {
      const paymentIntentId = paymentMode === 'cash'
       ? `cash_${Date.now()}`
        : `upi_${Date.now()}`

      await payFine(lastScanResult.booking._id, paymentIntentId, paymentMode)
      toast.success(`Fine collected via ${paymentMode.toUpperCase()}`)
      
      setLastScanResult(null)
      setScannedPNR('')
      setShowScanner(false)
      setPaymentMode('cash')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed')
    } finally {
      setPaying(false)
    }
  }

  const resetScan = () => {
    setLastScanResult(null)
    setScannedPNR('')
    setShowScanner(false)
    setPaymentMode('cash')
  }

  const isDriver = user?.role === 'driver'
  const isConductor = user?.role === 'conductor'

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin" style={{ color: PRIMARY_COLOR }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/conductor')}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-900"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Today's Trips</h1>
            <p className="text-gray-600 capitalize">
              {user?.role}: {user?.name}
            </p>
          </div>
        </div>

        {!selectedBus ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedBuses.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-white border border-gray-200 rounded-lg">
                <Bus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-900 text-lg">No buses assigned yet</p>
                <p className="text-gray-600 text-sm mt-2">Contact admin to get assigned</p>
              </div>
            ) : (
              assignedBuses.map(bus => (
                <div
                  key={bus._id}
                  onClick={() => fetchBusDetails(bus._id)}
                  className={`bg-white border rounded-lg p-5 cursor-pointer transition-all ${
                    bus.tripStatus === 'completed'
                     ? 'border-green-200 opacity-75'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Bus className={`w-6 h-6 ${bus.tripStatus === 'completed'? 'text-green-600' : 'text-blue-600'}`} />
                    <div className="flex-1">
                      <h3 className="text-gray-900 font-semibold">{bus.busName}</h3>
                      <p className="text-gray-600 text-sm">{bus.busNumber}</p>
                    </div>
                    {bus.tripStatus === 'completed' && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span>{bus.from} → {bus.to}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span>{new Date(bus.journeyDate).toLocaleDateString('en-GB')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span>{bus.departureTime}</span>
                    </div>

                    {bus.checkpoints?.length > 0 && (
                      <div className="flex items-center gap-2 text-gray-600 text-xs">
                        <Navigation className="w-3 h-3" />
                        <span>{bus.checkpoints.length} stops</span>
                      </div>
                    )}

                    {isDriver && bus.conductor && (
                      <div className="flex items-center gap-2 text-gray-600 text-xs mt-2 pt-2 border-t border-gray-200">
                        <User className="w-3 h-3" />
                        <span>Conductor: {bus.conductor.name}</span>
                      </div>
                    )}
                    {isConductor && bus.driver && (
                      <div className="flex items-center gap-2 text-gray-600 text-xs mt-2 pt-2 border-t border-gray-200">
                        <User className="w-3 h-3" />
                        <span>Driver: {bus.driver.name}</span>
                      </div>
                    )}

                    <div className="mt-3">
                      <span className={`px-3 py-1 rounded-md text-xs font-semibold ${
                        bus.tripStatus === 'started' ? 'bg-green-100 text-green-700' :
                        bus.tripStatus === 'completed' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {bus.tripStatus === 'started' ? 'On Trip' :
                         bus.tripStatus === 'completed' ? 'Completed' :
                         'Not Started'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <button
              onClick={() => setSelectedBus(null)}
              className="text-blue-600 hover:text-blue-700 mb-4 text-sm flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back to list
            </button>

            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              {selectedBus.busName} - {selectedBus.busNumber}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-500 text-sm mb-1">Route</p>
                <p className="text-gray-900 font-semibold text-lg">{selectedBus.from} → {selectedBus.to}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-500 text-sm mb-1">Date & Time</p>
                <p className="text-gray-900 font-semibold">
                  {new Date(selectedBus.journeyDate).toLocaleDateString('en-GB')}
                </p>
                <p className="text-gray-700 text-sm">{selectedBus.departureTime}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-500 text-sm mb-1">Trip Status</p>
                <p className={`font-semibold capitalize ${
                  selectedBus.tripStatus === 'started' ? 'text-green-600' :
                  selectedBus.tripStatus === 'completed' ? 'text-blue-600' :
                  'text-gray-600'
                }`}>
                  {selectedBus.tripStatus === 'not_started' ? 'Not Started' : selectedBus.tripStatus}
                </p>
                {selectedBus.currentLocation && (
                  <p className="text-gray-700 text-sm mt-1">At: {selectedBus.currentLocation}</p>
                )}
                <p className="text-gray-500 text-xs mt-1">Checkpoint: {selectedBus.currentCheckpointOrder || 0}</p>
              </div>
            </div>

            {/* Fine Payment UI */}
            {isConductor && lastScanResult && lastScanResult.fineAmount > 0 && !lastScanResult.booking?.finePaid && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-red-700 font-bold text-lg">
                      Fine Due: ₹{lastScanResult.fineAmount}
                    </p>
                    <p className="text-gray-700 text-sm mt-1">
                      {lastScanResult.overTravel 
                        ? 'Passenger travelled beyond destination' 
                        : 'Passenger boarded from earlier stop'}
                    </p>
                    <p className="text-gray-600 text-xs mt-2">
                      PNR: {lastScanResult.booking.pnr} | {lastScanResult.booking.user?.name} | {lastScanResult.booking.user?.phone}
                    </p>

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => setPaymentMode('cash')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                          paymentMode === 'cash'
                           ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        Cash
                      </button>
                      <button
                        onClick={() => setPaymentMode('upi')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                          paymentMode === 'upi'
                           ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        UPI
                      </button>
                    </div>

                    {paymentMode === 'upi' && (
                      <div className="mt-3 bg-white p-4 rounded-lg text-center border border-gray-200">
                        <p className="text-gray-900 text-sm mb-2">Scan to Pay ₹{lastScanResult.fineAmount}</p>
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${upiId}&pn=BusApp&am=${lastScanResult.fineAmount}&tn=Fine-${lastScanResult.booking.pnr}`}
                          alt="UPI QR"
                          className="mx-auto w-48 h-48"
                        />
                        <p className="text-gray-900 text-xs mt-2">UPI ID: {upiId}</p>
                      </div>
                    )}
                    
                    <button
                      onClick={handlePayFine}
                      disabled={paying}
                      className="w-full mt-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2"
                    >
                      {paying ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4" />
                          Confirm {paymentMode === 'cash'? 'Cash' : 'UPI'} Collected ₹{lastScanResult.fineAmount}
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={resetScan}
                      className="w-full mt-2 bg-gray-200 hover:bg-gray-300 text-gray-900 py-2 rounded-lg text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isConductor && selectedBus.tripStatus === 'started' && !lastScanResult?.fineAmount && (
              <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
                <h3 className="text-gray-900 font-semibold mb-3 flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-blue-600" /> Passenger Scan
                </h3>
                
                {!showScanner ? (
                  <button
                    onClick={() => setShowScanner(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2"
                  >
                    <ScanLine className="w-5 h-5" />
                    Scan Passenger Ticket
                  </button>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Enter PNR or scan QR"
                      value={scannedPNR}
                      onChange={(e) => setScannedPNR(e.target.value.toUpperCase())}
                      className="w-full bg-white border border-gray-300 text-gray-900 px-4 py-2 rounded-lg focus:border-blue-500 outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleBoardingScan(scannedPNR)}
                        disabled={!scannedPNR || actionLoading}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-2 rounded-lg font-medium text-sm"
                      >
                        {actionLoading ? 'Processing...' : 'Boarding Scan'}
                      </button>
                      <button
                        onClick={() => handleExitScan(scannedPNR)}
                        disabled={!scannedPNR || actionLoading}
                        className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white py-2 rounded-lg font-medium text-sm"
                      >
                        {actionLoading ? 'Processing...' : 'Exit Scan'}
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        setShowScanner(false)
                        setScannedPNR('')
                      }}
                      className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 py-2 rounded-lg text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}

            {!selectedBus.driver && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-red-700 font-semibold">Driver Not Assigned</p>
                  <p className="text-gray-600 text-sm">Trip cannot be started without a driver. Contact admin.</p>
                </div>
              </div>
            )}

            {isConductor && selectedBus.tripStatus === 'not_started' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-blue-700 font-semibold">Waiting for Driver</p>
                  <p className="text-gray-600 text-sm">Trip must be started by driver first. You can scan tickets once trip starts.</p>
                </div>
              </div>
            )}

            {selectedBus.checkpoints?.length > 0 && (
              <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                <h3 className="text-gray-900 font-semibold mb-3 flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-blue-600" /> Route Stops
                </h3>
                <div className="space-y-3">
                  {selectedBus.checkpoints
                    .sort((a, b) => a.order - b.order)
                    .map((cp, idx) => {
                      const isArrived = !!cp.actualArrivalTime
                      const isDeparted = !!cp.actualDepartedTime

                      return (
                        <div key={idx} className={`flex items-center justify-between p-4 rounded-lg ${
                          isDeparted ? 'bg-green-50 border border-green-200' :
                          isArrived ? 'bg-yellow-50 border border-yellow-200' :
                          'bg-white border border-gray-200'
                        }`}>
                          <div className="flex items-center gap-3 flex-1">
                            <span className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                              isDeparted ? 'bg-green-100 text-green-600' :
                              isArrived ? 'bg-yellow-100 text-yellow-600' :
                              'bg-blue-100 text-blue-600'
                            }`}>
                              {cp.order}
                            </span>
                            <div className="flex-1">
                              <p className="text-gray-900 font-semibold">{cp.name}</p>
                              <div className="flex gap-4 text-xs mt-1">
                                <span className="text-gray-600">
                                  Scheduled: {cp.estimatedTime || 'N/A'}
                                </span>
                                {isArrived && (
                                  <span className="text-green-600">
                                    Arrived: {cp.actualArrivalTime}
                                  </span>
                                )}
                                {isDeparted && (
                                  <span className="text-blue-600">
                                    Departed: {cp.actualDepartedTime}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {isConductor && selectedBus.tripStatus === 'started' && !isDeparted && (
                            <div className="flex gap-2">
                              {!isArrived && (
                                <button
                                  onClick={() => handleUpdateCheckpoint(cp.order, 'arrived')}
                                  disabled={actionLoading}
                                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Arrived
                                </button>
                              )}

                              {isArrived && !isDeparted && (
                                <button
                                  onClick={() => handleUpdateCheckpoint(cp.order, 'departed')}
                                  disabled={actionLoading}
                                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1"
                                >
                                  <PlayCircle className="w-4 h-4" />
                                  Depart
                                </button>
                              )}
                            </div>
                          )}

                          {isDeparted && (
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          )}
                        </div>
                      )
                    })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Driver</p>
                    <p className="text-gray-900 font-semibold text-lg">
                      {selectedBus.driver?.name || 'Not Assigned'}
                    </p>
                  </div>
                </div>
                {selectedBus.driver?.phone && (
                  <div className="flex items-center gap-2 text-gray-700 text-sm">
                    <Phone className="w-4 h-4 text-blue-600" />
                    <span>{selectedBus.driver.phone}</span>
                  </div>
                )}
                {isDriver && selectedBus.driver?._id === user?._id && (
                  <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">You</span>
                )}
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <User className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Conductor</p>
                    <p className="text-gray-900 font-semibold text-lg">
                      {selectedBus.conductor?.name || 'Not Assigned'}
                    </p>
                  </div>
                </div>
                {selectedBus.conductor?.phone && (
                  <div className="flex items-center gap-2 text-gray-700 text-sm">
                    <Phone className="w-4 h-4 text-yellow-600" />
                    <span>{selectedBus.conductor.phone}</span>
                  </div>
                )}
                {isConductor && selectedBus.conductor?._id === user?._id && (
                  <span className="inline-block mt-2 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">You</span>
                )}
              </div>
            </div>

            {isConductor && selectedBus.tripStatus === 'not_started' && (
              <div className="text-center py-6 text-gray-600">
                <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="font-semibold">Waiting for driver to start trip</p>
                <p className="text-sm mt-1">You can scan passenger tickets once trip starts</p>
              </div>
            )}

            {selectedBus.tripStatus === 'completed' && (
              <div className="text-center py-6 text-green-600">
                <CheckCircle className="w-12 h-12 mx-auto mb-3" />
                <p className="font-semibold">Trip Completed</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
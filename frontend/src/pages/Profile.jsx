import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { User, Calendar, MapPin, Ticket, Clock, Edit2, Save, X, Mail, Phone, Lock, CheckCircle, AlertCircle, Shield, AlertTriangle, TrendingUp, Wallet, Award } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

// 🔥 Theme 1: Corporate Blue | Theme 2: Indigo
const PRIMARY_COLOR = '#0F4C75' // Change to '#3730A3' for Theme 2

const Profile = () => {
  const { user, setUser, updateUser, changePassword, sendVerificationOTP, verifyEmailOTP, bookings, loading } = useAuth()

  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState(() => ({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  }))
  const [updating, setUpdating] = useState(false)

  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [changingPassword, setChangingPassword] = useState(false)

  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [otp, setOtp] = useState('')
  const [sendingOTP, setSendingOTP] = useState(false)
  const [verifying, setVerifying] = useState(false)

  const bookingsList = (() => {
    if (!bookings) return []
    if (Array.isArray(bookings)) return bookings
    if (bookings.bookings) return bookings.bookings
    if (bookings.data) return bookings.data
    return []
  })()

  const handleUpdate = async () => {
    try {
      setUpdating(true)
      await updateUser(formData)
      setEditMode(false)
      toast.success('Profile updated successfully')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    } finally {
      setUpdating(false)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordData.newPassword!== passwordData.confirmPassword) {
      return toast.error('New passwords do not match')
    }
    if (passwordData.newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters')
    }

    try {
      setChangingPassword(true)
      await changePassword(passwordData.oldPassword, passwordData.newPassword)
      toast.success('Password changed successfully')
      setShowPasswordModal(false)
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password')
    } finally {
      setChangingPassword(false)
    }
  }

  const handleSendOTP = async () => {
    try {
      setSendingOTP(true)
      await sendVerificationOTP()
      toast.success('OTP sent to your email')
      setShowVerifyModal(true)
    } catch (err) {
      toast.error('Failed to send OTP')
    } finally {
      setSendingOTP(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (otp.length!== 6) return toast.error('Enter 6 digit OTP')
    try {
      setVerifying(true)
      await verifyEmailOTP(otp)
      toast.success('Email verified successfully')
      setShowVerifyModal(false)
      setOtp('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP')
    } finally {
      setVerifying(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-gray-900 text-xl">Loading...</div>
    </div>
  )

  if (!user) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-gray-900 text-xl">Please login first</div>
    </div>
  )

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const getBookingDate = (booking) => {
    const dateStr = booking.journeyDate || booking.bus?.journeyDate || booking.date
    if (!dateStr) return null

    if (typeof dateStr === 'string' && dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/')
      const date = new Date(year, month - 1, day)
      date.setHours(0, 0, 0, 0)
      return date
    }

    const date = new Date(dateStr)
    date.setHours(0, 0, 0, 0)
    return date
  }

  const upcoming = bookingsList.filter(b => {
    const journeyDate = getBookingDate(b)
    if (!journeyDate) return false
    const status = (b.status || '').toLowerCase()
    return journeyDate >= today &&!status.includes('cancel')
  })

  const history = bookingsList.filter(b => {
    const journeyDate = getBookingDate(b)
    if (!journeyDate) return false
    const status = (b.status || '').toLowerCase()
    return journeyDate < today || status.includes('complete') || status.includes('cancel')
  })

  const getSeatNumbers = (booking) => {
    if (booking.seats?.length > 0) return booking.seats.join(', ')
    if (booking.passengerDetails?.length > 0) {
      return booking.passengerDetails.map(p => p.seat || p.seatNo).join(', ')
    }
    return 'Not assigned'
  }

  // Stats calculation
  const totalSpent = bookingsList
    .filter(b => b.status === 'Completed' || b.status === 'Confirmed')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0)

  const totalTrips = history.filter(b => b.status === 'Completed').length

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Wallet className="w-8 h-8 text-blue-600" />
              <span className="text-green-700 text-xs font-semibold bg-green-100 px-2 py-1 rounded">Total</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">₹{totalSpent.toLocaleString()}</p>
            <p className="text-gray-600 text-sm mt-1">Total Spent</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-8 h-8 text-green-600" />
              <span className="text-green-700 text-xs font-semibold bg-green-100 px-2 py-1 rounded">Done</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalTrips}</p>
            <p className="text-gray-600 text-sm mt-1">Completed Trips</p>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Ticket className="w-8 h-8 text-indigo-600" />
              <span className="text-indigo-700 text-xs font-semibold bg-indigo-100 px-2 py-1 rounded">Active</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{upcoming.length}</p>
            <p className="text-gray-600 text-sm mt-1">Upcoming Journeys</p>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-8">
          <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-lg flex items-center justify-center" style={{ backgroundColor: PRIMARY_COLOR }}>
                <User className="w-10 h-10 text-white" />
              </div>
              {!editMode? (
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                    {user.name}
                    {user.isVerified? (
                      <div className="bg-green-100 px-3 py-1 rounded-md flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-green-700 text-xs font-semibold">Verified</span>
                      </div>
                    ) : (
                      <div className="bg-yellow-100 px-3 py-1 rounded-md flex items-center gap-1">
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                        <span className="text-yellow-700 text-xs font-semibold">Unverified</span>
                      </div>
                    )}
                  </h2>

                  <div className="space-y-2">
                    <p className="text-gray-700 flex items-center gap-2">
                      <Mail className="w-4 h-4" style={{ color: PRIMARY_COLOR }} /> {user.email}
                      {!user.isVerified && (
                        <button
                          onClick={handleSendOTP}
                          disabled={sendingOTP}
                          className="text-xs underline disabled:opacity-50"
                          style={{ color: PRIMARY_COLOR }}
                        >
                          {sendingOTP? 'Sending...' : 'Verify Now'}
                        </button>
                      )}
                    </p>
                    <p className="text-gray-700 flex items-center gap-2">
                      <Phone className="w-4 h-4" style={{ color: PRIMARY_COLOR }} /> {user.phone}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 flex-1">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Name"
                  />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Email"
                  />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Phone"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {!editMode? (
                <>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-lg text-gray-700 transition flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    Password
                  </button>
                  <button
                    onClick={() => {
                      setFormData({ name: user.name, email: user.email, phone: user.phone })
                      setEditMode(true)
                    }}
                    className="px-4 py-2 text-white rounded-lg transition flex items-center gap-2"
                    style={{ backgroundColor: PRIMARY_COLOR }}
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleUpdate}
                    disabled={updating}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50 flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {updating? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => setEditMode(false)}
                    className="px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-red-600 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Help & Support Section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-gray-700 font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Help & Support
            </h3>
            <Link
              to="/report-issue"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm"
            >
              <AlertTriangle className="w-4 h-4" />
              Report an Issue / Complaint
            </Link>
          </div>
        </div>

        {/* Upcoming Journeys */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Ticket className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Upcoming Journeys</h2>
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md text-sm font-semibold">
              {upcoming.length}
            </span>
          </div>

          {upcoming.length === 0? (
            <div className="text-center text-gray-500 py-12">
              <Ticket className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No upcoming journeys</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcoming.map(booking => (
                <div key={booking._id} className="bg-gray-50 border border-gray-200 rounded-lg p-5 hover:border-blue-300 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {booking.bus?.busName || 'Bus Name N/A'}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {booking.bus?.busNumber || 'Bus No. N/A'}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-md text-xs font-semibold uppercase border
                      ${booking.status === 'Confirmed'? 'bg-green-100 text-green-700 border-green-200' :
                        booking.status === 'Pending'? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                        'bg-red-100 text-red-700 border-red-200'}`}>
                      {booking.status || 'Confirmed'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span className="truncate">
                        {booking.bus?.from || booking.from || 'N/A'} → {booking.bus?.to || booking.to || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span>
                        {getBookingDate(booking)
                       ? getBookingDate(booking).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span>{booking.bus?.departureTime || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Ticket className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span>Seats: {getSeatNumbers(booking)}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-gray-500 text-xs">PNR: {booking.pnr || 'N/A'}</span>
                    <span className="text-gray-900 font-bold text-lg">
                      ₹{booking.totalAmount || 0}
                      {booking.discount > 0 && (
                        <span className="text-green-600 text-sm ml-2">(-₹{booking.discount})</span>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Travel History */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-gray-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Travel History</h2>
            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-md text-sm font-semibold">
              {history.length}
            </span>
          </div>

          {history.length === 0? (
            <div className="text-center text-gray-500 py-12">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No travel history</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map(booking => (
                <div key={booking._id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 opacity-75 hover:opacity-100 transition-opacity">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-gray-900 font-semibold">
                        {booking.bus?.busName || 'N/A'} - {booking.bus?.busNumber || 'N/A'}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {booking.bus?.from || booking.from || 'N/A'} → {booking.bus?.to || booking.to || 'N/A'}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        Seats: {getSeatNumbers(booking)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-700 text-sm mb-1">
                        {getBookingDate(booking)
                       ? getBookingDate(booking).toLocaleDateString('en-GB')
                          : 'N/A'}
                      </p>
                      <span className={`px-3 py-1 rounded-md text-xs font-semibold border ${
                        booking.status === 'Completed'? 'bg-gray-100 text-gray-700 border-gray-200' :
                        booking.status === 'Cancelled'? 'bg-red-100 text-red-700 border-red-200' :
                        'bg-yellow-100 text-yellow-700 border-yellow-200'
                      }`}>
                        {booking.status?.toUpperCase() || 'COMPLETED'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modals - Password Change */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-gray-200 rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Lock className="w-5 h-5" /> Change Password
                </h3>
                <button onClick={() => setShowPasswordModal(false)}>
                  <X className="w-5 h-5 text-gray-500 hover:text-gray-900" />
                </button>
              </div>

              <div className="space-y-4">
                <input
                  type="password"
                  placeholder="Current Password"
                  value={passwordData.oldPassword}
                  onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <input
                  type="password"
                  placeholder="New Password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />

                <button
                  onClick={handlePasswordChange}
                  disabled={changingPassword}
                  className="w-full text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50"
                  style={{ backgroundColor: PRIMARY_COLOR }}
                >
                  {changingPassword? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Email Verify Modal */}
        {showVerifyModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-gray-200 rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Shield className="w-5 h-5" /> Verify Email
                </h3>
                <button onClick={() => setShowVerifyModal(false)}>
                  <X className="w-5 h-5 text-gray-500 hover:text-gray-900" />
                </button>
              </div>

              <p className="text-gray-600 text-sm mb-6">
                Enter the 6-digit OTP sent to <span className="text-gray-900 font-semibold">{user.email}</span>
              </p>

              <div className="space-y-4">
                <input
                  type="text"
                  maxLength="6"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-4 text-gray-900 text-center text-3xl tracking-widest focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />

                <button
                  onClick={handleVerifyOTP}
                  disabled={verifying}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
                >
                  {verifying? 'Verifying...' : 'Verify Email'}
                </button>

                <button
                  onClick={handleSendOTP}
                  disabled={sendingOTP}
                  className="w-full text-sm hover:underline"
                  style={{ color: PRIMARY_COLOR }}
                >
                  {sendingOTP? 'Resending...' : 'Resend OTP'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default Profile
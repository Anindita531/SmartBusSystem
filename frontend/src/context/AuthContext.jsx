import { createContext, useState, useEffect, useContext } from 'react'
import { login as loginApi, register as registerApi, getMe } from '../api/auth.api'
import { getMyBookings, cancelBooking as cancelBookingApi } from '../api/booking.api'
import api from '../api/axios'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async () => {
    try {
      const res = await getMe()
      const userData = res.data.data
      setUser(userData)
      if (userData.role === 'user') {
        await fetchBookings()
      }
    } catch (err) {
      localStorage.removeItem('token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchBookings = async () => {
    try {
      const res = await getMyBookings()
      setBookings(res.data.data)
    } catch (err) {
      console.error('Fetch bookings error:', err)
      setBookings([])
    }
  }

  const updateUser = async (updatedData) => {
    try {
      const res = await api.put('/auth/profile', updatedData)
      setUser(res.data.data)
      return res.data
    } catch (err) {
      throw err
    }
  }

  const changePassword = async (oldPassword, newPassword) => {
    try {
      const res = await api.put('/auth/change-password', { oldPassword, newPassword })
      return res.data
    } catch (err) {
      throw err
    }
  }

  const cancelBooking = async (bookingId) => {
    try {
      const res = await cancelBookingApi(bookingId)
      await fetchBookings()
      return res.data
    } catch (err) {
      throw err
    }
  }

  const login = async (email, password) => {
    const res = await loginApi({ email, password })
    console.log('Login response:', res.data)
    const { token, user } = res.data.data || res.data
    if (!token) throw new Error('Token not received')
    localStorage.setItem('token', token)
    setUser(user)
    if (user.role === 'user') await fetchBookings()
    return res.data
  }

  const register = async (formData) => {
    const res = await registerApi(formData)
    const { token, user } = res.data.data || res.data
    localStorage.setItem('token', token)
    setUser(user)
    if (user.role === 'user') await fetchBookings()
    return res.data
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setBookings([])
  }

  const sendVerificationOTP = async () => {
    try {
      const res = await api.post('/auth/send-otp')
      return res.data
    } catch (err) {
      throw err
    }
  }

  const verifyEmailOTP = async (otp) => {
    try {
      const res = await api.post('/auth/verify-otp', { otp })
      setUser(res.data.data)
      return res.data
    } catch (err) {
      throw err
    }
  }

  return (
    <AuthContext.Provider value={{
      user, setUser, updateUser, changePassword, sendVerificationOTP,
      verifyEmailOTP, bookings, loading, login, register, logout,
      cancelBooking, fetchBookings
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
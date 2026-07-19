import api from './axios'

export const lockSeats = (busId, data) => api.post(`/bookings/${busId}/lock`, data)
export const releaseSeats = (busId) => api.post(`/bookings/${busId}/release`)
export const createBooking = (data) => api.post('/bookings/create', data)
export const getMyBookings = (params) => api.get('/bookings/my-bookings', { params })
export const getBooking = (id) => api.get(`/bookings/${id}`)
export const cancelBooking = (id) => api.patch(`/bookings/${id}/cancel`)
export const verifyBooking = (pnr) => api.get(`/bookings/verify/${pnr}`)
export const markTicketUsed = (pnr) => api.patch(`/bookings/verify/${pnr}/use`)
export const getRecentBookings = () => api.get('/bookings/recent')
export const getLockedSeats = () => api.get('/bookings/locked-seats')
export const markBoarded = (id) => api.patch(`/bookings/${id}/board`)
export const markRideComplete = (id) => api.patch(`/bookings/${id}/complete`)
export const addReview = (data) => api.post('/reviews', data)
export const getBusReviews = (busId, params) => api.get(`/reviews/bus/${busId}`, { params })
export const getMyReviews = () => api.get('/reviews/my')
export const deleteReview = (id) => api.delete(`/reviews/${id}`)
export const verifyBoarding = (pnr, currentCheckpointOrder) =>
  api.post(`/bookings/${pnr}/verify-boarding`, { currentCheckpointOrder })
export const verifyExit = (pnr, currentCheckpointOrder) =>
  api.post(`/bookings/${pnr}/verify-exit`, { currentCheckpointOrder })
export const payFine = (bookingId, paymentIntentId, paymentMode = 'cash') =>
  api.post(`/bookings/${bookingId}/pay-fine`, { paymentIntentId, paymentMode })
export const getBookingById = (bookingId) => api.get(`/bookings/${bookingId}`)
// ✅ এইটা fix কর - /bookings না /booking
// PayU er jonno - user app
export const createExitPaymentSession = (bookingId) =>
  api.post('/payments/create-exit-session', { bookingId })

// Driver er jonno - driver app  
export const payOnExit = (bookingId) => 
  api.post(`/bookings/${bookingId}/pay-exit`)
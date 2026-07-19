import api from './axios'

export const createPaymentIntent = (data) => api.post('/bookings/create', data) // ✅ /payments na
export const confirmPayment = (bookingId, data) => api.post(`/bookings/${bookingId}/confirm`, data) // ✅
export const createPaymentIntentForExit = (data) => api.post('/payments/create-exit-session', data)
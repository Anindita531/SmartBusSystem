import api from './axios'

// Dashboard
export const getDashboardStats = () => api.get('/admin/stats')
export const getSalesData = () => api.get('/admin/sales-data')

// Bookings
export const getAllBookings = (params) => api.get('/admin/bookings', { params })
export const getDisputedBookings = () => api.get('/admin/bookings/disputes')
export const getDisputeInvestigation = (bookingId) => api.get(`/admin/bookings/${bookingId}/investigation`)
export const resolveFineDispute = (bookingId, data) => api.patch(`/admin/bookings/${bookingId}/resolve-dispute`, data)

// Users
export const getAllUsers = () => api.get('/admin/users')
export const updateUserRole = (userId, role) => api.patch(`/admin/users/${userId}/role`, { role })
export const deleteUser = (userId) => api.delete(`/admin/users/${userId}`)
export const createStaff = (data) => api.post('/admin/create-staff', data)

// FAQs <-- UPDATED PATH
export const getFAQs = () => api.get('/faqs')
export const createFAQ = (data) => api.post('/faqs', data)
export const updateFAQ = (id, data) => api.put(`/faqs/${id}`, data)
export const deleteFAQ = (id) => api.delete(`/faqs/${id}`)
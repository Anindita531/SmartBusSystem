import api from './axios'

export const getConductors = () => api.get('/users/conductors')
export const getDrivers = () => api.get('/users/drivers') // ✅ Fix: direct route use করো
export const getAllUsers = () => api.get('/users')
export const updateUserRole = (userId, role) => api.put(`/users/${userId}/role`, { role })
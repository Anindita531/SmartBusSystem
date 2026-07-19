import api from './axios'

export const searchBuses = (params) => {
  console.log('Search params:', params)
  return api.get('/buses/search', { params })
}

export const getBuses = (params) => api.get('/buses', { params })
export const getBusDetails = (id) => api.get(`/buses/${id}`)
export const getBus = (id) => api.get(`/buses/${id}`)
export const getSeats = (busId) => api.get(`/buses/${busId}/seats`)

export const createBus = (data) => api.post('/buses', data)
export const updateBus = (id, data) => api.put(`/buses/${id}`, data)
export const deleteBus = (id) => api.delete(`/buses/${id}`)

export const getConductors = () => api.get('/buses/conductors')
export const assignConductor = (busId, conductorId) => api.put(`/buses/${busId}/assign-conductor`, { conductorId })
export const removeConductor = (busId) => api.delete(`/buses/${busId}/remove-conductor`)
export const getConductorBuses = () => api.get('/buses/conductor-buses')
export const updateBusStatus = (busId, status) => api.put(`/buses/${busId}/status`, { status })

export const getAllRoutes = (from = '') => {
  const url = from
    ? `/buses/routes?from=${encodeURIComponent(from)}`
    : '/buses/routes'
  console.log('API Call:', url)
  return api.get(url)
}

export const assignDriver = async (busId, driverId) => {
  return api.put(`/buses/${busId}/assign-driver`, { driverId })
}

export const removeDriver = async (busId) => {
  return api.delete(`/buses/${busId}/remove-driver`)
}

export const quickBook = (data) => api.post('/buses/quick-book', data)

// ✅ Fix: URL /buses/routes hobe, /bookings na
export const quickBookOptions = (data) => api.post('/buses/routes', data)

export const updateCheckpoint = (busId, checkpointOrder, action) =>
  api.put(`/buses/${busId}/checkpoint`, { checkpointOrder, action })

export const updateBusLocation = (busId, checkpointIndex, status) =>
  api.put(`/buses/${busId}/update-location`, { checkpointIndex, status })

export const trackBus = (busId) => api.get(`/buses/${busId}/track`)
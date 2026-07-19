import api from './axios'

export const rateConductor = (data) => api.post('/ratings/conductor', data)
export const getConductorRatings = (conductorId) => api.get(`/ratings/conductor/${conductorId}`)
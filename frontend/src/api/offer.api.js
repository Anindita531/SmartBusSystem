import api from './axios'
export const getActiveOffers = () => api.get('/offers')
export const createOffer = (data) => api.post('/offers', data)
export const updateOffer = (id, data) => api.put(`/offers/${id}`, data)
export const deleteOffer = (id) => api.delete(`/offers/${id}`)
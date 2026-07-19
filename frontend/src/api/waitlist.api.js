import api from './axios'

export const joinWaitlist = (data) => api.post('/waitlist/join', data)
export const getMyWaitlist = () => api.get('/waitlist/my-waitlist')
export const removeFromWaitlist = (id) => api.delete(`/waitlist/${id}`)
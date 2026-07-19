import api from './axios';
export const verifyTicket = (data) => api.post('/api/conductor/verify-ticket', data);
export const getAssignedBus = () => api.get('/api/conductor/bus');
export const getTodayTrip = () => api.get('/api/conductor/today-trip');
export const markBoarded = (bookingId) => api.patch(`/api/conductor/booking/${bookingId}/board`)
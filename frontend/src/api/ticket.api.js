import api from './axios';

export const getMyTickets = () => api.get('/tickets/my-tickets'); // ✅ /api কেটে দাও
export const getTicket = (id) => api.get(`/tickets/${id}`); // ✅ /api কেটে দাও
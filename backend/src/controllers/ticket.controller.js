import Booking from '../models/Booking.js'
import { successResponse, errorResponse } from '../utils/response.utils.js'

export const getTicket = async (req, res) => {
  try {
    const { bookingId } = req.params // ✅ pnr না, bookingId
    const ticket = await Booking.findById(bookingId).populate('bus')
    
    if (!ticket) return errorResponse(res, 404, 'Ticket not found')
    
    successResponse(res, ticket, 'Ticket fetched')
  } catch (err) {
    console.log('Get ticket error:', err)
    errorResponse(res, 500, err.message)
  }
}

// ✅ এই ফাংশনও মিসিং ছিল
export const getMyTickets = async (req, res) => {
  try {
    const userId = req.user.id
    const tickets = await Booking.find({ user: userId })
      .populate('bus', 'busName busNumber from to journeyDate departureTime')
      .sort({ createdAt: -1 })
    
    successResponse(res, tickets, 'Tickets fetched successfully')
  } catch (err) {
    console.log('Get my tickets error:', err)
    errorResponse(res, 500, err.message)
  }
}
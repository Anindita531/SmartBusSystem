import Rating from '../models/Rating.js'
import Booking from '../models/Booking.js'
import { sendEmail } from '../utils/mailer.js'
import { successResponse, errorResponse } from '../utils/response.utils.js'

export const rateConductor = async (req, res) => {
  try {
    const { bookingId, rating, complaint } = req.body
    
    const booking = await Booking.findById(bookingId).populate('bus conductor user')
    if (!booking) return errorResponse(res, 404, 'Booking not found')
    
    if (booking.user._id.toString() !== req.user._id.toString()) {
      return errorResponse(res, 403, 'Not your booking')
    }

    const existingRating = await Rating.findOne({ booking: bookingId })
    if (existingRating) {
      return errorResponse(res, 400, 'Already rated this trip')
    }
    
    const newRating = await Rating.create({
      booking: bookingId,
      passenger: req.user._id,
      conductor: booking.conductor._id,
      bus: booking.bus._id,
      rating,
      complaint
    })

    if (rating <= 2 && process.env.ADMIN_EMAIL) {
      const emailHtml = `
        <h2>⚠️ Low Rating Alert</h2>
        <p><strong>Conductor:</strong> ${booking.conductor.name}</p>
        <p><strong>Rating:</strong> ${rating}/5 stars</p>
        <p><strong>Passenger:</strong> ${req.user.name}</p>
        <p><strong>Bus:</strong> ${booking.bus.busName}</p>
        <p><strong>Complaint:</strong> ${complaint || 'No complaint provided'}</p>
      `
      await sendEmail(process.env.ADMIN_EMAIL, 'Low Rating Alert - Conductor', emailHtml)
    }

    successResponse(res, newRating, 'Rating submitted successfully')
  } catch (err) {
    errorResponse(res, 500, err.message)
  }
}
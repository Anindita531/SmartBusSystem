import Booking from '../models/Booking.js'
import User from "../models/User.js";
import Bus from '../models/Bus.js'
import Review from '../models/Review.js'

export const getPublicStats = async (req, res) => {
  try {
    const [totalUsers, totalBuses, completedBookings, avgRating] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Bus.countDocuments({ isActive: true }),
      Booking.countDocuments({ status: 'Completed' }),
      Review.aggregate([
        { $group: { _id: null, avg: { $avg: '$rating' } } }
      ])
    ])

    const rating = avgRating[0]?.avg || 4.8

    res.json({
      success: true,
      data: {
        users: totalUsers,
        buses: totalBuses,
        bookings: completedBookings,
        rating: parseFloat(rating.toFixed(1))
      }
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

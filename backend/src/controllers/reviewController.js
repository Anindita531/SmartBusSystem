import Review from '../models/Review.js'
import Booking from '../models/Booking.js'
import Bus from '../models/Bus.js'

// POST /api/reviews
export const createReview = async (req, res) => {
  try {
    const { bookingId } = req.body
    const { overallRating, amenities, review } = req.body
    const userId = req.user.id

    // 1. Booking check
    const booking = await Booking.findById(bookingId)
    if (!booking) return res.status(404).json({ message: 'Booking not found' })
    if (booking.user.toString()!== userId) return res.status(403).json({ message: 'Not your booking' })
    if (booking.status!== 'Completed') return res.status(400).json({ message: 'Complete journey first' })

    // 2. Already reviewed check
    const existing = await Review.findOne({ booking: bookingId })
    if (existing) return res.status(400).json({ message: 'Already reviewed' })

    // 3. Create review
    const newReview = await Review.create({
      booking: bookingId,
      user: userId,
      bus: booking.bus,
      overallRating,
      amenities,
      review
    })

    // 4. Update Bus average rating
    const allReviews = await Review.find({ bus: booking.bus, isApproved: true })
    const totalReviews = allReviews.length
    const avgRating = allReviews.reduce((sum, r) => sum + r.overallRating, 0) / totalReviews

    // Amenities average
    const amenitiesAvg = {}
    const amenityKeys = ['ac', 'cleanliness', 'seat', 'staff', 'wifi', 'charging', 'punctuality']
    amenityKeys.forEach(key => {
      const validRatings = allReviews.filter(r => r.amenities?.[key]).map(r => r.amenities[key])
      amenitiesAvg[key] = validRatings.length > 0
       ? validRatings.reduce((a, b) => a + b, 0) / validRatings.length
        : 0
    })

    await Bus.findByIdAndUpdate(booking.bus, {
      averageRating: avgRating,
      totalReviews,
      amenitiesRating: amenitiesAvg
    })

    res.status(201).json({ message: 'Review submitted', data: newReview })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/reviews/bus/:busId
export const getBusReviews = async (req, res) => {
  try {
    const { busId } = req.params
    const { rating, page = 1, limit = 10 } = req.query

    const query = { bus: busId, isApproved: true }
    if (rating && rating!== 'all') query.overallRating = Number(rating)

    const reviews = await Review.find(query)
     .populate('user', 'name')
     .sort({ createdAt: -1 })
     .limit(limit * 1)
     .skip((page - 1) * limit)

    const bus = await Bus.findById(busId).select('averageRating totalReviews amenitiesRating')

    res.json({
      data: reviews,
      stats: {
        averageRating: bus?.averageRating || 0,
        totalReviews: bus?.totalReviews || 0,
        amenitiesRating: bus?.amenitiesRating || {}
      }
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/reviews/my
export const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user.id })
     .populate('bus', 'busName from to')
     .sort({ createdAt: -1 })
    res.json({ data: reviews })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// DELETE /api/reviews/:id - Admin only
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id)
    if (!review) return res.status(404).json({ message: 'Review not found' })

    // Recalculate bus rating after delete
    const allReviews = await Review.find({ bus: review.bus, isApproved: true })
    const totalReviews = allReviews.length
    const avgRating = totalReviews > 0
     ? allReviews.reduce((sum, r) => sum + r.overallRating, 0) / totalReviews
      : 0

    await Bus.findByIdAndUpdate(review.bus, {
      averageRating: avgRating,
      totalReviews
    })

    res.json({ message: 'Review deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
// GET /api/reviews - Admin এর জন্য সব review list
export const getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20, rating, busId } = req.query
    
    const query = {}
    if (rating && rating !== 'all') query.overallRating = Number(rating)
    if (busId) query.bus = busId

    const reviews = await Review.find(query)
      .populate('user', 'name email')
      .populate('bus', 'busName busNumber from to')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const count = await Review.countDocuments(query)

    res.json({
      data: reviews,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      total: count
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
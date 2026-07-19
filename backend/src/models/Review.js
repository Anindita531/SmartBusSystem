import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    required: true
  },

  // Amenities Rating - সবার উপরে
  amenities: {
    ac: { type: Number, min: 1, max: 5 },
    cleanliness: { type: Number, min: 1, max: 5 },
    seat: { type: Number, min: 1, max: 5 },
    staff: { type: Number, min: 1, max: 5 },
    wifi: { type: Number, min: 1, max: 5 },
    charging: { type: Number, min: 1, max: 5 },
    punctuality: { type: Number, min: 1, max: 5 }
  },

  overallRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    maxlength: 500,
    trim: true
  },
  images: [{ type: String }],

  // Admin moderation
  isApproved: { type: Boolean, default: true },
  isReported: { type: Boolean, default: false }
}, { timestamps: true })

reviewSchema.index({ bus: 1, createdAt: -1 })
reviewSchema.index({ user: 1 })

export default mongoose.models.Review || mongoose.model('Review', reviewSchema)
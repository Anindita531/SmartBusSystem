import mongoose from 'mongoose'

const waitlistSchema = new mongoose.Schema({
  busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  seatsNeeded: { type: Number, required: true },
  journeyDate: Date,
  notified: { type: Boolean, default: false }, // ✅ এটা এড করো
  expiresAt: Date, // ✅ এটা এড করো
  createdAt: { type: Date, default: Date.now }
})

waitlistSchema.index({ busId: 1, userId: 1, journeyDate: 1 }, { unique: true })
waitlistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }) // ✅ Auto delete

export default mongoose.model('Waitlist', waitlistSchema)
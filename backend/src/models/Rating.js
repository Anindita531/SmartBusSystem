import mongoose from 'mongoose'

const ratingSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  passenger: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  conductor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus' },
  rating: { type: Number, min: 1, max: 5, required: true },
  complaint: { type: String, trim: true }
}, { timestamps: true })

export default mongoose.model('Rating', ratingSchema)
import mongoose from 'mongoose'

const seatLockSchema = new mongoose.Schema({
  busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  seatNumber: { type: String, required: true },
  price: { type: Number, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }
}, { timestamps: true })

seatLockSchema.index({ busId: 1, userId: 1 })
seatLockSchema.index({ busId: 1, seatNumber: 1 })

export default mongoose.model('SeatLock', seatLockSchema)
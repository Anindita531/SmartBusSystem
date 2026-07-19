import mongoose from 'mongoose'

const ticketSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  pnr: { type: String, required: true, unique: true },
  qrCode: { type: String, required: true },
  status: { type: String, enum: ['active', 'used', 'cancelled'], default: 'active' }
}, { timestamps: true })

export default mongoose.model('Ticket', ticketSchema)
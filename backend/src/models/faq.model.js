import mongoose from 'mongoose'

const faqSchema = new mongoose.Schema({
  question: { type: String, required: true, trim: true },
  answer: { type: String, required: true },
  category: {
    type: String,
    default: 'General',
    enum: ['General', 'Booking', 'Payment', 'Pay on Exit', 'Cancellation']
  },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  embedding: { type: [Number] }
}, { timestamps: true })

faqSchema.index({ question: 'text', answer: 'text' })
export default mongoose.model('FAQ', faqSchema) // Model name 'FAQ'
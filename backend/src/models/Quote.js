import mongoose from 'mongoose'

const quoteSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  author: { type: String, default: 'Anonymous', trim: true },
  isActive: { type: Boolean, default: true },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true })

export default mongoose.model('Quote', quoteSchema)
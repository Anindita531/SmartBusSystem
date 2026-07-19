import mongoose from 'mongoose'

const offerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  couponCode: { type: String, uppercase: true }, // ✅ Coupon link
  discountText: { type: String, required: true }, // "Flat ₹50 off"
  validFrom: { type: Date, required: true }, // ✅ Add করো
  validTill: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  priority: { type: Number, default: 0 }
}, { timestamps: true })

export default mongoose.model('Offer', offerSchema)
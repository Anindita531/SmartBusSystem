import mongoose from 'mongoose'

// models/Coupon.js
const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discountType: { type: String, enum: ['flat', 'percentage'], required: true },
  discountValue: { type: Number, required: true },
  minAmount: { type: Number, default: 0 },
  maxDiscount: Number,
  usageLimit: { type: Number, default: 1000 },
  usedCount: { type: Number, default: 0 },
  validFrom: { type: Date, required: true },
  validTill: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  // ✅ এই field add করো
  usedByUsers: [{ 
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    usedAt: { type: Date, default: Date.now },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }
  }],
  perUserLimit: { type: Number, default: 1 } // ✅ Per user কয়বার use করতে পারবে
})
export default mongoose.model('Coupon', couponSchema)
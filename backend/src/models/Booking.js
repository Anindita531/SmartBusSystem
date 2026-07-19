import mongoose from 'mongoose'

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },

  // Stage Fare Fields
  boardingPoint: { type: String, required: true, trim: true },
  droppingPoint: { type: String, required: true, trim: true },
  boardingCheckpointOrder: { type: Number, required: true },
  droppingCheckpointOrder: { type: Number, required: true },
  distance: { type: Number, default: 0 },

  seats: [{ type: String, required: true }],
  passengerDetails: [{
    seat: String,
    name: String,
    age: Number,
    gender: String,
    phone: String
  }],
  totalAmount: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  couponCode: String,
  
  status: {
    type: String,
    enum: ['Pending', 'PendingPayment', 'Confirmed', 'Boarded', 'Completed', 'Cancelled'],
    default: 'Pending'
  },

  // Payment fields
  paymentType: { 
    type: String, 
    enum: ['pay_now', 'pay_after_ride', 'prepay'], 
    default: 'pay_now' 
  },
  paymentStatus: { 
    type: String, 
    enum: ['Pending', 'Paid'], 
    default: 'Pending' 
  },
  paidAt: { type: Date },
  paymentId: String,

  boardedAt: { type: Date },
  completedAt: { type: Date },
  completedBy: { type: String, enum: ['passenger', 'driver', 'system'] },
  reminder5Sent: { type: Boolean, default: false },
  rating: { type: Number, min: 1, max: 5 },
  review: String,
  reviewedAt: Date,
  journeyDate: { type: Date, required: true },
  pnr: { type: String, unique: true, sparse: true },

  usedAt: { type: Date },
  usedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  refundStatus: {
    type: String,
    enum: ['Not Required', 'Pending', 'Processing', 'Completed', 'Failed'],
    default: 'Not Required'
  },
  refundAmount: { type: Number, default: 0 },
  refundDate: { type: Date },
  refundTransactionId: { type: String },

  // FINE SYSTEM FIELDS
  fineAmount: { type: Number, default: 0 },
  fineStatus: { type: String, enum: ['none', 'pending', 'paid'], default: 'none' },
  fineReason: { type: String },
  finePaidAt: { type: Date },
  finePaymentId: { type: String },
  actualBoardingOrder: { type: Number },
  actualDroppingOrder: { type: Number },
  
  cancelledAt: { type: Date },
  
  finePaymentMode: { 
    type: String, 
    enum: ['cash', 'online', null], 
    default: null 
  },
  fineCollectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fineCollectedAt: Date,
  fineReceiptSent: { type: Boolean, default: false },
  fineTransactionId: { type: String }, 
  
  fineIssuedAt: Date,
  fineIssuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // FINE DISPUTE FIELDS
  fineDisputed: { type: Boolean, default: false },
  fineDisputeReason: { type: String },
  fineDisputeStatus: { 
    type: String, 
    enum: ['none', 'pending', 'under_review', 'resolved', 'rejected'], 
    default: 'none' 
  },
  fineDisputedAt: { type: Date },
  fineDisputeResolvedAt: { type: Date },
  fineDisputeResolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fineDisputeResolution: { type: String },
  fineDisputeRefund: { type: Number, default: 0 },
  fineDisputeProof: { type: String },
  fineDisputeProofUploadedAt: { type: Date },
  fineDisputeAdminNotes: { type: String },

  // EXIT CODE FIELDS - Mode A
  exitCode: { 
    type: String, 
    sparse: true, 
    index: true 
  },
  exitCodeExpiresAt: { 
    type: Date, 
    index: { expireAfterSeconds: 0 } // 30 min por auto delete hobe
  },// bookingSchema te add koro
paymentMethod: { 
  type: String, 
  enum: ['online', 'cash', 'upi'], 
  default: 'online' 
},
  exitCodeUsed: { type: Boolean, default: false }
  
}, { timestamps: true })

// PNR auto generate
bookingSchema.pre('save', function() {
  if (!this.pnr) {
    this.pnr = 'SBS' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 100)
  }
})

// Exit code verify korar method
bookingSchema.methods.verifyExitCode = function(code) {
  if (this.exitCodeUsed) return { valid: false, message: 'Code already used' }
  if (this.exitCode !== code) return { valid: false, message: 'Invalid code' }
  if (this.exitCodeExpiresAt < new Date()) return { valid: false, message: 'Code expired' }
  
  this.exitCodeUsed = true
  this.status = 'Completed'
  this.completedAt = new Date()
  return { valid: true }
}

export default mongoose.model('Booking', bookingSchema)
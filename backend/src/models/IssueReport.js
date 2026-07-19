import mongoose from 'mongoose'

const issueReportSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  issueType: { 
    type: String, 
    enum: ['cash_fine_no_receipt', 'overcharge', 'misbehavior', 'fine_dispute', 'other'], // ✅ 'fine_dispute' add কর
    required: true 
  },
  bookingId: String,
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }, // ✅ Add কর
  description: { 
    type: String, 
    required: true 
  },
  proofUrl: String,
  status: { 
    type: String, 
    enum: ['pending', 'investigating', 'resolved', 'rejected', 'false_report', 'under_review'], // ✅ 'under_review' add কর
    default: 'pending' 
  },
  adminNotes: String,
  conductorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  verifiedByGPS: { 
    type: Boolean, 
    default: false 
  },
  resolvedAt: Date
}, { timestamps: true })

export default mongoose.model('IssueReport', issueReportSchema)
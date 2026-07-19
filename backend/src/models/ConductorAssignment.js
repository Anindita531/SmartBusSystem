import mongoose from 'mongoose'

const conductorAssignmentSchema = new mongoose.Schema({
  conductorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  busId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['assigned', 'started', 'completed', 'cancelled'],
    default: 'assigned'
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // admin
  }
}, { timestamps: true })

// ✅ এক conductor একদিনে একটাই bus
conductorAssignmentSchema.index({ conductorId: 1, date: 1 }, { unique: true })

export default mongoose.model('ConductorAssignment', conductorAssignmentSchema)
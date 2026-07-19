// models/Notification.js
import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
  type: String,
  enum: [
    'booking_confirmed',
    'booking_cancelled', 
    'payment_success',
    'journey_started',
    'bus_delayed',
    'bus_arrived',
    'conductor_assigned',
    'admin_message',
    'review_reminder',
    'ride_completed',    // ← এটা add করো
    'bus_update',        // ← এটা add করো  
    'driver_assigned'   ,
    'fine_issued'
  ],
  required: true
}
    ,
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
}, { timestamps: true })
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 })

export default mongoose.model('Notification', notificationSchema)
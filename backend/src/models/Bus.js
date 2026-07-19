import mongoose from 'mongoose'

const checkpointSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  lat: { type: Number },
  lng: { type: Number },
  estimatedTime: { type: String },
  actualArrivalTime: { type: String, default: null },
  actualDepartedTime: { type: String, default: null },
  order: { type: Number, required: true },
  distanceFromStart: { type: Number, default: 0 },
  fareFromHere: { type: Number, default: 0 }
}, { _id: false })

const busSchema = new mongoose.Schema({
  busName: { type: String, required: true, trim: true },
  busNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
  busType: {
    type: String,
    enum: ['AC', 'Non-AC', 'Sleeper', 'Seater', 'AC Sleeper', 'AC Seater', 'Non-AC Sleeper', 'Non-AC Seater'],
    default: 'Non-AC'
  },

  // ✅ MODE FIELD
  mode: {
    type: String,
    enum: ['A', 'B'],
    default: 'B',
    required: true
  },

  ac: { type: Boolean, default: false },
  from: { type: String, required: true, trim: true },
  to: { type: String, required: true, trim: true },
  departureTime: { type: String, required: true },
  arrivalTime: { type: String, required: true },
  duration: { type: String },
  price: { type: Number, required: true, min: 0 },
  totalSeats: { type: Number, required: true, min: 1, max: 60 },
  availableSeats: { type: Number, required: true },
  bookedSeats: [{ type: String }],
  rating: { type: Number, default: 4.0, min: 0, max: 5 },
  amenities: [{ type: String }],
  journeyDate: { type: Date, required: true },

  checkpoints: [checkpointSchema],

  // ✅ MODE A: GPS Location
  gpsLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
  },
  lastLocationUpdate: { type: Date },

  // ✅ MODE B: Current Stop Name
  currentLocationName: { type: String, default: '' },
  currentCheckpointOrder: { type: Number, default: 0 },

  // Conductor fields
  conductor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  conductorName: { type: String },
  conductorPhone: { type: String },
  conductorAssignedAt: { type: Date },
  conductorDutyStart: { type: Date, default: null },
  conductorDutyEnd: { type: Date, default: null },

  // Driver fields
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  driverName: { type: String },
  driverPhone: { type: String },
  driverAssignedAt: { type: Date },
  driverDutyStart: { type: Date, default: null },
  driverDutyEnd: { type: Date, default: null },

  // ✅ PAYMENT TYPE - fixed enum to match Booking
  paymentType: {
    type: String,
    enum: ['pay_after_ride', 'pay_now'],
    default: function() {
      return this.mode === 'A'? 'pay_after_ride' : 'pay_now'
    }
  },

  upiId: { type: String, default: 'owner@upi' },

  tripStatus: { type: String, enum: ['not_started', 'started', 'completed'], default: 'not_started' },
  startedAt: { type: Date },
  completedAt: { type: Date },
  lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastUpdatedAt: { type: Date },

  averageRating: { type: Number, default: 4.0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'cancelled', 'completed'], default: 'active' }
}, { timestamps: true })
busSchema.index({ 
  from: 'text', 
  to: 'text', 
  busName: 'text', 
  busType: 'text',
  'checkpoints.name': 'text'
})

busSchema.index({ from: 1, to: 1, journeyDate: 1, status: 1 })
busSchema.index({ 'gpsLocation': '2dsphere' }) // Geo query

const Bus = mongoose.models.Bus || mongoose.model('Bus', busSchema)
export default Bus
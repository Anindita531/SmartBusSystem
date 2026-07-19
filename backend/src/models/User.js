import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  
  // ✅ এই দুইটা add করো
  isVerified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpiry: { type: Date },
  role: {
  type: String,
  enum: ['user', 'admin', 'conductor', 'driver'], // ✅ driver add করো
  default: 'user'
}
}, { timestamps: true })

userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password)
}

// ✅ এই লাইন ফিক্স
export default mongoose.models.User || mongoose.model('User', userSchema)
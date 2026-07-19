import bcrypt from 'bcryptjs' // ✅ এটা ইম্পোর্ট করো
import User from '../models/User.js'
import { generateToken } from '../utils/jwt.utils.js'
import { successResponse, errorResponse } from '../utils/response.utils.js'
import { sendEmail } from '../utils/mailer.js' // nodemailer setup লাগবে

export const register = async (req, res) => {
  try {
    console.log('Register body:', req.body)
    
    const { name, email, phone, password } = req.body
    const userExists = await User.findOne({ email })
    if (userExists) return errorResponse(res, 400, 'User already exists')

    // ✅ পাসওয়ার্ড হ্যাশ করো
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const user = await User.create({ 
      name, 
      email, 
      phone, 
      password: hashedPassword // ✅ হ্যাশ পাসওয়ার্ড দাও
    })
    console.log('User created:', user._id)
    
    const token = generateToken(user._id)
    
    // ✅ password রিমুভ করে পাঠাও
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role
    }
    
    successResponse(res, { user: userResponse, token }, 'Registered successfully')
  } catch (err) {
    console.error('Register Error:', err)
    errorResponse(res, 500, err.message)
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    
    if (!user || !(await user.comparePassword(password))) {
      return errorResponse(res, 401, 'Invalid credentials')
    }
    
    const token = generateToken(user._id)
    
    // ✅ password রিমুভ করে পাঠাও
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role
    }
    
    successResponse(res, { user: userResponse, token }, 'Login successful')
  } catch (err) {
    errorResponse(res, 500, err.message)
  }
}

export const getProfile = async (req, res) => {
  successResponse(res, req.user)
}

export const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user
  })
}
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id
    const { name, email, phone } = req.body

    // ✅ Email change করলে duplicate check
    if (email && email !== req.user.email) {
      const emailExists = await User.findOne({ email, _id: { $ne: userId } })
      if (emailExists) return errorResponse(res, 400, 'Email already in use')
    }

    // ✅ Phone change করলে duplicate check
    if (phone && phone !== req.user.phone) {
      const phoneExists = await User.findOne({ phone, _id: { $ne: userId } })
      if (phoneExists) return errorResponse(res, 400, 'Phone already in use')
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email, phone },
      { new: true, runValidators: true }
    ).select('-password')

    successResponse(res, updatedUser, 'Profile updated successfully')
  } catch (err) {
    console.log('Update profile error:', err)
    errorResponse(res, 500, err.message)
  }
}
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body
    const userId = req.user._id

    if (!oldPassword || !newPassword) {
      return errorResponse(res, 400, 'All fields required')
    }

    if (newPassword.length < 6) {
      return errorResponse(res, 400, 'Password must be at least 6 characters')
    }

    const user = await User.findById(userId)
    if (!user) {
      return errorResponse(res, 404, 'User not found')
    }

    const isMatch = await user.comparePassword(oldPassword)
    if (!isMatch) {
      return errorResponse(res, 400, 'Current password is incorrect')
    }

    const salt = await bcrypt.genSalt(10)
    user.password = await bcrypt.hash(newPassword, salt)
    await user.save()

    successResponse(res, null, 'Password changed successfully')
  } catch (error) {
    console.error('Change password error:', error)
    errorResponse(res, 500, 'Server error')
  }
}
// Send OTP
export const sendOTP = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    
    user.otp = otp
    user.otpExpiry = Date.now() + 10 * 60 * 1000 // 10 min
    await user.save()

    await sendEmail(user.email, 'Verify Your Email', `Your OTP: ${otp}`)
    
    successResponse(res, null, 'OTP sent to email')
  } catch (error) {
    errorResponse(res, 500, 'Failed to send OTP')
  }
}

// Verify OTP
export const verifyOTP = async (req, res) => {
  try {
    const { otp } = req.body
    const user = await User.findById(req.user._id)

    if (user.otp !== otp || user.otpExpiry < Date.now()) {
      return errorResponse(res, 400, 'Invalid or expired OTP')
    }

    user.isVerified = true
    user.otp = undefined
    user.otpExpiry = undefined
    await user.save()

    successResponse(res, user, 'Email verified successfully')
  } catch (error) {
    errorResponse(res, 500, 'Verification failed')
  }
}
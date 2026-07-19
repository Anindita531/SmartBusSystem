import express from 'express'
import { register, changePassword ,login, getProfile, getMe, updateProfile ,sendOTP,verifyOTP} from '../controllers/auth.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = express.Router()
router.post('/register', register)
router.post('/send-otp', protect, sendOTP)
router.post('/verify-otp', protect, verifyOTP)

router.post('/login', login)
router.get('/profile', protect, getProfile)
router.get('/me', protect, getMe)
router.put('/profile', protect, updateProfile) // ✅ নতুন add করো
router.put('/change-password', protect, changePassword)
export default router
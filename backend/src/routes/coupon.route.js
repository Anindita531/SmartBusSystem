import express from 'express'
import {
  validateCoupon,
  getAllCoupons,
  createCoupon,
  toggleCouponStatus,
  deleteCoupon
} from '../controllers/coupon.controller.js'
import { protect, adminOnly } from '../middleware/auth.middleware.js'

const router = express.Router()

// User route
router.post('/validate', protect, validateCoupon)

// Admin routes
router.get('/admin/all', protect, adminOnly, getAllCoupons)
router.post('/admin/create', protect, adminOnly, createCoupon)
router.patch('/admin/toggle/:id', protect, adminOnly, toggleCouponStatus)
router.delete('/admin/delete/:id', protect, adminOnly, deleteCoupon)

export default router
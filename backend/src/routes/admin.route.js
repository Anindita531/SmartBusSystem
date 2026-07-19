import express from 'express'
import {
  getDashboardStats,
  getSalesData,
  getAllBookings,
  getAllUsers,
  getRefundReport,
  updateUserRole,
  deleteUser,
  createStaff,
  getFineDisputes,
  investigateDispute,
  resolveFineDispute,
} from '../controllers/admin.controller.js'

import {
  createFAQ,
  updateFAQ,
  deleteFAQ
} from '../controllers/faq.controller.js' // <-- FAQ controller import

import { protect, adminOnly } from '../middleware/auth.middleware.js'

const router = express.Router()

router.use(protect, adminOnly) // ✅ সব route protected

router.get('/stats', getDashboardStats)
router.get('/sales-data', getSalesData)
router.get('/bookings', getAllBookings)
router.get('/users', getAllUsers)
router.patch('/users/:userId/role', updateUserRole)
router.delete('/users/:userId', deleteUser)
router.get('/refunds', getRefundReport)
router.post('/create-staff', createStaff)

// Fine Dispute Routes
router.get('/fine-disputes', getFineDisputes)
router.get('/investigate-dispute/:bookingId', investigateDispute)
router.post('/resolve-fine-dispute/:id', resolveFineDispute)

// FAQ Admin Routes - Admin only
router.post('/faqs', createFAQ)
router.put('/faqs/:id', updateFAQ)
router.delete('/faqs/:id', deleteFAQ)

export default router
import express from 'express'
import {
  createBooking,
  getMyBookings,
  getBooking,
  verifyBooking,
  confirmPayment,
  cancelBooking,
  lockSeats,
  getLockedSeats,
  releaseSeats,
  getRecentBookings,
  addReview,
  markTicketUsed,
  markBoarded,
  markRideComplete,
  payFine,
  verifyBoarding,
  verifyExit,
  disputeFine,
  resolveFineDispute,
  createFinePaymentIntent,
  getFineDisputes,
  uploadDisputeProof,
  deleteBookingHistory,
  clearAllHistory,   
  payOnExit,
  verifyExitCodeController,
  getDriverPendingExits,
  processPaymentAndGenerateExitCode,
} from '../controllers/booking.controller.js'
import { protect, adminOrConductor, restrictTo } from '../middleware/auth.middleware.js'
import { upload } from '../middleware/upload.middleware.js'

const router = express.Router()

// 1. STATIC ROUTES - sobar upore
router.post('/create', protect, createBooking)
router.get('/my-bookings', protect, getMyBookings)
router.get('/recent', protect, getRecentBookings)
router.get('/locked-seats', protect, getLockedSeats)
router.get('/verify/:pnr', verifyBooking)

// 2. HISTORY ROUTES
router.delete('/history/clear-all', protect, clearAllHistory)
router.delete('/:id/history', protect, deleteBookingHistory)

// 3. ADMIN ROUTES
router.get('/admin/fine-disputes', protect, restrictTo('admin'), getFineDisputes)
router.post('/admin/:bookingId/resolve-fine-dispute', protect, restrictTo('admin'), resolveFineDispute)

// 4. BUS SPECIFIC ROUTES - dynamic er age rakhte hobe
router.get('/buses/:busId/active-bookings', protect, restrictTo('driver'), getDriverPendingExits)
router.post('/buses/:busId/mark-cash-payment', protect, restrictTo('driver'), processPaymentAndGenerateExitCode)
router.post('/:busId/lock', protect, lockSeats)
router.post('/:busId/release', protect, releaseSeats)

// 5. PNR ROUTES
router.patch('/verify/:pnr/use', protect, adminOrConductor, markTicketUsed)
router.post('/:pnr/verify-boarding', protect, restrictTo('driver','conductor'), verifyBoarding)
router.post('/:pnr/verify-exit', protect, restrictTo('driver','conductor'), verifyExit)

// 6. BOOKING ID ROUTES
router.post('/:bookingId/confirm', protect, confirmPayment)
router.patch('/:bookingId/cancel', protect, cancelBooking)
router.post('/:bookingId/review', protect, addReview)
router.post('/:bookingId/create-fine-intent', protect, createFinePaymentIntent)
router.post('/:bookingId/pay-fine', protect, payFine)
router.post('/:bookingId/dispute-fine', protect, disputeFine)
router.post('/:bookingId/pay-exit', protect, restrictTo('driver'), payOnExit)
router.post('/:bookingId/verify-exit-code', protect, restrictTo('driver'), verifyExitCodeController)
router.post('/upload-dispute-proof/:bookingId', protect, upload.single('proof'), uploadDisputeProof)

// 7. BOARD/COMPLETE ROUTES
router.patch('/:id/board', protect, restrictTo('driver'), markBoarded)
router.patch('/:id/complete', protect, markRideComplete)

// 8. MISC ROUTES
router.post('/process-payment', protect, restrictTo('driver'), processPaymentAndGenerateExitCode)
router.get('/driver-pending-exits', protect, restrictTo('driver'), getDriverPendingExits)

// 9. DYNAMIC ROUTE - sobar sheshe rakhte hobe
router.get('/:id', protect, getBooking)

export default router
import express from 'express'
import {
  searchBuses,
  getAllRoutes,
  getSeats,
  getBusDetails,
  createBus,
  quickBook,
  quickBookOptions,
  getBuses, 
  assignConductor,
  getConductors,
  getConductorBuses,
  updateBusStatus,
  removeConductor,
  removeDriver,
  updateBusLocation,
  updateCheckpoint,
  assignDriver,
  trackBus,
  getActiveBookings,
  getDriverPendingExits,
  markCashPayment,
  verifyExitCode
} from '../controllers/bus.controller.js'
import { protect, restrictTo, adminOnly, conductorOnly } from '../middleware/auth.middleware.js'

const router = express.Router()

// 1. Public routes - static
router.get('/search', searchBuses)
router.get('/routes', getAllRoutes)
router.post('/routes', quickBookOptions)

// 2. Admin only
router.get('/conductors', protect, adminOnly, getConductors)
router.post('/', protect, restrictTo('admin'), createBus)
router.get('/', protect, adminOnly, getBuses)

// 3. Driver & Conductor shared
router.get('/conductor-buses', protect, restrictTo('driver', 'conductor'), getConductorBuses)
router.put('/:id/status', protect, restrictTo('driver', 'conductor'), updateBusStatus)
router.delete('/:id/remove-driver', protect, adminOnly, removeDriver)

// 4. Admin assign
router.put('/:id/assign-conductor', protect, adminOnly, assignConductor)
router.delete('/:id/remove-conductor', protect, adminOnly, removeConductor)
router.put('/:id/assign-driver', protect, adminOnly, assignDriver)
router.post('/:busId/mark-cash-payment', protect, restrictTo('driver', 'conductor'), markCashPayment)
// 5. User specific routes
router.post('/quick-book', protect, quickBook)
router.get('/:busId/seats', getSeats)
router.put('/:id/update-location', protect, restrictTo('driver', 'conductor'), updateBusLocation)
router.put('/:id/checkpoint', protect, restrictTo('driver', 'conductor'), updateCheckpoint)
router.get('/:id/track', protect, trackBus)
router.get('/driver-pending-exits', protect, restrictTo('driver'), getDriverPendingExits)
// 6. Mode A specific routes - specific routes age
router.get('/:busId/active-bookings', protect, restrictTo('driver', 'conductor'), getActiveBookings)
router.post('/:busId/verify-exit-code', protect, restrictTo('driver', 'conductor'), verifyExitCode)

// 7. Generic route - SOBAR SHESE
router.get('/:busId', getBusDetails)

export default router
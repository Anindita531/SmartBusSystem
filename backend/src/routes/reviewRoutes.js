import express from 'express'
import {
  createReview,
  getBusReviews,
  getMyReviews,
  deleteReview,
  getAllReviews
} from '../controllers/reviewController.js'
import { protect, adminOnly } from '../middleware/auth.middleware.js' // ✅

const router = express.Router()

router.get('/', protect, adminOnly, getAllReviews) // GET /api/reviews
router.get('/bus/:busId', getBusReviews) 
router.post('/', protect, createReview) // ✅ protect লাগবে, authorize না
router.get('/my', protect, getMyReviews) // ✅ protect লাগবে
router.delete('/:id', protect, adminOnly, deleteReview)

export default router
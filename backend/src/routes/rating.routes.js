import express from 'express'
import { rateConductor } from '../controllers/ratingController.js'
import { protect } from '../middleware/auth.middleware.js'

const router = express.Router()

router.post('/conductor', protect, rateConductor)

export default router
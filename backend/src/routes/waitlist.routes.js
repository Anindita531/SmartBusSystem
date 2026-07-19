import express from 'express'
import { joinWaitlist, getMyWaitlist } from '../controllers/waitlist.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = express.Router()

router.post('/join', protect, joinWaitlist)
router.get('/my-waitlist', protect, getMyWaitlist)

export default router
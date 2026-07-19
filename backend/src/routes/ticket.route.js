import express from 'express'
import { getTicket, getMyTickets } from '../controllers/ticket.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = express.Router()

router.get('/my-tickets', protect, getMyTickets) // ✅ এটা লাগলে
router.get('/:bookingId', getTicket)

export default router
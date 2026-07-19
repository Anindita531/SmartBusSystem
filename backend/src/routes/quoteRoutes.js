import express from 'express'
import { getTodaysQuote, getAllQuotes, addQuote, toggleQuote, deleteQuote } from '../controllers/quoteController.js'
import { protect, adminOnly } from '../middleware/auth.middleware.js'

const router = express.Router()

router.get('/today', getTodaysQuote) // Public

// Protected + Admin only
router.get('/all', protect, adminOnly, getAllQuotes)
router.post('/add', protect, adminOnly, addQuote)
router.patch('/toggle/:id', protect, adminOnly, toggleQuote)
router.delete('/:id', protect, adminOnly, deleteQuote)

export default router
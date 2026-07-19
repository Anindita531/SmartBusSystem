import express from 'express'
import { getFAQs, createFAQ, updateFAQ, deleteFAQ, getPublicFAQs } from '../controllers/faq.controller.js'
import { protect, adminOnly } from '../middleware/auth.middleware.js'

const router = express.Router()

router.get('/public', getPublicFAQs) // <-- ETA SOBAR UPORE
router.get('/', protect, adminOnly, getFAQs) // Admin only
router.post('/', protect, adminOnly, createFAQ)
router.put('/:id', protect, adminOnly, updateFAQ)
router.delete('/:id', protect, adminOnly, deleteFAQ)

export default router
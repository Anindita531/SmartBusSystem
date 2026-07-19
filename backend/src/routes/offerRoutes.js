import express from 'express'
import Offer from '../models/Offer.js'
import { protect, adminOnly } from '../middleware/auth.middleware.js' // ✅ Add করো

const router = express.Router()

// Get all active offers - Public
router.get('/', async (req, res) => {
  try {
    const offers = await Offer.find({
      isActive: true,
      validFrom: { $lte: new Date() },
      validTill: { $gte: new Date() }
    }).sort({ priority: -1, createdAt: -1 })
    
    res.json({ success: true, data: offers }) // ✅ Response format ঠিক করো
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Create offer - Admin only ✅ protect add করো
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const offer = new Offer(req.body)
    await offer.save()
    res.status(201).json({ success: true, data: offer })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// Update offer - Admin only ✅ protect add করো
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const offer = await Offer.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    )
    res.json({ success: true, data: offer })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// Delete offer - Admin only ✅ protect add করো
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Offer.findByIdAndDelete(req.params.id)
    res.json({ success: true, message: 'Offer deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
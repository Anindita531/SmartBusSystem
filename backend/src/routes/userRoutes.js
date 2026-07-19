import express from 'express'
import { getConductors, getDrivers, getAllUsers, updateUserRole } from '../controllers/userController.js'
import { protect, adminOnly } from '../middleware/auth.middleware.js'

const router = express.Router()

router.get('/conductors', protect, adminOnly, getConductors)
router.get('/drivers', protect, adminOnly, getDrivers) // ✅ এটা add করো
router.get('/', protect, adminOnly, getAllUsers)
router.put('/:id/role', protect, adminOnly, updateUserRole)

export default router
import express from 'express'
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,clearAllNotifications
} from '../controllers/notification.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = express.Router()

router.use(protect)
router.get('/', getMyNotifications)
router.put('/:id/read', markAsRead)
router.put('/read-all', markAllAsRead)
router.delete('/:id', deleteNotification)
router.delete('/', protect, clearAllNotifications)
export default router
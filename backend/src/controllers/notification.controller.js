import Notification from '../models/Notification.js'

// GET /api/notifications - User এর সব notification
export const getMyNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unread } = req.query
    const query = { user: req.user.id }
    if (unread === 'true') query.isRead = false

    const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)

    const unreadCount = await Notification.countDocuments({
      user: req.user.id,
      isRead: false
    })

    res.json({
      data: notifications,
      unreadCount,
      total: await Notification.countDocuments({ user: req.user.id })
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// PUT /api/notifications/:id/read - Mark as read
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isRead: true, readAt: new Date() },
      { new: true }
    )
    if (!notification) return res.status(404).json({ message: 'Not found' })
    res.json({ data: notification })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// PUT /api/notifications/read-all - সব read করো
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, isRead: false },
      { isRead: true, readAt: new Date() }
    )
    res.json({ message: 'All marked as read' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// DELETE /api/notifications/:id
export const deleteNotification = async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, user: req.user.id })
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Helper: Create notification - অন্য controller থেকে call করবে
export const createNotification = async (userId, type, title, message, data = {}) => {
  try {
    await Notification.create({ user: userId, type, title, message, data })
  } catch (err) {
    console.log('Notification create error:', err)
  }
}
// Single notification delete

// Clear all notifications
export const clearAllNotifications = async (req, res) => {
  const userId = req.user._id
  
  await Notification.deleteMany({ user: userId })
  
  successResponse(res, null, 'All notifications cleared')
}

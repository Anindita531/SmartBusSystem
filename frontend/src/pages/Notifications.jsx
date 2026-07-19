import { useState, useEffect } from 'react'
import { Bell, Check, Ticket, Bus, AlertCircle, Info, Trash2, X, CreditCard } from 'lucide-react'
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from '../api/notification.api'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

// 🔥 Theme 1: Corporate Blue | Theme 2: Indigo
const PRIMARY_COLOR = '#0F4C75' // Change to '#3730A3' for Theme 2

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const res = await getNotifications()
      setNotifications(res.data.data || [])
      setUnreadCount(res.data.unreadCount || 0)
    } catch (err) {
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      setNotifications(prev => 
        prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
      
      try {
        await markAsRead(notif._id)
      } catch (err) {
        setNotifications(prev => 
          prev.map(n => n._id === notif._id ? { ...n, isRead: false } : n)
        )
        setUnreadCount(prev => prev + 1)
        toast.error('Failed to mark as read')
        return
      }
    }

    if (notif.type === 'fine_issued' && notif.data?.bookingId) {
      navigate(`/pay-fine/${notif.data.bookingId}`)
    } else if (notif.type === 'conductor_assigned' && notif.data?.busId) {
      navigate('/conductor', { 
        state: { 
          selectedBusId: notif.data.busId,
          openTodaysTrip: true 
        } 
      })
    } else if (notif.type === 'booking_confirmed') {
      navigate('/bookings')
    }
  }

  const handleMarkRead = async (id) => {
    const notif = notifications.find(n => n._id === id)
    if (!notif || notif.isRead) return

    setNotifications(prev => 
      prev.map(n => n._id === id ? { ...n, isRead: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))

    try {
      await markAsRead(id)
    } catch (err) {
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, isRead: false } : n)
      )
      setUnreadCount(prev => prev + 1)
      toast.error('Failed')
    }
  }

  const handleMarkAllRead = async () => {
    const prevNotifs = notifications
    const prevCount = unreadCount
    
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnreadCount(0)
    
    try {
      await markAllAsRead()
      toast.success('All marked as read')
    } catch (err) {
      setNotifications(prevNotifs)
      setUnreadCount(prevCount)
      toast.error('Failed')
    }
  }

  const handleDelete = async (id) => {
    const notif = notifications.find(n => n._id === id)
    const wasUnread = notif && !notif.isRead
    
    setNotifications(prev => prev.filter(n => n._id !== id))
    if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1))
    
    try {
      await deleteNotification(id)
    } catch (err) {
      setNotifications(prev => [...prev, notif].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      ))
      if (wasUnread) setUnreadCount(prev => prev + 1)
      toast.error('Failed to delete')
    }
  }

  const getIcon = (type) => {
    const icons = {
      booking_confirmed: <Ticket className="w-5 h-5 text-green-600" />,
      booking_cancelled: <X className="w-5 h-5 text-red-600" />,
      payment_success: <Check className="w-5 h-5 text-green-600" />,
      journey_started: <Bus className="w-5 h-5 text-blue-600" />,
      bus_delayed: <AlertCircle className="w-5 h-5 text-yellow-600" />,
      bus_arrived: <Check className="w-5 h-5 text-green-600" />,
      conductor_assigned: <Bus className="w-5 h-5 text-purple-600" />,
      admin_message: <Info className="w-5 h-5 text-blue-600" />,
      fine_issued: <CreditCard className="w-5 h-5 text-orange-600" />
    }
    return icons[type] || <Bell className="w-5 h-5 text-gray-500" />
  }

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center text-gray-900">
      Loading...
    </div>
  )

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Bell className="w-8 h-8" style={{ color: PRIMARY_COLOR }} />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                <p className="text-gray-600">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-white px-4 py-2 rounded-lg hover:opacity-90"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                Mark All Read
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No notifications yet</p>
            </div>
          ) : (
            notifications.map(notif => (
              <div
                key={notif._id}
                onClick={() => handleNotificationClick(notif)}
                className={`bg-white border rounded-lg p-5 transition-all cursor-pointer ${
                  notif.isRead ? 'border-gray-200 opacity-70' : 'border-gray-300 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">{getIcon(notif.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-gray-900 font-semibold">{notif.title}</h3>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full flex-shrink-0 mt-2 animate-pulse" style={{ backgroundColor: PRIMARY_COLOR }}></span>
                      )}
                    </div>
                    <p className="text-gray-700 text-sm mb-2">{notif.message}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-xs">
                        {new Date(notif.createdAt).toLocaleString('en-IN', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        {!notif.isRead && (
                          <button
                            onClick={() => handleMarkRead(notif._id)}
                            className="hover:opacity-80 text-sm"
                            style={{ color: PRIMARY_COLOR }}
                          >
                            Mark read
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notif._id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
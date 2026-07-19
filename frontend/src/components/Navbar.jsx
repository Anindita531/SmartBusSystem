import { useNavigate, Link } from 'react-router-dom'
import { Bus, Bell, User, LogOut, LayoutDashboard, ChevronDown, Ticket, Settings, MessageCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect, useRef } from 'react'
import { getNotifications } from '../api/notification.api'
import TranslateButton from './TranslateButton.jsx'

const PRIMARY_COLOR = '#0F4C75'

export default function Navbar() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (user) {
      fetchUnreadCount()
      const interval = setInterval(fetchUnreadCount, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current &&!dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchUnreadCount = async () => {
    try {
      const res = await getNotifications()
      setUnreadCount(res.data.unreadCount || 0)
    } catch (err) {
      console.log('Failed to fetch count:', err)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
    setShowDropdown(false)
  }

  const getDashboardLink = () => {
    if (user?.role === 'admin') return '/admin'
    if (user?.role === 'conductor') return '/conductor'
    if (user?.role === 'driver') return '/driver'
    return null
  }

  const dashboardLink = getDashboardLink()

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg" style={{ backgroundColor: PRIMARY_COLOR }}>
              <Bus className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-bold text-gray-900">SmartBus</span>
              <p className="text-gray-500 text-xs">Book Smart, Travel Smart</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <TranslateButton />

            {user? (
              <>
                <Link to="/notifications" className="relative p-2.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors">
                  <Bell className="w-5 h-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                      {unreadCount > 99? '99+' : unreadCount}
                    </span>
                  )}
                </Link>

                <div className="relative" ref={dropdownRef}>
                  <button onClick={() => setShowDropdown(!showDropdown)} className="flex items-center gap-3 bg-white hover:bg-gray-50 border-gray-300 px-3.5 py-2 rounded-lg text-gray-900 transition-colors">
                    <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-semibold">Hi, {user.name.split(' ')[0]}</p>
                      <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showDropdown? 'rotate-180' : ''}`} />
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border-gray-200 rounded-lg shadow-lg overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                        <p className="text-gray-900 font-semibold">{user.name}</p>
                        <p className="text-gray-500 text-sm truncate">{user.email}</p>
                      </div>
                      <div className="py-1">
                        {dashboardLink && (
                          <Link to={dashboardLink} onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50">
                            <LayoutDashboard className="w-4 h-4" /> <span className="font-medium text-sm">Dashboard</span>
                          </Link>
                        )}
                        <Link to="/ai-chat" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 sm:hidden">
                          <MessageCircle className="w-4 h-4" /> <span className="font-medium text-sm">AI Assistant</span>
                        </Link>
                        <Link to="/profile" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50">
                          <Settings className="w-4 h-4" /> <span className="font-medium text-sm">My Profile</span>
                        </Link>
                        <Link to="/bookings" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50">
                          <Ticket className="w-4 h-4" /> <span className="font-medium text-sm">My Tickets</span>
                        </Link>
                      </div>
                      <div className="border-t border-gray-200 p-1">
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-md">
                          <LogOut className="w-4 h-4" /> <span className="font-medium text-sm">Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link to="/login" className="text-white px-6 py-2.5 rounded-lg font-semibold transition-colors" style={{ backgroundColor: PRIMARY_COLOR }}>
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
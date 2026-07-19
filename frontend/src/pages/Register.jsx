import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { User, Mail, Lock, Phone, Shield, CheckCircle, Sparkles } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import api from '../api/axios'
import toast from 'react-hot-toast'

// 🔥 Theme 1: Corporate Blue | Theme 2: Indigo
const PRIMARY_COLOR = '#0F4C75' // Change to '#3730A3' for Theme 2

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({ users: 0 })
  const [loadingStats, setLoadingStats] = useState(true)
  const navigate = useNavigate()
  const { register } = useAuth()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await api.get('/stats/public')
      setStats(res.data.data)
    } catch (err) {
      console.error('Stats fetch error:', err)
    } finally {
      setLoadingStats(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form)
      toast.success('Account created successfully!')
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
      toast.error('Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const formatCount = (num) => {
    if (num >= 1000) return `${Math.floor(num / 1000)}K+`
    return `${num}+`
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Benefits */}
        <div className="hidden lg:block">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4" />
              {loadingStats? 'Loading...' : `Join ${formatCount(stats.users)} Happy Travelers`}
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4 leading-tight">
              Start Your<br />
              <span style={{ color: PRIMARY_COLOR }}>
                Smart Journey
              </span>
            </h1>
            <p className="text-gray-600 text-lg">
              Create your account and unlock premium bus booking features
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: Shield, title: 'Secure Booking', desc: '100% safe & encrypted transactions' },
              { icon: CheckCircle, title: 'Instant Confirmation', desc: 'Get tickets in seconds' },
              { icon: Sparkles, title: 'Exclusive Offers', desc: 'Special discounts for members' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 bg-gray-50 border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-all">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-gray-900 font-semibold mb-1">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
              <p className="text-gray-600">Join SmartBus today</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
                <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  !
                </div>
                {error}
              </div>
            )}
            
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  value={form.name} 
                  onChange={e => setForm({...form, name: e.target.value})} 
                  required 
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 placeholder-gray-500" 
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  value={form.email} 
                  onChange={e => setForm({...form, email: e.target.value})} 
                  required 
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 placeholder-gray-500" 
                />
              </div>

              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="tel" 
                  placeholder="Phone Number" 
                  value={form.phone} 
                  onChange={e => setForm({...form, phone: e.target.value})} 
                  required 
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 placeholder-gray-500" 
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="password" 
                  placeholder="Password" 
                  value={form.password} 
                  onChange={e => setForm({...form, password: e.target.value})} 
                  required 
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 placeholder-gray-500" 
                />
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full py-3 rounded-lg font-semibold text-white hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                {loading? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <p className="text-center text-gray-600 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold hover:underline" style={{ color: PRIMARY_COLOR }}>
                Login
              </Link>
            </p>
          </div>

          <p className="text-center text-gray-500 text-xs mt-6">
            By registering, you agree to our Terms & Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}
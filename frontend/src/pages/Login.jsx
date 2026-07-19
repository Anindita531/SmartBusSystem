import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Mail, Lock, LogIn, Shield, Zap, CheckCircle, Sparkles } from 'lucide-react'
import api from '../api/axios'
import toast from 'react-hot-toast'

// 🔥 Theme 1: Corporate Blue | Theme 2: Indigo
const PRIMARY_COLOR = '#0F4C75' // Change to '#3730A3' for Theme 2

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({ users: 0 })
  const [loadingStats, setLoadingStats] = useState(true)
  const navigate = useNavigate()
  const { login } = useAuth()

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

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      toast.success('Login successful!')
      navigate('/search')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
      toast.error('Invalid credentials')
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
              {loadingStats? 'Loading...' : `Trusted by ${formatCount(stats.users)} Travelers`}
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4 leading-tight">
              Welcome<br />
              <span style={{ color: PRIMARY_COLOR }}>
                Back
              </span>
            </h1>
            <p className="text-gray-600 text-lg">
              Login to access your bookings and continue your journey
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: Shield, title: 'Secure Access', desc: 'Your data is encrypted & protected' },
              { icon: Zap, title: 'Quick Booking', desc: 'Book buses in seconds' },
              { icon: CheckCircle, title: 'Instant Confirmation', desc: 'Get tickets immediately' },
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
              <div className="w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: PRIMARY_COLOR }}>
                <LogIn className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
              <p className="text-gray-600">Login to your SmartBus account</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
                <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  !
                </div>
                {error}
              </div>
            )}
            
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  required
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  Remember me
                </label>
                <Link to="/forgot-password" className="font-semibold hover:underline" style={{ color: PRIMARY_COLOR }}>
                  Forgot password?
                </Link>
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
                    Logging in...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Login
                  </>
                )}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <p className="text-center text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold hover:underline" style={{ color: PRIMARY_COLOR }}>
                Register Now
              </Link>
            </p>
          </div>

          <p className="text-center text-gray-500 text-xs mt-6">
            By logging in, you agree to our Terms & Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}
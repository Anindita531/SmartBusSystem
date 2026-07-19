import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { MapPin, Calendar, Search, ArrowRightLeft, Zap, Shield, TrendingUp, Star, HelpCircle, Loader } from 'lucide-react'
import { getAllRoutes } from '../api/bus.api'
import api from '../api/axios'
import toast from 'react-hot-toast'
import TodaysQuote from '../components/TodaysQuote'

export default function Home() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [date, setDate] = useState('')
  const [fromCities, setFromCities] = useState([])
  const [toCities, setToCities] = useState([])
  const [showFromList, setShowFromList] = useState(false)
  const [showToList, setShowToList] = useState(false)
  const [stats, setStats] = useState({ users: 0, buses: 0, bookings: 0, rating: 0 })
  const [loadingStats, setLoadingStats] = useState(true)
  const [homeFaqs, setHomeFaqs] = useState([])
  const [loadingFaqs, setLoadingFaqs] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchFromRoutes()
    fetchStats()
    fetchHomeFAQs()
  }, [])

  useEffect(() => {
    if (from) {
      fetchToRoutes(from)
      setTo('')
    } else {
      setToCities([])
    }
  }, [from])

  const fetchStats = async () => {
    try {
     const res = await api.get('/stats/public')
      const data = res.data?.data || res.data || {}
      setStats({
        users: data.users || 0,
        buses: data.buses || 0,
        bookings: data.bookings || 0,
        rating: data.rating || 0
      })
    } catch (err) {
      console.error('Stats fetch error:', err)
    } finally {
      setLoadingStats(false)
    }
  }

  const fetchHomeFAQs = async () => {
    try {
      const res = await api.get('/faqs/public')
      const data = res.data?.data || []
      setHomeFaqs(data.slice(0, 4)) // home e sudhu 4 te
    } catch (err) {
      console.error('FAQ fetch error:', err)
      setHomeFaqs([])
    } finally {
      setLoadingFaqs(false)
    }
  }

  const fetchFromRoutes = async () => {
    try {
      const res = await getAllRoutes()
      const cities = res.data?.data || res.data || []
      setFromCities(Array.isArray(cities)? cities : [])
    } catch (err) {
      console.error('From routes fetch error:', err)
      setFromCities([])
    }
  }

  const fetchToRoutes = async (fromCity) => {
    try {
      const res = await getAllRoutes(fromCity)
      const cities = res.data?.data || res.data || []
      setToCities(Array.isArray(cities)? cities : [])
    } catch (err) {
      console.error('To routes fetch error:', err)
      setToCities([])
    }
  }

  const handleSearch = () => {
    if (!from.trim() ||!to.trim() ||!date) {
      toast.error('Please fill all fields')
      return
    }
    navigate(`/search?from=${encodeURIComponent(from.trim())}&to=${encodeURIComponent(to.trim())}&date=${date}`)
  }

  const swapLocations = () => {
    setFrom(to)
    setTo(from)
  }

  const today = new Date().toISOString().split('T')[0]

  const filteredFromCities = Array.isArray(fromCities)
  ? fromCities.filter(city =>
        typeof city === 'string' && city.toLowerCase().includes(from.toLowerCase())
      )
    : []

  const filteredToCities = Array.isArray(toCities)
  ? toCities.filter(city =>
        typeof city === 'string' && city.toLowerCase().includes(to.toLowerCase())
      )
    : []

  const formatCount = (num) => {
    const n = Number(num) || 0
    if (n >= 1000) return `${Math.floor(n / 1000)}K+`
    return `${n}+`
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">

      {/* Hero Section */}
      <div className="bg-[#0F4C75]">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-20">
          <TodaysQuote/>

          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white px-4 py-1.5 rounded-md text-sm font-medium mb-5">
              <Star className="w-4 h-4 text-amber-400" />
              Trusted Bus Booking Platform
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
              Book Your Bus Tickets
            </h1>
            <p className="text-base text-blue-100">
              Safe, reliable and affordable bus travel across India
            </p>
          </div>

          {/* Search Card */}
          <div className="max-w-5xl mx-auto">
            <div className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
              <div className="flex flex-col lg:flex-row gap-3 items-stretch">
                {/* From City */}
                <div className="flex-1 relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                  <input
                    type="text"
                    placeholder="From City"
                    value={from}
                    onChange={e => setFrom(e.target.value)}
                    onFocus={() => setShowFromList(true)}
                    onBlur={() => setTimeout(() => setShowFromList(false), 200)}
                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#0F4C75] focus:ring-1 focus:ring-[#0F4C75] text-gray-900 dark:text-white placeholder-gray-500"
                  />
                  {showFromList && filteredFromCities.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-lg shadow-md max-h-60 overflow-y-auto">
                      {filteredFromCities.map((city, idx) => (
                        <div
                          key={`${city}-${idx}`}
                          onClick={() => {
                            setFrom(city)
                            setShowFromList(false)
                          }}
                          className="px-4 py-2.5 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-0"
                        >
                          {city}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={swapLocations}
                  className="hidden lg:flex items-center justify-center w-12 h-12 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <ArrowRightLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>

                {/* To City */}
                <div className="flex-1 relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                  <input
                    type="text"
                    placeholder={from? "To City" : "Select From first"}
                    value={to}
                    onChange={e => setTo(e.target.value)}
                    onFocus={() => from && setShowToList(true)}
                    onBlur={() => setTimeout(() => setShowToList(false), 200)}
                    disabled={!from}
                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#0F4C75] focus:ring-1 focus:ring-[#0F4C75] text-gray-900 dark:text-white placeholder-gray-500 disabled:bg-gray-50"
                  />
                  {showToList && filteredToCities.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-lg shadow-md max-h-60 overflow-y-auto">
                      {filteredToCities.map((city, idx) => (
                        <div
                          key={`${city}-${idx}`}
                          onClick={() => {
                            setTo(city)
                            setShowToList(false)
                          }}
                          className="px-4 py-2.5 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-0"
                        >
                          {city}
                        </div>
                      ))}
                    </div>
                  )}
                  {from && toCities.length === 0 && (
                    <p className="text-xs text-red-600 mt-1 absolute">No routes available from {from}</p>
                  )}
                </div>

                {/* Date */}
                <div className="flex-1 relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    min={today}
                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-[#0F4C75] focus:ring-1 focus:ring-[#0F4C75] text-gray-900 dark:text-white"
                  />
                </div>

                {/* Search Button */}
                <button
                  onClick={handleSearch}
                  className="lg:w-36 bg-[#0F4C75] hover:bg-[#0D3D5E] py-3 rounded-lg font-semibold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={!from.trim() ||!to.trim() ||!date}
                >
                  <Search className="w-5 h-5" />
                  Search
                </button>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="flex items-center justify-center gap-8 mt-8 text-sm text-blue-100">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              24/7 Booking
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              Secure Payment
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
              Instant Refund
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Why Choose Our Service</h2>
          <p className="text-gray-600 dark:text-gray-400">Reliable and convenient bus booking</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: Zap, title: 'Quick Booking', desc: 'Book in under 1 minute', color: '#F59E0B' },
            { icon: Shield, title: 'Secure Payment', desc: '100% safe transactions', color: '#10B981' },
            { icon: TrendingUp, title: 'Live Tracking', desc: 'Track your bus location', color: '#3B82F6' },
            { icon: Star, title: 'Top Rated', desc: loadingStats? 'Loading...' : `${stats.rating}★ from ${formatCount(stats.users)} users`, color: '#8B5CF6' },
          ].map((feature, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg p-5">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: `${feature.color}15` }}>
                <feature.icon className="w-5 h-5" style={{ color: feature.color }} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="bg-gray-50 dark:bg-gray-800 border-y border-gray-200 dark:border-gray-700 py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: loadingStats? '...' : formatCount(stats.users), label: 'Happy Travelers' },
              { value: loadingStats? '...' : `${formatCount(stats.bookings)}`, label: 'Bookings Done' },
              { value: loadingStats? '...' : `${formatCount(stats.buses)}`, label: 'Buses Available' },
              { value: loadingStats? '...' : `${stats.rating}★`, label: 'User Rating' },
            ].map((stat, i) => (
              <div key={i}>
                <p className="text-3xl font-bold text-[#0F4C75] mb-1">{stat.value}</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section - DYNAMIC FROM MONGODB */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
            <HelpCircle className="text-[#0F4C75]" /> Frequently Asked Questions
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Quick answers to common questions</p>
        </div>

        {loadingFaqs? (
          <div className="flex justify-center"><Loader className="animate-spin text-[#0F4C75]" /></div>
        ) : homeFaqs.length === 0? (
          <p className="text-center text-gray-500">No FAQs available</p>
        ) : (
          <div className="space-y-4 mb-8">
            {homeFaqs.map((faq) => (
              <div key={faq._id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-md transition">
                <p className="font-semibold text-gray-900 dark:text-white mb-2">{faq.question}</p>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{faq.answer}</p>
              </div>
            ))}
          </div>
        )}

        <div className="text-center">
          <Link to="/faq" className="bg-[#0F4C75] hover:bg-[#0D3D5E] text-white px-8 py-3 rounded-lg font-semibold inline-flex items-center gap-2 transition">
            View All FAQs <ArrowRightLeft className="w-4 h-4 rotate-90" />
          </Link>
        </div>
      </div>

    </div>
  )
}
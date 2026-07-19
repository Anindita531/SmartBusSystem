import { useState, useEffect } from 'react'
import { Quote } from 'lucide-react'
import api from '../api/axios'

const PRIMARY_COLOR = '#0F4C75'

export default function TodaysQuote() {
  const [quote, setQuote] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQuote()
  }, [])

  const fetchQuote = async () => {
    try {
      const res = await api.get('/quotes/today')
      setQuote(res.data.data)
    } catch (err) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading ||!quote) return null

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-8">
      <div className="flex items-start gap-4">
        <Quote className="w-8 h-8 flex-shrink-0 mt-1" style={{ color: PRIMARY_COLOR }} />
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Today's Inspiration</p>
          <p className="text-gray-900 text-lg italic mb-2">"{quote.text}"</p>
          <p className="text-gray-700 text-sm font-medium">— {quote.author}</p>
        </div>
      </div>
    </div>
  )
}
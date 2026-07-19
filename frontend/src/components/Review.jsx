// components/Review.jsx
import { useState } from 'react'
import { Star, X } from 'lucide-react'
import { addReview } from '../api/booking.api'
import toast from 'react-hot-toast'

export default function Review({ booking, onClose, onSuccess }) {
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState('')
  const [hover, setHover] = useState(0)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }
    
    setLoading(true)
    try {
      await addReview(booking._id, { rating, review })
      toast.success('Thank you for your feedback!')
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Rate Your Journey</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-slate-300 text-sm mb-1">{booking.bus.busName}</p>
          <p className="text-slate-400 text-xs">{booking.bus.from} → {booking.bus.to}</p>
          <p className="text-slate-400 text-xs">PNR: {booking.pnr}</p>
        </div>

        <div className="mb-6">
          <p className="text-white font-semibold mb-3 text-center">How was your experience?</p>
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-10 h-10 ${
                    star <= (hover || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-slate-600'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Share your experience (optional)"
            className="w-full bg-slate-700 text-white p-3 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500 resize-none"
            rows="3"
            maxLength="200"
          />
          <p className="text-slate-500 text-xs mt-1 text-right">{review.length}/200</p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || rating === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </div>
  )
}
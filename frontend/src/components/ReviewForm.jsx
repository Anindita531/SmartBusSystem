import { useState } from 'react'
import { Star, X } from 'lucide-react'
import { addReview } from '../api/booking.api'
import toast from 'react-hot-toast'

// 🔥 Theme 1: Corporate Blue | Theme 2: Indigo
const PRIMARY_COLOR = '#0F4C75' // Change to '#3730A3' for Theme 2

const AMENITIES = [
  { key: 'ac', label: 'AC' },
  { key: 'cleanliness', label: 'Cleanliness' },
  { key: 'seat', label: 'Seat Comfort' },
  { key: 'staff', label: 'Staff Behavior' },
  { key: 'wifi', label: 'WiFi' },
  { key: 'charging', label: 'Charging Point' },
  { key: 'punctuality', label: 'On Time' }
]

export default function ReviewForm({ booking, onClose, onSuccess }) {
  const [overallRating, setOverallRating] = useState(0)
  const [amenities, setAmenities] = useState({})
  const [review, setReview] = useState('')
  const [hover, setHover] = useState({ overall: 0, amenities: {} })
  const [loading, setLoading] = useState(false)

  const handleAmenityRating = (key, value) => {
    setAmenities(prev => ({...prev, [key]: value }))
  }

  const handleSubmit = async () => {
    if (overallRating === 0) {
      toast.error('Please give overall rating')
      return
    }

    setLoading(true)
    try {
      await addReview({
        bookingId: booking._id,
        overallRating,
        amenities,
        review
      })
      toast.success('Thank you for your feedback!')
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review')
    } finally {
      setLoading(false)
    }
  }

  const StarRating = ({ value, onChange, onHover, hoverValue }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => onHover(star)}
          onMouseLeave={() => onHover(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`w-6 h-6 ${
              star <= (hoverValue || value)
              ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  )

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 max-w-lg w-full border border-gray-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-2">
          <h2 className="text-xl font-bold text-gray-900">Rate Your Journey</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 p-1">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-4 pb-4 border-b border-gray-200">
          <p className="text-gray-700 text-sm mb-1">{booking.bus.busName}</p>
          <p className="text-gray-600 text-xs">{booking.bus.from} → {booking.bus.to}</p>
          <p className="text-gray-600 text-xs">PNR: {booking.pnr}</p>
        </div>

        <div className="mb-6">
          <p className="text-gray-900 font-semibold mb-3">Rate Amenities</p>
          <div className="space-y-3">
            {AMENITIES.map(({ key, label }) => (
              <div key={key} className="flex justify-between items-center">
                <span className="text-gray-700 text-sm">{label}</span>
                <StarRating
                  value={amenities[key] || 0}
                  onChange={(val) => handleAmenityRating(key, val)}
                  onHover={(val) => setHover(prev => ({
                  ...prev,
                    amenities: {...prev.amenities, [key]: val }
                  }))}
                  hoverValue={hover.amenities[key] || 0}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6 pb-6 border-b border-gray-200">
          <p className="text-gray-900 font-semibold mb-3">Overall Rating</p>
          <div className="flex justify-center">
            <StarRating
              value={overallRating}
              onChange={setOverallRating}
              onHover={(val) => setHover(prev => ({...prev, overall: val }))}
              hoverValue={hover.overall}
            />
          </div>
        </div>

        <div className="mb-6">
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Share your experience (optional)"
            className="w-full bg-white text-gray-900 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder-gray-500"
            rows="3"
            maxLength="500"
          />
          <p className="text-gray-500 text-xs mt-1 text-right">{review.length}/500</p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || overallRating === 0}
          className="w-full text-white py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
          style={{ backgroundColor: PRIMARY_COLOR }}
        >
          {loading? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </div>
  )
}
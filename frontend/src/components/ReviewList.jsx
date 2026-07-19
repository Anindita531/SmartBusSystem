// components/ReviewList.jsx
import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'
import { getBusReviews } from '../api/booking.api'

// 🔥 Theme 1: Corporate Blue | Theme 2: Indigo
const PRIMARY_COLOR = '#0F4C75' // Change to '#3730A3' for Theme 2

export default function ReviewList({ busId }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetchReviews()
  }, [busId, filter])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const res = await getBusReviews(busId, { rating: filter })
      setReviews(res.data.data || [])
      setStats(res.data.stats || null)
    } catch (err) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="text-gray-600 text-center py-8">Loading reviews...</div>

  return (
    <div className="space-y-6">
      {/* Stats Section */}
      {stats && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-4xl font-bold text-gray-900">{stats.averageRating?.toFixed(1)}</div>
            <div>
              <div className="flex gap-1 mb-1">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className={`w-5 h-5 ${i <= Math.round(stats.averageRating)? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                ))}
              </div>
              <p className="text-gray-600 text-sm">{stats.totalReviews} reviews</p>
            </div>
          </div>

          {/* Amenities Breakdown */}
          {stats.amenitiesRating && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-200">
              {Object.entries(stats.amenitiesRating).map(([key, value]) => (
                <div key={key} className="text-sm">
                  <p className="text-gray-600 capitalize">{key}</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-gray-900 font-semibold">{value?.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto">
        {['all', '5', '4', '3', '2', '1'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap font-medium transition-colors ${
              filter === f
               ? 'text-white hover:opacity-90'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={filter === f ? { backgroundColor: PRIMARY_COLOR } : {}}
          >
            {f === 'all'? 'All' : `${f} ⭐`}
          </button>
        ))}
      </div>

      {/* Reviews */}
      {reviews.length === 0? (
        <div className="text-center text-gray-600 py-12 bg-white border border-gray-200 rounded-lg">No reviews yet</div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review._id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-gray-900 font-semibold">{review.user?.name}</p>
                  <div className="flex gap-1 mt-1">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className={`w-4 h-4 ${i <= review.overallRating? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-gray-500 text-xs">
                  {new Date(review.createdAt).toLocaleDateString('en-GB')}
                </p>
              </div>

              {/* Amenities */}
              {review.amenities && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {Object.entries(review.amenities).map(([key, value]) => value && (
                    <span key={key} className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                      {key}: {value}⭐
                    </span>
                  ))}
                </div>
              )}

              {review.review && <p className="text-gray-700 text-sm">{review.review}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
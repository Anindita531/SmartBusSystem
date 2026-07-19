import { Clock, Star, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function BusCard({ bus }) {
  const navigate = useNavigate()
  const isModeA = bus.paymentType === 'pay_after_ride'
  const seatsLeft = bus.totalSeats - bus.bookedSeats
  const isFull = seatsLeft <= 0

  return (
    <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 hover:border-blue-500/50 transition-all group">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h3 className="text-xl font-bold text-white">{bus.busName}</h3>
            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-md">{bus.busType}</span>
            {bus.ac && <Zap className="w-4 h-4 text-yellow-500" />}
            {isModeA && (
              <span className="px-2 py-1 bg-blue-600/20 text-blue-300 text-xs rounded-md border border-blue-500/30">
                Public - Pay Later
              </span>
            )}
          </div>

          <div className="flex items-center gap-6 text-slate-400 flex-wrap">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{bus.departureTime} - {bus.arrivalTime}</span>
            </div>
            <div
              className="flex items-center gap-1 cursor-pointer"
              onClick={() => navigate(`/bus/${bus._id}`)}
            >
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span>{bus.averageRating?.toFixed(1) || '4.0'}</span>
              <span className="text-slate-500 text-xs">({bus.totalReviews || 0})</span>
            </div>
            <span>{bus.duration}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-white">₹{bus.price}</div>
            <div className={`text-sm ${isFull? 'text-red-400 font-bold' : 'text-slate-500'}`}>
              {isFull? 'FULL' : `${seatsLeft} seats left`}
            </div>
            {isModeA &&!isFull && <div className="text-xs text-blue-400">Pay after ride</div>}
          </div>
          <button
            onClick={() =>!isFull && navigate(`/bus/${bus._id}/seats`)}
            disabled={isFull}
            className={`px-6 py-3 rounded-xl font-semibold text-white transition-all ${
              isFull
               ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-500/30 group-hover:scale-105'
            }`}
          >
            {isFull? 'Sold Out' : 'Select Seats'}
          </button>
        </div>
      </div>
    </div>
  )
}
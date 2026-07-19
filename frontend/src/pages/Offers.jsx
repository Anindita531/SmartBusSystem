import { useState, useEffect } from 'react'
import { Tag, Copy, Check, Sparkles } from 'lucide-react'
import { getActiveOffers } from '../api/offer.api' // ✅ API file use করো
import toast from 'react-hot-toast'

export default function Offers() {
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState(null)

  useEffect(() => {
    fetchOffers()
  }, [])

  const fetchOffers = async () => {
    try {
      const res = await getActiveOffers()
      setOffers(res.data.data) // ✅ res.data.data হবে, শুধু data না
    } catch (err) {
      toast.error('Failed to load offers')
    } finally {
      setLoading(false)
    }
  }

  const copyCode = (code) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    toast.success('Code copied!')
    setTimeout(() => setCopiedCode(null), 2000)
  }

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-48 bg-slate-800/40 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-4">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span className="text-blue-400 text-sm font-medium">Exclusive Deals</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-3">Offers & Discounts</h1>
        <p className="text-slate-400">Save big on your next bus journey</p>
      </div>

      {offers.length === 0 ? (
        <div className="text-center py-20">
          <Tag className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">No active offers right now</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => (
            <div
              key={offer._id}
              className="relative bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all group"
            >
              {/* ✅ Banner Image */}
              <img 
                src={offer.image} 
                alt={offer.title}
                className="w-full h-40 object-cover"
              />
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-blue-500/10 rounded-xl">
                    <Tag className="w-6 h-6 text-blue-400" />
                  </div>
                  {offer.priority > 5 && (
                    <span className="px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full">
                      HOT
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{offer.title}</h3>
                <p className="text-slate-400 text-sm mb-4">{offer.description}</p>

                {/* ✅ Discount Text show করো */}
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-green-500/20 text-green-400 text-sm font-semibold rounded-lg">
                    {offer.discountText}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl mb-4">
                  <div>
                    <p className="text-slate-500 text-xs mb-1">Use Code</p>
                    <p className="text-blue-400 font-mono font-bold text-lg">{offer.couponCode}</p> {/* ✅ couponCode */}
                  </div>
                  <button
                    onClick={() => copyCode(offer.couponCode)} // ✅ couponCode
                    className="p-2.5 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-all"
                  >
                    {copiedCode === offer.couponCode ? (
                      <Check className="w-5 h-5 text-green-400" />
                    ) : (
                      <Copy className="w-5 h-5 text-blue-400" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-end text-xs">
                  <span className="text-slate-500">
                    Valid till {new Date(offer.validTill).toLocaleDateString('en-IN', { 
                      day: 'numeric', 
                      month: 'short' 
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
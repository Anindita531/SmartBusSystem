import { useState, useEffect } from 'react'
import { getActiveOffers, createOffer, deleteOffer } from '../../api/offer.api'
import { getAllCoupons } from '../../api/coupon.api'
import toast from 'react-hot-toast'
import { Plus, Trash2 } from 'lucide-react'

// 🔥 Theme 1: Corporate Blue | Theme 2: Indigo
const PRIMARY_COLOR = '#0F4C75' // Change to '#3730A3' for Theme 2

export default function AdminOffers() {
  const [offers, setOffers] = useState([])
  const [coupons, setCoupons] = useState([])
  const [form, setForm] = useState({
    title: '',
    description: '',
    image: '',
    couponCode: '',
    discountText: '',
    validFrom: '',
    validTill: '',
    priority: 0
  })

  useEffect(() => {
    fetchOffers()
    fetchCoupons()
  }, [])

  const fetchOffers = async () => {
    const res = await getActiveOffers()
    setOffers(res.data.data)
  }

  const fetchCoupons = async () => {
    const res = await getAllCoupons()
    setCoupons(res.data.data)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await createOffer(form)
      toast.success('Offer created!')
      setForm({
        title: '',
        description: '',
        image: '',
        couponCode: '',
        discountText: '',
        validFrom: '',
        validTill: '',
        priority: 0
      })
      fetchOffers()
    } catch (err) {
      toast.error(err.response?.data?.message)
    }
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Manage Offers</h1>

        {/* Create Form */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Offer</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <input
              placeholder="Offer Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <input
              placeholder="Banner Image URL"
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              required
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              className="col-span-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            
            {/* ✅ Coupon Dropdown */}
            <select
              value={form.couponCode}
              onChange={(e) => setForm({ ...form, couponCode: e.target.value })}
              required
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select Coupon</option>
              {coupons.map(c => (
                <option key={c._id} value={c.code}>
                  {c.code} - {c.discountType === 'flat' ? `₹${c.discountValue}` : `${c.discountValue}%`}
                </option>
              ))}
            </select>

            <input
              placeholder="Discount Text (e.g. Flat ₹50 off)"
              value={form.discountText}
              onChange={(e) => setForm({ ...form, discountText: e.target.value })}
              required
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <input
              type="date"
              value={form.validFrom}
              onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
              required
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <input
              type="date"
              value={form.validTill}
              onChange={(e) => setForm({ ...form, validTill: e.target.value })}
              required
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="col-span-2 py-3 rounded-lg text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              <Plus className="w-5 h-5" /> Create Offer
            </button>
          </form>
        </div>

        {/* Offer List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {offers.map(offer => (
            <div key={offer._id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-all">
              <img src={offer.image} className="w-full h-40 object-cover" />
              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-900">{offer.title}</h3>
                <p className="text-gray-600 text-sm mt-1">{offer.description}</p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-green-600 font-bold">{offer.discountText}</span>
                  <button
                    onClick={() => deleteOffer(offer._id).then(() => fetchOffers())}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-gray-500 text-xs mt-2">Code: {offer.couponCode}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
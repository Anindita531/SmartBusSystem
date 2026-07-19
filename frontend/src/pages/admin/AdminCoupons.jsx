import { useState, useEffect } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

// 🔥 Theme 1: Corporate Blue | Theme 2: Indigo
const PRIMARY_COLOR = '#0F4C75' // Change to '#3730A3' for Theme 2

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([])
  const [form, setForm] = useState({
    code: '',
    discountType: 'flat',
    discountValue: '',
    minAmount: 0,
    maxDiscount: '',
    validFrom: '',
    validTill: '',
    usageLimit: 1000
  })

  const fetchCoupons = async () => {
    try {
      const res = await api.get('/coupon/admin/all')
      setCoupons(res.data.data)
    } catch (err) {
      toast.error('Failed to load coupons')
    }
  }

  useEffect(() => { fetchCoupons() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/coupon/admin/create', form)
      toast.success('Coupon created!')
      setForm({
        code: '',
        discountType: 'flat',
        discountValue: '',
        minAmount: 0,
        maxDiscount: '',
        validFrom: '',
        validTill: '',
        usageLimit: 1000
      })
      fetchCoupons()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create')
    }
  }

  const toggleStatus = async (id) => {
    try {
      await api.patch(`/coupon/admin/toggle/${id}`)
      toast.success('Status updated')
      fetchCoupons()
    } catch (err) {
      toast.error('Failed')
    }
  }

  const deleteCoupon = async (id) => {
    if (!confirm('Delete this coupon?')) return
    try {
      await api.delete(`/coupon/admin/delete/${id}`)
      toast.success('Deleted')
      fetchCoupons()
    } catch (err) {
      toast.error('Failed')
    }
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Manage Coupons</h1>

        {/* Create Form */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Coupon</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <input
              placeholder="Coupon Code (e.g. SAVE50)"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              required
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <select
              value={form.discountType}
              onChange={(e) => setForm({ ...form, discountType: e.target.value })}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="flat">Flat Amount</option>
              <option value="percentage">Percentage</option>
            </select>
            <input
              type="number"
              placeholder="Discount Value"
              value={form.discountValue}
              onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
              required
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Min Amount"
              value={form.minAmount}
              onChange={(e) => setForm({ ...form, minAmount: e.target.value })}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            {form.discountType === 'percentage' && (
              <input
                type="number"
                placeholder="Max Discount (for %)"
                value={form.maxDiscount}
                onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            )}
            <input
              type="date"
              placeholder="Valid From"
              value={form.validFrom}
              onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
              required
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <input
              type="date"
              placeholder="Valid Till"
              value={form.validTill}
              onChange={(e) => setForm({ ...form, validTill: e.target.value })}
              required
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Usage Limit"
              value={form.usageLimit}
              onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="col-span-2 py-3 rounded-lg text-white font-semibold hover:opacity-90"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              Create Coupon
            </button>
          </form>
        </div>

        {/* Coupon List */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">All Coupons</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 px-4 text-gray-600 text-sm">Code</th>
                  <th className="py-3 px-4 text-gray-600 text-sm">Discount</th>
                  <th className="py-3 px-4 text-gray-600 text-sm">Used</th>
                  <th className="py-3 px-4 text-gray-600 text-sm">Valid Till</th>
                  <th className="py-3 px-4 text-gray-600 text-sm">Status</th>
                  <th className="py-3 px-4 text-gray-600 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map(coupon => (
                  <tr key={coupon._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900 font-mono">{coupon.code}</td>
                    <td className="py-3 px-4 text-gray-900">
                      {coupon.discountType === 'flat' 
                        ? `₹${coupon.discountValue}` 
                        : `${coupon.discountValue}%`}
                    </td>
                    <td className="py-3 px-4 text-gray-900">
                      {coupon.usedCount}/{coupon.usageLimit}
                    </td>
                    <td className="py-3 px-4 text-gray-900">
                      {new Date(coupon.validTill).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                        coupon.isActive 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 flex gap-2">
                      <button
                        onClick={() => toggleStatus(coupon._id)}
                        className="px-3 py-1 text-white rounded text-sm hover:opacity-90"
                        style={{ backgroundColor: PRIMARY_COLOR }}
                      >
                        Toggle
                      </button>
                      <button
                        onClick={() => deleteCoupon(coupon._id)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
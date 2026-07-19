import Coupon from '../models/Coupon.js'
import { successResponse, errorResponse } from '../utils/response.utils.js'

export const validateCoupon = async (req, res) => {
  try {
    const { code, amount } = req.body
    const userId = req.user._id // ✅ User ID নাও
    
    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase(),
      isActive: true,
      validFrom: { $lte: new Date() },
      validTill: { $gte: new Date() }
    })

    if (!coupon) return errorResponse(res, 404, 'Invalid or expired coupon')
    if (coupon.usedCount >= coupon.usageLimit) return errorResponse(res, 400, 'Coupon usage limit exceeded')
    if (amount < coupon.minAmount) return errorResponse(res, 400, `Minimum amount ₹${coupon.minAmount} required`)

    // ✅ এই check টা add করো - Same user আগে use করেছে কিনা
    const userUsageCount = coupon.usedByUsers.filter(u => u.userId.toString() === userId.toString()).length
    if (userUsageCount >= coupon.perUserLimit) {
      return errorResponse(res, 400, `You can use this coupon only ${coupon.perUserLimit} time(s)`)
    }

    let discount = 0
    if (coupon.discountType === 'percentage') {
      discount = (amount * coupon.discountValue) / 100
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount)
    } else {
      discount = coupon.discountValue
    }

    discount = Math.round(discount)
    const finalAmount = amount - discount

    successResponse(res, {
      couponId: coupon._id,
      code: coupon.code,
      discount,
      finalAmount,
      discountType: coupon.discountType
    })
  } catch (err) {
    errorResponse(res, 500, err.message)
  }
}
// ✅ Admin: সব coupon দেখো
export const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 })
    successResponse(res, coupons)
  } catch (err) {
    errorResponse(res, 500, err.message)
  }
}

// ✅ Admin: নতুন coupon বানাও
export const createCoupon = async (req, res) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      minAmount,
      maxDiscount,
      validFrom,
      validTill,
      usageLimit,
      perUserLimit // ✅ এটা req.body থেকে নাও
    } = req.body

    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() })
    if (existingCoupon) {
      return errorResponse(res, 400, 'Coupon code already exists')
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      minAmount: minAmount || 0,
      maxDiscount,
      validFrom,
      validTill,
      usageLimit: usageLimit || 1000,
      usedCount: 0,
      isActive: true,
      perUserLimit: perUserLimit || 1, // ✅ Default 1 বার
      usedByUsers: [] // ✅ Empty array দিয়ে init করো
    })

    successResponse(res, coupon, 'Coupon created successfully')
  } catch (err) {
    errorResponse(res, 500, err.message)
  }
}

// ✅ Admin: Coupon active/inactive করো
export const toggleCouponStatus = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id)
    if (!coupon) return errorResponse(res, 404, 'Coupon not found')

    coupon.isActive = !coupon.isActive
    await coupon.save()

    successResponse(res, coupon, `Coupon ${coupon.isActive ? 'activated' : 'deactivated'}`)
  } catch (err) {
    errorResponse(res, 500, err.message)
  }
}

// ✅ Admin: Coupon delete করো
export const deleteCoupon = async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id)
    successResponse(res, null, 'Coupon deleted')
  } catch (err) {
    errorResponse(res, 500, err.message)
  }
}
import api from './axios'

// User: Validate & Apply Coupon
export const validateCoupon = (data) => 
  api.post('/coupon/validate', data)

// ✅ Alias add করো - PassengerInfo তে applyCoupon use করছো
export const applyCoupon = validateCoupon

// Admin: Get All Coupons
export const getAllCoupons = () => 
  api.get('/coupon/admin/all')

// Admin: Create Coupon
export const createCoupon = (data) => 
  api.post('/coupon/admin/create', data)

// Admin: Toggle Coupon Status
export const toggleCouponStatus = (id) => 
  api.patch(`/coupon/admin/toggle/${id}`)

// Admin: Delete Coupon
export const deleteCoupon = (id) => 
  api.delete(`/coupon/admin/delete/${id}`)
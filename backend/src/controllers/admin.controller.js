import bcrypt from 'bcryptjs'
import Booking from '../models/Booking.js'
import Bus from '../models/Bus.js'
import User from '../models/User.js'
import Coupon from '../models/Coupon.js'
import Offer from '../models/Offer.js' // ✅ Add করো
import { successResponse, errorResponse } from '../utils/response.utils.js'
import IssueReport from '../models/IssueReport.js'

export const getDashboardStats = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments({
      status: { $in: ['Confirmed', 'Boarded', 'Completed'] }
    })

    const totalRevenue = await Booking.aggregate([
      {
        $match: {
          status: { $in: ['Confirmed', 'Boarded', 'Completed'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ])

    const totalBuses = await Bus.countDocuments()
    const totalUsers = await User.countDocuments({ role: 'user' })
    const totalAdmins = await User.countDocuments({ role: 'admin' })
    const activeCoupons = await Coupon.countDocuments({ isActive: true })

    // ✅ Offer count add করো
    const activeOffers = await Offer.countDocuments({
      isActive: true,
      validTill: { $gte: new Date() }
    })

    const pendingFineDisputes = await Booking.countDocuments({
      fineDisputed: true,
      fineDisputeStatus: 'pending'
    })

    successResponse(res, {
      totalBookings,
      totalRevenue: totalRevenue[0]?.total || 0,
      totalBuses,
      totalUsers,
      totalAdmins,
      activeCoupons,
      activeOffers, // ✅ Add করো
      pendingFineDisputes
    }, 'Stats fetched successfully')
  } catch (err) {
    console.error('Stats Error:', err)
    errorResponse(res, 500, err.message)
  }
}

//... বাকি সব function same
export const getSalesData = async (req, res) => {
  try {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const salesData = await Booking.aggregate([
      {
        $match: {
          status: { $in: ['Confirmed', 'Boarded', 'Completed'] }, // ✅ Fix: শুধু Confirmed না
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalSales: { $sum: '$totalAmount' },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])

    const filledData = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const found = salesData.find(d => d._id === dateStr)
      filledData.push({
        date: dateStr,
        totalSales: found?.totalSales || 0,
        bookings: found?.bookings || 0
      })
    }

    successResponse(res, filledData, 'Sales data fetched')
  } catch (err) {
    errorResponse(res, 500, err.message)
  }
}

export const getAllBookings = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, pnr, refundStatus } = req.query
    const filter = {}

    if (status && status!== 'all') filter.status = status
    if (pnr) filter.pnr = { $regex: pnr, $options: 'i' }
    if (refundStatus && refundStatus!== 'all') filter.refundStatus = refundStatus

    const bookings = await Booking.find(filter)
     .populate('bus user', '-password')
     .sort({ createdAt: -1 })
     .limit(limit * 1)
     .skip((page - 1) * limit)
     .lean()

    const total = await Booking.countDocuments(filter)

    successResponse(res, {
      bookings,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total
    }, 'All bookings fetched')
  } catch (err) {
    errorResponse(res, 500, err.message)
  }
}

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
     .select('-password')
     .sort({ createdAt: -1 })
     .lean()

    successResponse(res, users, 'Users fetched')
  } catch (err) {
    errorResponse(res, 500, err.message)
  }
}

export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params
    const { role } = req.body

    if (!['user', 'admin', 'conductor', 'driver'].includes(role)) {
      return errorResponse(res, 400, 'Invalid role')
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('-password')

    if (!user) return errorResponse(res, 404, 'User not found')
    successResponse(res, user, 'Role updated successfully')
  } catch (err) {
    errorResponse(res, 500, err.message)
  }
}

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params
    const user = await User.findByIdAndDelete(userId)
    if (!user) return errorResponse(res, 404, 'User not found')
    successResponse(res, null, 'User deleted successfully')
  } catch (err) {
    errorResponse(res, 500, err.message)
  }
}

export const getRefundReport = async (req, res) => {
  try {
    const { refundStatus } = req.query

    const filter = { status: 'Cancelled' }
    if (refundStatus && refundStatus!== 'all') {
      filter.refundStatus = refundStatus
    }

    const bookings = await Booking.find(filter)
     .populate('user', 'name email phone')
     .populate('bus', 'busName busNumber from to')
     .sort({ cancelledAt: -1 })
     .lean()

    const stats = await Booking.aggregate([
      { $match: { status: 'Cancelled' } },
      { $group: {
          _id: '$refundStatus',
          count: { $sum: 1 },
          totalRefundAmount: { $sum: '$refundAmount' }
      }}
    ])

    successResponse(res, {
      bookings,
      stats,
      total: bookings.length
    }, 'Refund report fetched')
  } catch (err) {
    errorResponse(res, 500, err.message)
  }
}

export const createStaff = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body

    if (!name ||!email ||!phone ||!password ||!role) {
      return errorResponse(res, 400, 'All fields required')
    }

    if (!['driver', 'conductor'].includes(role)) {
      return errorResponse(res, 400, 'Invalid role')
    }

    const existing = await User.findOne({ email })
    if (existing) {
      return errorResponse(res, 400, 'Email already exists')
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role
    })

    successResponse(res, user, `${role} created successfully`)
  } catch (err) {
    console.log('Create staff error:', err)
    errorResponse(res, 500, err.message)
  }
}
export const getFineDisputes = async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query

    const filter = { fineDisputed: true }
    if (status !== 'all') {
      filter.fineDisputeStatus = status
    }

    const disputes = await Booking.find(filter)
      .populate('user', 'name email phone')
      .populate('bus', 'busName busNumber from to')
      .populate('fineDisputeResolvedBy', 'name email')
      .populate('fineIssuedBy', 'name')
      .sort({ fineDisputedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean()

    // ✅ IssueReport থেকে proof বের কর - issueType 'fine_dispute' বা 'other' দুইটাই check কর
    const disputesWithProof = await Promise.all(
      disputes.map(async (dispute) => {
        const issue = await IssueReport.findOne({ 
          bookingId: dispute.pnr,
          issueType: { $in: ['fine_dispute', 'other'] } // ✅ দুইটাই check কর
        }).sort({ createdAt: -1 }).lean()
        
        console.log('Found issue for PNR', dispute.pnr, ':', issue?.proofUrl)
        
        return {
          ...dispute,
          fineDisputeProof: issue?.proofUrl || null,
          fineDisputeProofUploadedAt: issue?.createdAt || null
        }
      })
    )

    successResponse(res, disputesWithProof, 'Fine disputes fetched')
  } catch (err) {
    console.error('Get disputes error:', err)
    errorResponse(res, 500, err.message)
  }
}
// ✅ একটাই investigateDispute রাখ
export const investigateDispute = async (req, res) => {
  try {
    const { bookingId } = req.params
    const booking = await Booking.findById(bookingId)
      .populate('user', 'name email phone')
      .populate('fineIssuedBy', 'name')
      .populate('bus', 'busName busNumber')

    if (!booking) return errorResponse(res, 404, 'Booking not found')

    // Conductor dispute rate
    const conductorDisputes = await Booking.countDocuments({
      fineIssuedBy: booking.fineIssuedBy?._id,
      fineDisputed: true
    })
    const conductorTotalFines = await Booking.countDocuments({
      fineIssuedBy: booking.fineIssuedBy?._id,
      fineAmount: { $gt: 0 }
    })
    const conductorDisputeRate = conductorTotalFines > 0
      ? ((conductorDisputes / conductorTotalFines) * 100).toFixed(1) + '%'
      : '0%'

    // Passenger past disputes
    const passengerPastDisputes = await Booking.countDocuments({
      user: booking.user._id,
      fineDisputed: true,
      _id: { $ne: booking._id }
    })

    // Auto suggestion logic
    let suggestion = 'REVIEW_MANUALLY'
    if (!booking.fineDisputeProof) {
      suggestion = 'REJECT'
    } else if (parseFloat(conductorDisputeRate) > 30) {
      suggestion = 'APPROVE_REFUND'
    } else if (passengerPastDisputes > 3) {
      suggestion = 'REJECT'
    }

    successResponse(res, {
      investigation: {
        conductorDisputeRate,
        passengerPastDisputes,
        conductorName: booking.fineIssuedBy?.name || 'Unknown',
        routeValidation: 'Valid',
        suggestion
      }
    }, 'Investigation data fetched')
  } catch (err) {
    errorResponse(res, 500, err.message)
  }
}

// ✅ একটাই resolveFineDispute রাখ
export const resolveFineDispute = async (req, res) => {
  try {
    const { action, resolution, refundAmount, adminNotes } = req.body

    const booking = await Booking.findById(req.params.id)
    if (!booking) return errorResponse(res, 404, 'Booking not found')

    booking.fineDisputeStatus = action
    booking.fineDisputeResolution = resolution
    booking.fineDisputeAdminNotes = adminNotes
    booking.fineDisputeResolvedAt = new Date()
    booking.fineDisputeResolvedBy = req.user.id

    if (action === 'resolved') {
      booking.fineDisputeRefund = Number(refundAmount) || 0
      booking.fineStatus = 'none' // Fine cancel
      // Refund to wallet
      if (refundAmount > 0) {
        await User.findByIdAndUpdate(booking.user, {
          $inc: { walletBalance: Number(refundAmount) }
        })
      }
    }

    await booking.save()
    successResponse(res, booking, 'Dispute resolved successfully')
  } catch (err) {
    errorResponse(res, 500, err.message)
  }
}
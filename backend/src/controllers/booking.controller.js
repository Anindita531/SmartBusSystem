import mongoose from 'mongoose'
import Booking from '../models/Booking.js'
import Bus from '../models/Bus.js'
import SeatLock from '../models/SeatLock.js'
import Coupon from '../models/Coupon.js'
import Waitlist from '../models/Waitlist.js'
import ConductorAssignment from '../models/ConductorAssignment.js'
import { successResponse, errorResponse } from '../utils/response.utils.js'
import { sendTicketEmail } from '../utils/mailer.js'
import calculateStageFare from '../utils/fareCalculator.js'
import Stripe from 'stripe'
import { createNotification } from './notification.controller.js'
import IssueReport from '../models/IssueReport.js'
import { verifyExitCode } from '../utils/exitCode.utils.js';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const generatePNR = () => {
  return 'SBS' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 100)
}

const getJourneyDateTime = (journeyDate, departureTime) => {
  const date = new Date(journeyDate)
  const [hours, minutes] = departureTime.split(':')
  date.setHours(parseInt(hours), parseInt(minutes), 0, 0)
  return date
}
export const createBooking = async (req, res) => {
  try {
    const { busId, journeyDate, seats, passengerDetails, boardingPoint, droppingPoint, couponCode } = req.body
    const userId = req.user._id

    if (!busId || !seats?.length || !passengerDetails?.length) {
      return errorResponse(res, 400, 'Missing required fields')
    }

    if (seats.length !== passengerDetails.length) {
      return errorResponse(res, 400, 'Seat count and passenger count mismatch')
    }

    const bus = await Bus.findById(busId)
    if (!bus) return errorResponse(res, 404, 'Bus not found')

    if (!bus.mode) bus.mode = 'B'
    if (!bus.paymentType) {
      bus.paymentType = bus.mode === 'A' ? 'pay_after_ride' : 'prepay'
    }
    if (!bus.upiId) bus.upiId = 'owner@upi'

    const now = new Date()

    // 1. Check if other user has locked these seats
    const activeLocks = await SeatLock.find({
      busId,
      seatNumber: { $in: seats },
      userId: { $ne: userId },
      expiresAt: { $gt: now }
    })

    if (activeLocks.length > 0) {
      return errorResponse(res, 409, `Seat ${activeLocks[0].seatNumber} is locked by another user`)
    }

    // 2. Check if already booked - FIXED for Mode A
    const bookings = await Booking.find({
      bus: busId,
      journeyDate: bus.journeyDate,
      $or: [
        { status: 'Completed', paymentStatus: 'Paid' }, // Mode A paid
        { status: 'Confirmed', paymentType: 'prepay' }  // Mode B confirmed
      ]
    })
    const bookedSeats = bookings.flatMap(b => b.seats)

    for (const seat of seats) {
      if (bookedSeats.includes(seat)) {
        return errorResponse(res, 409, `Seat ${seat} is already booked`)
      }
    }

    if (bus.bookedSeats.length + seats.length > bus.totalSeats) {
      return errorResponse(res, 400, 'Bus Full. All seats booked.')
    }

    const finalBoardingPoint = boardingPoint || bus.from
    const finalDroppingPoint = droppingPoint || bus.to

    let fareData
    try {
      fareData = calculateStageFare(bus, finalBoardingPoint, finalDroppingPoint)
    } catch (err) {
      return errorResponse(res, 400, err.message)
    }

    const baseFare = fareData.fare * seats.length
    let totalAmount = baseFare
    let discount = 0
    let finalCouponCode = null
    let couponDoc = null

    if (couponCode) {
      couponDoc = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
        validFrom: { $lte: new Date() },
        validTill: { $gte: new Date() }
      })

      if (!couponDoc) {
        return errorResponse(res, 404, 'Invalid or expired coupon')
      }

      if (couponDoc.usedCount >= couponDoc.usageLimit) {
        return errorResponse(res, 400, 'Coupon usage limit exceeded')
      }

      const userUsedCount = couponDoc.usedByUsers.filter(
        u => u.userId.toString() === userId.toString()
      ).length

      if (userUsedCount >= couponDoc.perUserLimit) {
        return errorResponse(res, 400, `You can use this coupon only ${couponDoc.perUserLimit} time(s)`)
      }

      if (couponDoc.discountType === 'percentage') {
        discount = (totalAmount * couponDoc.discountValue) / 100
        if (couponDoc.maxDiscount) {
          discount = Math.min(discount, couponDoc.maxDiscount)
        }
      } else {
        discount = couponDoc.discountValue
      }

      discount = Math.round(discount)
      finalCouponCode = couponDoc.code
    }

    const pnr = generatePNR()

    // ✅ MODE A: Pay After Ride - Direct Confirm, NO exit code yet
    if (bus.mode === 'A' || bus.paymentType === 'pay_after_ride') {
      const booking = await Booking.create({
        user: userId,
        bus: busId,
        journeyDate: bus.journeyDate,
        boardingPoint: finalBoardingPoint,
        droppingPoint: finalDroppingPoint,
        boardingCheckpointOrder: fareData.boardingOrder,
        droppingCheckpointOrder: fareData.droppingOrder,
        distance: fareData.distance,
        seats,
        passengerDetails,
        totalAmount: totalAmount - discount,
        discount,
        couponCode: finalCouponCode,
        pnr,
        status: 'Confirmed',
        paymentType: 'pay_after_ride',
        paymentStatus: 'Pending',
        upiId: bus.upiId
        // exitCode and exitCodeExpiresAt will be set in processPayment/payOnExit
      })

      if (couponDoc) {
        await Coupon.findByIdAndUpdate(couponDoc._id, {
          $inc: { usedCount: 1 },
          $push: {
            usedByUsers: {
              userId,
              usedAt: new Date(),
              bookingId: booking._id
            }
          }
        })
      }

      // Remove user's locks after booking confirmed
      await SeatLock.deleteMany({
        busId,
        userId,
        seatNumber: { $in: seats }
      })

      return successResponse(res, booking, 'Seat Booked! Pay when you exit the bus')
    }

    // ✅ MODE B: Prepay - Stripe Checkout Session
    const booking = await Booking.create({
      user: userId,
      bus: busId,
      journeyDate: bus.journeyDate,
      boardingPoint: finalBoardingPoint,
      droppingPoint: finalDroppingPoint,
      boardingCheckpointOrder: fareData.boardingOrder,
      droppingCheckpointOrder: fareData.droppingOrder,
      distance: fareData.distance,
      seats,
      passengerDetails,
      totalAmount: totalAmount - discount,
      discount,
      couponCode: finalCouponCode,
      pnr,
      status: 'Pending',
      paymentType: 'prepay',
      paymentStatus: 'Pending'
    })

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'inr',
          product_data: { name: `SmartBus ${bus.busName}` },
          unit_amount: Math.round((totalAmount - discount) * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/ticket/${booking._id}`,
      cancel_url: `${process.env.FRONTEND_URL}/bookings`,
      metadata: { bookingId: booking._id.toString() }
    })

    booking.paymentId = session.id
    await booking.save()

    return successResponse(res, {
      booking,
      checkoutUrl: session.url
    }, 'Payment required')

  } catch (err) {
    console.log('CREATE BOOKING ERROR:', err)
    return errorResponse(res, 500, err.message)
  }
}
export const lockSeats = async (req, res) => {
  try {
    const { busId } = req.params
    let { seats, boardingPoint, droppingPoint } = req.body
    const userId = req.user._id

    const bus = await Bus.findById(busId)
    if (!bus) return errorResponse(res, 404, 'Bus not found')

    if (!boardingPoint) boardingPoint = bus.from
    if (!droppingPoint) droppingPoint = bus.to

    const fareData = calculateStageFare(bus, boardingPoint, droppingPoint)
    const seatPrice = fareData.fare

    const myWaitlist = await Waitlist.findOne({
      userId,
      busId,
      journeyDate: bus.journeyDate,
      notified: true,
      expiresAt: { $gt: new Date() }
    })

    const othersWaitlist = await Waitlist.findOne({
      busId,
      journeyDate: bus.journeyDate,
      notified: true,
      expiresAt: { $gt: new Date() },
      userId: { $ne: userId }
    })

    if (othersWaitlist && !myWaitlist) {
      return errorResponse(res, 400, 'Seats are reserved for waitlisted users. Join waitlist first.')
    }

    // FIXED: Only count paid bookings as booked
    const bookings = await Booking.find({
      bus: busId,
      journeyDate: bus.journeyDate,
      $or: [
        { status: 'Completed', paymentStatus: 'Paid' },
        { status: 'Confirmed', paymentType: 'prepay' }
      ]
    })
    const bookedSeats = bookings.flatMap(b => b.seats)

    const existingLocks = await SeatLock.find({
      busId,
      seatNumber: { $in: seats },
      userId: { $ne: userId },
      expiresAt: { $gt: new Date() }
    })

    const lockedByOthers = existingLocks.map(l => l.seatNumber)
    const alreadyBooked = seats.filter(s => bookedSeats.includes(s))
    const unavailable = [...new Set([...lockedByOthers, ...alreadyBooked])]
    const availableSeats = seats.filter(s => !unavailable.includes(s))

    if (availableSeats.length === 0) {
      return errorResponse(res, 400, 'All selected seats are unavailable')
    }

    await SeatLock.deleteMany({ busId, userId })

    const expiresAt = new Date(Date.now() + 20 * 60 * 1000)
    const locks = availableSeats.map(seatNumber => ({
      busId,
      userId,
      seatNumber,
      price: seatPrice,
      expiresAt
    }))

    await SeatLock.insertMany(locks)

    if (myWaitlist) {
      await Waitlist.deleteOne({ _id: myWaitlist._id })
    }

    successResponse(res, {
      locked: availableSeats,
      failed: unavailable,
      expiresAt,
      pricePerSeat: seatPrice
    }, `${availableSeats.length} seats locked`)
  } catch (err) {
    console.log('LOCK ERROR:', err)
    errorResponse(res, 500, err.message)
  }
}
export const getMyBookings = async (req, res) => {
  try {
    console.log('=== GET MY BOOKINGS DEBUG ===')
    console.log('User ID:', req.user._id) 
    console.log('Query params:', req.query) 
    
    const { page = 1, limit = 10, status, pnr, date } = req.query
    const filter = { user: req.user._id }

    if (status && status !== 'all') filter.status = status
    if (pnr) filter.pnr = { $regex: pnr, $options: 'i' }

    if (date) {
      const start = new Date(date)
      const end = new Date(date)
      end.setHours(23, 59, 999)
      filter.journeyDate = { $gte: start, $lte: end }
    }

    console.log('Final Mongo Filter:', JSON.stringify(filter))

    const bookings = await Booking.find(filter)
      .populate('bus', 'busName from to departureTime arrivalTime journeyDate price checkpoints')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean()

    console.log('Bookings found in DB:', bookings.length)

    const count = await Booking.countDocuments(filter)

    successResponse(res, {
      data: bookings,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      total: count
    })
  } catch (err) {
    console.log('Get bookings error:', err)
    errorResponse(res, 500, err.message)
  }
}
export const verifyBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({ pnr: req.params.pnr })
      .populate('bus user', '-password')
      .lean()

    if (!booking) {
      return errorResponse(res, 404, 'Invalid PNR')
    }

    if (booking.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Ticket is Cancelled',
        data: booking
      })
    }

    if (booking.status === 'Expired') {
      return res.status(400).json({
        success: false,
        message: 'Ticket has Expired',
        data: booking
      })
    }

    if (booking.status === 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Ticket already used',
        data: booking
      })
    }

    if (booking.status === 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed',
        data: booking
      })
    }

    const journeyDateTime = getJourneyDateTime(booking.journeyDate, booking.bus.departureTime)
    if (journeyDateTime < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Journey date has passed',
        data: booking
      })
    }

    successResponse(res, booking, 'Valid ticket')
  } catch (err) {
    errorResponse(res, 500, err.message)
  }
}
// controllers/payment.controller.js বা booking.controller.js

export const confirmPayment = async (req, res) => {
  try {
    const { bookingId } = req.params
    const { paymentIntentId } = req.body

    const booking = await Booking.findById(bookingId).populate('bus')
    if (!booking) return errorResponse(res, 404, 'Booking not found')
    if (booking.status !== 'Pending') return errorResponse(res, 400, 'Booking already processed')

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    if (paymentIntent.status !== 'succeeded') {
      return errorResponse(res, 400, 'Payment not successful')
    }

    // Coupon count
    if (booking.couponCode) {
      await Coupon.findOneAndUpdate(
        { code: booking.couponCode },
        {
          $inc: { usedCount: 1 },
          $push: {
            usedByUsers: {
              userId: booking.user,
              usedAt: new Date(),
              bookingId: booking._id
            }
          }
        }
      )
    }

    const bus = booking.bus
    bus.bookedSeats.push(...booking.seats)
    bus.availableSeats = bus.totalSeats - bus.bookedSeats.length
    await bus.save()

    booking.status = 'Confirmed'
    booking.paymentId = paymentIntentId
    booking.paymentStatus = 'Paid'
    booking.paidAt = new Date()

    // ✅ Pay after ride hole exit code generate koro
    if (booking.paymentType === 'pay_after_ride') {
      booking.exitCode = generateExitCode(booking._id.toString())
      booking.exitCodeExpiresAt = new Date(Date.now() + 2 * 60 * 1000) // 2 min
    }

    await booking.save()

    successResponse(res, booking, 'Payment confirmed')
  } catch (err) {
    console.log('Confirm payment error:', err)
    errorResponse(res, 500, err.message)
  }
}
export const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params
    const booking = await Booking.findById(bookingId).populate('bus user')

    if (!booking) return errorResponse(res, 404, 'Booking not found')
    if (booking.user._id.toString() !== req.user._id.toString())
      return errorResponse(res, 403, 'Not authorized')
    if (booking.status !== 'Confirmed')
      return errorResponse(res, 400, 'Only confirmed bookings can be cancelled')

    const journeyDateTime = getJourneyDateTime(booking.journeyDate, booking.bus.departureTime)
    const hoursLeft = (journeyDateTime - new Date()) / (1000 * 60 * 60)

    if (hoursLeft < 2) {
      return errorResponse(res, 400, 'Cannot cancel within 2 hours of journey')
    }

    let refundAmount = 0
    let refundStatus = 'Not Required'

    if (booking.paymentId && booking.paymentId !== 'manual') {
      if (hoursLeft > 24) {
        refundAmount = booking.totalAmount * 0.9
        refundStatus = 'Pending'
      } else if (hoursLeft > 12) {
        refundAmount = booking.totalAmount * 0.5
        refundStatus = 'Pending'
      } else if (hoursLeft >= 2) {
        refundAmount = booking.totalAmount * 0.25
        refundStatus = 'Pending'
      }
    }

    booking.status = 'Cancelled'
    booking.refundStatus = refundStatus
    booking.refundAmount = refundAmount
    booking.cancelledAt = new Date()
    await booking.save()

    await Bus.findByIdAndUpdate(booking.bus._id, {
      $pull: { bookedSeats: { $in: booking.seats } },
      $inc: { availableSeats: booking.seats.length }
    })

    if (refundAmount > 0 && booking.paymentId && booking.paymentId !== 'manual') {
      try {
        booking.refundStatus = 'Processing'
        await booking.save()

        const refund = await stripe.refunds.create({
          payment_intent: booking.paymentId,
          amount: Math.round(refundAmount * 100),
          reason: 'requested_by_customer'
        })

        booking.refundStatus = 'Completed'
        booking.refundDate = new Date()
        booking.refundTransactionId = refund.id
        await booking.save()
      } catch (refundErr) {
        console.log('Refund Failed:', refundErr.message)
        booking.refundStatus = 'Failed'
        await booking.save()
      }
    }

    await sendTicketEmail(booking.user.email, booking, 'cancelled').catch(err => {
      console.log('Cancel mail error:', err.message)
    })

    successResponse(res, booking, `Booking cancelled. Refund: ₹${refundAmount}`)
  } catch (err) {
    console.log('Cancel Error:', err)
    errorResponse(res, 500, err.message)
  }
}

export const addReview = async (req, res) => {
  try {
    const { bookingId } = req.params
    const { rating, review } = req.body

    const booking = await Booking.findById(bookingId)
    if (!booking) return errorResponse(res, 404, 'Booking not found')
    if (booking.user.toString() !== req.user._id.toString())
      return errorResponse(res, 403, 'Not authorized')
    if (booking.status !== 'Completed')
      return errorResponse(res, 400, 'Can only review completed journeys')
    if (booking.rating)
      return errorResponse(res, 400, 'Already reviewed')

    booking.rating = rating
    booking.review = review
    booking.reviewedAt = new Date()
    await booking.save()

    successResponse(res, booking, 'Review added successfully')
  } catch (err) {
    errorResponse(res, 500, err.message)
  }
}

export const updateExpiredBookings = async () => {
  try {
    const bookings = await Booking.find({ status: 'Confirmed' }).populate('bus')
    const now = new Date()
    let updatedCount = 0

    for (const booking of bookings) {
      if (!booking.bus) continue
      const journeyDateTime = getJourneyDateTime(booking.journeyDate, booking.bus.departureTime)

      if (journeyDateTime < now) {
        booking.status = 'Expired'
        await booking.save()
        updatedCount++
      }
    }
    console.log(`Expired bookings marked: ${updatedCount}`)
  } catch (err) {
    console.log('Cron error:', err.message)
  }
}

export const cleanupPendingBookings = async () => {
  try {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)
    const expiredBookings = await Booking.find({
      status: 'Pending',
      createdAt: { $lt: fifteenMinutesAgo }
    })

    for (const booking of expiredBookings) {
      await Bus.findByIdAndUpdate(booking.bus, {
        $pull: { bookedSeats: { $in: booking.seats } },
        $inc: { availableSeats: booking.seats.length }
      })
    }

    await Booking.deleteMany({
      status: 'Pending',
      createdAt: { $lt: fifteenMinutesAgo }
    })
    console.log('Cleaned up pending bookings')
  } catch (err) {
    console.log('Cleanup error:', err.message)
  }
}

export const getLockedSeats = async (req, res) => {
  try {
    const userId = req.user._id

    const locks = await SeatLock.find({
      userId,
      expiresAt: { $gt: new Date() }
    }).populate('busId', 'busName from to journeyDate price')

    const userLocks = locks
      .filter(lock => lock.busId)
      .map(lock => ({
        _id: lock._id,
        seatNumber: lock.seatNumber,
        expiresAt: lock.expiresAt,
        busId: lock.busId._id,
        busName: lock.busId.busName,
        from: lock.busId.from,
        to: lock.busId.to,
        journeyDate: lock.busId.journeyDate,
        price: lock.price
      }))

    successResponse(res, { lockedSeats: userLocks }, 'Locked seats fetched')
  } catch (err) {
    console.log('GET ERROR:', err)
    errorResponse(res, 500, err.message)
  }
}

export const releaseSeats = async (req, res) => {
  try {
    const { busId } = req.params
    const userId = req.user._id

    await SeatLock.deleteMany({ busId, userId })
    successResponse(res, null, 'Seats released')
  } catch (err) {
    console.log('Release seats error:', err)
    errorResponse(res, 500, err.message)
  }
}

export const getRecentBookings = async (req, res) => {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const bookings = await Booking.find({
      user: req.user._id,
      createdAt: { $gte: last24Hours }
    })
      .populate('bus')
      .sort({ createdAt: -1 })
      .lean()

    successResponse(res, bookings, 'Recent bookings fetched')
  } catch (err) {
    console.log('Get recent bookings error:', err)
    errorResponse(res, 500, err.message)
  }
}

export const getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('bus user', '-password')
      .lean()

    if (!booking) return errorResponse(res, 404, 'Booking not found')

    if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Not authorized')
    }

    successResponse(res, booking)
  } catch (err) {
    errorResponse(res, 500, err.message)
  }
}

export const markTicketUsed = async (req, res) => {
  try {
    const { pnr } = req.params
    const cleanPNR = pnr.trim().toUpperCase()

    if (!req.user || !req.user._id) {
      return errorResponse(res, 401, 'Not authorized')
    }

    const conductorId = req.user._id

    const booking = await Booking.findOne({ pnr: cleanPNR }).populate('bus user')
    if (!booking) return errorResponse(res, 404, 'Invalid PNR')

    const status = booking.status.toLowerCase()
    if (status === 'cancelled') return errorResponse(res, 400, 'Ticket is Cancelled')
    if (status === 'completed') return errorResponse(res, 400, 'Journey already completed')
    if (status === 'boarded') return errorResponse(res, 400, 'Passenger already boarded')
    if (status !== 'confirmed') return errorResponse(res, 400, `Ticket status: ${booking.status}`)

    const journeyDateTime = getJourneyDateTime(booking.journeyDate, booking.bus.departureTime)
    const now = new Date()
    const twoHoursBefore = new Date(journeyDateTime.getTime() - 2 * 60 * 60 * 1000)
    const oneDayAfter = new Date(journeyDateTime.getTime() + 24 * 60 * 60 * 1000)

    if (now < twoHoursBefore) {
      return errorResponse(res, 400, `Too early. Boarding starts 2 hours before journey`)
    }

    if (now > oneDayAfter) {
      return errorResponse(res, 400, `Ticket expired. Journey date passed`)
    }

    const todayIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
    const startOfDay = new Date(todayIST)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(todayIST)
    endOfDay.setHours(23, 59, 999)

    const assignment = await ConductorAssignment.findOne({
      conductorId,
      busId: booking.bus._id,
      date: { $gte: startOfDay, $lte: endOfDay }
    })

    if (!assignment) {
      return errorResponse(res, 403, 'You are not assigned to this bus today')
    }

    booking.status = 'Boarded'
    booking.boardedAt = new Date()
    booking.usedBy = conductorId
    await booking.save()

    const updatedBooking = await Booking.findById(booking._id).populate('bus user usedBy')

    try {
      await createNotification(
        booking.user,
        'journey_started',
        'Boarding Successful',
        `You have boarded ${booking.bus.busName}. Have a safe journey!`,
        { bookingId: booking._id, busId: booking.bus._id }
      )
    } catch (notifErr) {
      console.log('Notification failed but boarding success:', notifErr.message)
    }

    return successResponse(res, updatedBooking, 'Passenger Boarded Successfully')

  } catch (err) {
    console.log('Mark boarded error:', err)
    return errorResponse(res, 500, err.message)
  }
}

export const markBoarded = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('bus')
    if (!booking) return errorResponse(res, 404, 'Booking not found')

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const assignment = await ConductorAssignment.findOne({
      conductorId: req.user._id,
      busId: booking.bus._id,
      date: { $gte: today, $lt: tomorrow }
    })

    if (!assignment) {
      return errorResponse(res, 403, 'You are not assigned to this bus today')
    }

    if (booking.status !== 'Confirmed') {
      return errorResponse(res, 400, 'Only confirmed tickets can be boarded')
    }

    booking.status = 'Boarded'
    booking.boardedAt = new Date()
    booking.usedBy = req.user._id
    await booking.save()

    successResponse(res, booking, 'Passenger boarded successfully')
  } catch (err) {
    errorResponse(res, 500, err.message)
  }
}

export const markRideComplete = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('bus')

    if (!booking) return errorResponse(res, 404, 'Booking not found')

    if (booking.user.toString() !== req.user._id.toString()) {
      return errorResponse(res, 403, 'Not your booking')
    }

    if (booking.status !== 'Boarded') {
      return errorResponse(res, 400, 'You must board first. Ask conductor to scan PNR.')
    }

    booking.status = 'Completed'
    booking.completedAt = new Date()
    booking.completedBy = 'passenger'
    await booking.save()

    await createNotification(
      booking.user,
      'ride_completed',
      'Ride Completed',
      `Your journey with ${booking.bus.busName} is completed. Rate your experience!`,
      { bookingId: booking._id, busId: booking.bus._id }
    )

    successResponse(res, booking, 'Ride completed successfully')
  } catch (err) {
    errorResponse(res, 500, err.message)
  }
}

// Helper: fare calculate করার function
const calculateFare = (bus, from, to) => {
  // তোর bus model এ fareChart থাকলে সেখান থেকে নে
  if (bus.fareChart && bus.fareChart[`${from}-${to}`]) {
    return bus.fareChart[`${from}-${to}`]
  }

  // নাহলে distance based calculate কর
  const fromIdx = bus.checkpoints.findIndex(cp => cp.name === from)
  const toIdx = bus.checkpoints.findIndex(cp => cp.name === to)
  const stops = toIdx - fromIdx
  return stops * 60 // example: per stop 60 টাকা
}

export const payFine = async (req, res) => {
  try {
    const { bookingId } = req.params
    const { paymentIntentId, paymentMode = 'cash' } = req.body

    const booking = await Booking.findById(bookingId).populate('user bus')
    if (!booking || booking.fineStatus !== 'pending')
      return errorResponse(res, 400, 'No pending fine')

    if (paymentMode === 'upi' || paymentMode === 'online') {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
      if (paymentIntent.status !== 'succeeded')
        return errorResponse(res, 400, 'Online payment failed')
    }

    booking.fineStatus = 'paid'
    booking.finePaidAt = new Date()
    booking.finePaymentId = paymentIntentId
    booking.finePaymentMode = paymentMode
    booking.fineCollectedBy = req.user._id
    booking.fineCollectedAt = new Date()

    // ✅ Add কর: Fine pay মানেই journey শেষ
    if (booking.status === 'Boarded') {
      booking.status = 'Completed'
      booking.completedAt = new Date()
      booking.completedBy = 'system'
    }

    await booking.save()

    // ✅ Mail পাঠাও
    try {
      await sendTicketEmail(booking.user.email, booking, 'fine-paid')
      booking.fineReceiptSent = true
      await booking.save()
      console.log('✅ Fine receipt email sent to:', booking.user.email)
    } catch (emailErr) {
      console.log('❌ Email failed:', emailErr.message)
    }

    successResponse(res, booking, 'Fine collected & receipt sent')
  } catch (err) {
    errorResponse(res, 500, err.message)
  }
}
export const createFinePaymentIntent = async (req, res) => {
  try {
    const { bookingId } = req.params
    const booking = await Booking.findById(bookingId).populate('user')

    if (!booking || booking.fineStatus !== 'pending')
      return errorResponse(res, 400, 'No pending fine')

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.fineAmount * 100), // paise
      currency: 'inr',
      metadata: {
        bookingId: booking._id.toString(),
        pnr: booking.pnr,
        type: 'fine_payment'
      }
    })

    successResponse(res, { clientSecret: paymentIntent.client_secret })
  } catch (err) {
    errorResponse(res, 500, err.message)
  }
}
// controllers/booking.controller.js
// booking.controller.js - disputeFine function
export const disputeFine = async (req, res) => {
  try {
    const { bookingId } = req.params
    const { reason } = req.body
    const userId = req.user._id

    const booking = await Booking.findById(bookingId)
    if (!booking) return errorResponse(res, 404, 'Booking not found')

    if (booking.user.toString() !== userId.toString())
      return errorResponse(res, 403, 'Not your booking')

    if (booking.fineStatus !== 'paid' && booking.fineStatus !== 'pending')
      return errorResponse(res, 400, 'No fine to dispute')

    if (booking.fineDisputed)
      return errorResponse(res, 400, 'Already disputed')

    booking.fineDisputed = true
    booking.fineDisputeReason = reason
    booking.fineDisputeStatus = 'pending'
    booking.fineDisputedAt = new Date()
    await booking.save()

    // ✅ IssueReport এ save কর
    await IssueReport.create({
      user: userId,
      issueType: 'fine_dispute', // ✅ Specific type
      bookingId: booking.pnr,
      description: reason,
      status: 'pending'
    })

    successResponse(res, booking, 'Fine disputed successfully. Admin will review.')
  } catch (err) {
    errorResponse(res, 500, err.message)
  }
}
// Admin এর জন্য Resolve API
export const resolveFineDispute = async (req, res) => {
  try {
    const { bookingId } = req.params
    const { action, resolution, refundAmount } = req.body // action: 'approve' | 'reject'
    const adminId = req.user._id

    const booking = await Booking.findById(bookingId).populate('user bus')
    if (!booking) return errorResponse(res, 404, 'Booking not found')
    if (!booking.fineDisputed) return errorResponse(res, 400, 'No dispute found')

    if (action === 'approve') {
      // Refund কর
      if (refundAmount > 0 && booking.finePaymentId) {
        await stripe.refunds.create({
          payment_intent: booking.finePaymentId,
          amount: Math.round(refundAmount * 100)
        })
      }
      booking.fineDisputeStatus = 'resolved'
      booking.fineDisputeRefund = refundAmount
      booking.fineStatus = 'none' // Fine cancel
    } else {
      booking.fineDisputeStatus = 'rejected'
    }

    booking.fineDisputeResolvedAt = new Date()
    booking.fineDisputeResolvedBy = adminId
    booking.fineDisputeResolution = resolution
    await booking.save()

    // Passenger কে mail পাঠাও
    await sendTicketEmail(
      booking.user.email,
      booking,
      action === 'approve' ? 'fine-refunded' : 'fine-dispute-rejected'
    )

    successResponse(res, booking, `Dispute ${action}ed successfully`)
  } catch (err) {
    errorResponse(res, 500, err.message)
  }
}
// controllers/booking.controller.js - একদম শেষে add কর

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

    // ✅ IssueReport থেকে proof বের করে attach কর
    const disputesWithProof = await Promise.all(
      disputes.map(async (dispute) => {
        const issue = await IssueReport.findOne({
          bookingId: dispute.pnr,
          issueType: 'other' // বা 'fine_dispute' যদি থাকে
        }).lean()

        return {
          ...dispute,
          fineDisputeProof: issue?.proofUrl || null,
          fineDisputeProofUploadedAt: issue?.createdAt || null
        }
      })
    )

    successResponse(res, disputesWithProof, 'Fine disputes fetched')
  } catch (err) {
    errorResponse(res, 500, err.message)
  }
}
export const uploadDisputeProof = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)

    if (!booking) return errorResponse(res, 404, 'Booking not found')
    if (booking.user.toString() !== req.user.id)
      return errorResponse(res, 403, 'Not your booking')
    if (!booking.fineDisputed)
      return errorResponse(res, 400, 'No dispute filed')

    // ✅ IssueReport update কর, Booking না
    await IssueReport.findOneAndUpdate(
      { bookingId: booking.pnr, issueType: 'fine_dispute' },
      {
        proofUrl: req.file.path,
        status: 'under_review'
      },
      { upsert: true, new: true }
    )

    booking.fineDisputeStatus = 'under_review'
    await booking.save()

    successResponse(res, booking, 'Proof uploaded successfully')
  } catch (err) {
    errorResponse(res, 500, err.message)
  }
}
export const payOnExit = async (req, res) => {
  try {
    const { bookingId } = req.params
    const booking = await Booking.findById(bookingId).populate('bus user')

    if (!booking) return errorResponse(res, 404, 'Booking not found')
    if (booking.paymentStatus === 'Paid') return errorResponse(res, 400, 'Already paid')

    const bus = booking.bus
    bus.bookedSeats.push(...booking.seats)
    bus.availableSeats = bus.totalSeats - bus.bookedSeats.length
    await bus.save()

    // Add this part
    booking.paymentStatus = 'Paid'
    booking.paidAt = new Date()
    booking.status = 'Completed'
    booking.completedAt = new Date()
    booking.exitCode = Math.floor(1000 + Math.random() * 9000).toString()
    booking.exitCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000)
    booking.exitCodeUsed = false
    await booking.save()

    successResponse(res, booking, 'Payment complete. Show exit code to driver')
  } catch (err) {
    errorResponse(res, 500, err.message)
  }
}
// DELETE /api/bookings/:id - Single booking delete
// booking.controller.js এ সবার নিচে add কর
// DELETE /api/bookings/:id/history - Single booking delete from history
export const deleteBookingHistory = async (req, res) => {
  try {
    const booking = await Booking.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
      status: { $in: ['Completed', 'Cancelled', 'Expired'] }
    })

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or cannot be deleted'
      })
    }

    res.json({
      success: true,
      message: 'Booking removed from history'
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    })
  }
}
// DELETE /api/bookings/history/clear-all - Clear all history
export const clearAllHistory = async (req, res) => {
  try {
    const result = await Booking.deleteMany({
      user: req.user._id,
      status: { $in: ['Completed', 'Cancelled', 'Expired'] }
    })

    res.json({
      success: true,
      message: `${result.deletedCount} bookings cleared from history`,
      deletedCount: result.deletedCount
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    })
  }
}
export const verifyExitCodeController = async (req, res) => {
  try {
    const { code } = req.body;
    const booking = await Booking.findById(req.params.bookingId);

    if (!booking) {
      return errorResponse(res, 404, 'Booking not found');
    }

    // FIX: Confirmed er bodole Completed check koro
    if (booking.status !== 'Completed') {
      return errorResponse(res, 400, 'Ride not completed yet');
    }

    if (booking.exitCodeUsed) {
      return errorResponse(res, 400, 'Code already used');
    }

    if (new Date() > booking.exitCodeExpiresAt) {
      return errorResponse(res, 400, 'Code expired');
    }

    if (booking.exitCode !== code) {
      return errorResponse(res, 400, 'Invalid code');
    }

    booking.exitCodeUsed = true;
    booking.completedAt = new Date();
    booking.completedBy = 'driver';
    await booking.save();

    return successResponse(res, { bookingId: booking._id }, 'Exit verified successfully');
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};
export const processPaymentAndGenerateExitCode = async (req, res) => {
  try {
    const { busId, bookingId } = req.body
    const driverId = req.user._id

    const booking = await Booking.findOne({
      _id: bookingId,
      bus: busId,
      status: 'Confirmed',
      paymentStatus: 'Pending',
      exitCodeUsed: false
    }).populate('bus')

    if (!booking) return errorResponse(res, 400, 'Invalid booking or already paid')
    if (booking.bus.mode !== 'A') return errorResponse(res, 400, 'Not a Mode A booking')

    // TODO: Ekhane driver er device theke payment nao
    // const paymentResult = await chargeCard(booking.totalAmount)
    // if (!paymentResult.success) return errorResponse(res, 400, 'Payment failed')

    // Payment success hole exit code generate koro
    booking.exitCode = Math.floor(100000 + Math.random() * 900000).toString()
    booking.exitCodeExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
    booking.paymentStatus = 'Paid'
    booking.status = 'Completed'
    booking.paidAt = new Date()
    booking.paidBy = driverId
    booking.completedAt = new Date()
    await booking.save()

    return successResponse(res, booking, 'Payment received. Exit code generated')
  } catch (err) {
    return errorResponse(res, 500, err.message)
  }
}
export const processPayment = async (req, res) => {
  try {
    const { bookingId, busId } = req.body
    const conductorId = req.user._id

    const booking = await Booking.findById(bookingId).populate('bus')
    if (!booking) return errorResponse(res, 404, 'Booking not found')
    if (booking.bus._id.toString() !== busId) return errorResponse(res, 400, 'Booking does not belong to this bus')
    if (booking.paymentStatus === 'Paid') return errorResponse(res, 400, 'Payment already collected')

    booking.paymentStatus = 'Paid'
    booking.paidAt = new Date()
    booking.status = 'Completed'

    // New 4 digit code, 10 min valid
booking.exitCode = Math.floor(1000 + Math.random() * 9000).toString()
booking.exitCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 min
    booking.exitCodeUsed = false

    await booking.save()

    return successResponse(res, booking, 'Payment collected. Exit code sent.')
  } catch (err) {
    console.log('PROCESS PAYMENT ERROR:', err)
    return errorResponse(res, 500, err.message)
  }
}
export const getDriverPendingExits = async (req, res) => {
  try {
    const buses = await Bus.find({
      conductor: req.user._id,
      tripStatus: 'started',
      mode: 'A'
    }).select('_id')

    const busIds = buses.map(b => b._id)

    const count = await Booking.countDocuments({
      bus: { $in: busIds },
      paymentStatus: 'Paid',
      exitCodeUsed: false,
      exitCodeExpiresAt: { $gt: new Date() }
    })

    successResponse(res, { count })
  } catch (err) {
    errorResponse(res, 500, err.message)
  }
}
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('bus')
      .populate('user', 'email phone')
      .select('+exitCode')
      .lean() // add this

    if (!booking) return res.status(404).json({ message: 'Booking not found' })

    if (booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    res.status(200).json({ success: true, data: booking })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
export const verifyBoarding = async (req, res) => {
  try {
    console.log("🔥🔥 FINAL BOARDING HIT:", req.params.pnr)
    const { pnr } = req.params
    const { currentCheckpointOrder } = req.body

    const booking = await Booking.findOne({ pnr: pnr.trim().toUpperCase() }).populate('bus user')
    if (!booking) return errorResponse(res, 404, 'Ticket not found')

    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
    const assignment = await ConductorAssignment.findOne({
      conductorId: req.user._id,
      busId: booking.bus._id,
      date: new Date(todayStr + "T00:00:00.000Z")
    })
    
    console.log("ASSIGNMENT FINAL:", assignment ? "FOUND" : "NOT FOUND")
    if (!assignment) return errorResponse(res, 403, 'You are not assigned to this bus today')

    if (booking.status !== 'Confirmed') return errorResponse(res, 400, `Ticket status: ${booking.status}`)

    booking.status = 'Boarded'
    booking.actualBoardingOrder = Number(currentCheckpointOrder)
    booking.boardedAt = new Date()
    booking.usedBy = req.user._id
    await booking.save()

    return successResponse(res, { booking, fineAmount: 0 }, 'Boarding verified')
  } catch (error) {
    console.error(error)
    return errorResponse(res, 500, error.message)
  }
}

export const verifyExit = async (req, res) => {
  try {
    const { pnr } = req.params
    const { currentCheckpointOrder } = req.body

    const booking = await Booking.findOne({ pnr: pnr.trim().toUpperCase() }).populate('bus user')
    if (!booking) return errorResponse(res, 404, 'Ticket not found')

    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
    const startOfDay = new Date(today + "T00:00:00.000Z")
    const endOfDay = new Date(today + "T23:59:59.999Z")
    
    const assignment = await ConductorAssignment.findOne({
      conductorId: req.user._id,
      busId: booking.bus._id,
      date: { $gte: startOfDay, $lte: endOfDay }
    })
    
    if (!assignment) return errorResponse(res, 403, 'You are not assigned to this bus today')

    if (booking.status !== 'Boarded') 
      return errorResponse(res, 400, 'Passenger has not boarded yet')

    booking.status = 'Completed'
    booking.actualDroppingOrder = Number(currentCheckpointOrder)
    booking.completedAt = new Date()
    await booking.save()

    return successResponse(res, { booking, fineAmount: 0 }, 'Exit verified')
  } catch (error) {
    return errorResponse(res, 500, error.message)
  }
}
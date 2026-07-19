import Stripe from 'stripe'
import Booking from '../models/Booking.js'
import Bus from '../models/Bus.js'
import crypto from 'crypto'
// Fare calculator import - tomake eta banate hobe
import calculateStageFare from '../utils/fareCalculator.js'
import SeatLock from '../models/SeatLock.js'
import Coupon from '../models/Coupon.js'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Mode B - Prepay er jonno booking + payment intent
export const createPaymentIntent = async (req, res) => {
  try {
    const { busId, seats, couponCode, passengerDetails, journeyDate, boardingPoint, droppingPoint } = req.body
    const userId = req.user._id

    const bus = await Bus.findById(busId)
    if (!bus) return res.status(404).json({ message: 'Bus not found' })

    const finalBoardingPoint = boardingPoint || bus.from
    const finalDroppingPoint = droppingPoint || bus.to

    // Fare calculate koro
    const fareData = await calculateStageFare(bus, finalBoardingPoint, finalDroppingPoint)

    // Check seat lock
    const userLocks = await SeatLock.find({
      busId,
      userId,
      seatNumber: { $in: seats },
      expiresAt: { $gt: new Date() }
    })
    if (userLocks.length !== seats.length) {
      return res.status(400).json({ message: 'Seats not locked or lock expired' })
    }

    let totalAmount = fareData.fare * seats.length
    let discount = 0
    let finalCouponCode = null

    // Coupon apply
    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
        validFrom: { $lte: new Date() },
        validTill: { $gte: new Date() }
      })

      if (coupon && totalAmount >= coupon.minAmount) {
        discount = coupon.discountType === 'percentage'
          ? Math.min((totalAmount * coupon.discountValue) / 100, coupon.maxDiscount || totalAmount)
          : coupon.discountValue
        finalCouponCode = coupon.code
      }
    }

    const finalAmount = totalAmount - discount

    const booking = await Booking.create({
      user: userId,
      bus: busId,
      journeyDate,
      boardingPoint: finalBoardingPoint,
      droppingPoint: finalDroppingPoint,
      boardingCheckpointOrder: fareData.boardingOrder,
      droppingCheckpointOrder: fareData.droppingOrder,
      distance: fareData.distance,
      seats,
      passengerDetails,
      totalAmount: finalAmount,
      discount,
      couponCode: finalCouponCode,
      status: 'Pending',
      paymentType: 'prepay',
      paymentStatus: 'Pending'
    })

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(finalAmount * 100),
      currency: 'inr',
      metadata: { bookingId: booking._id.toString(), type: 'ticket' },
      automatic_payment_methods: { enabled: true }
    })

    res.status(200).json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        bookingId: booking._id,
        discount,
        finalAmount
      },
      message: 'Payment intent created'
    })
  } catch (err) {
    console.error('createPaymentIntent error:', err)
    res.status(500).json({ message: err.message })
  }
}

// Mode A - Namar time e pay korar jonno
// Mode A - PayU te change kora holo
export const createPaymentIntentForExit = async (req, res) => {
  try {
    const { bookingId } = req.body
    console.log('[PayExit] bookingId:', bookingId)

    const booking = await Booking.findById(bookingId).populate('user', 'email phone name')
    if (!booking) return res.status(404).json({ message: 'Booking not found' })
    if (!booking.user) return res.status(404).json({ message: 'User not found for this booking' })
    if (booking.paymentStatus === 'Paid') return res.status(400).json({ message: 'Already paid' })

    const txnid = `EXIT${booking.pnr}${Date.now()}`
    const amount = booking.totalAmount // PayU te taka e pathabe, paise na
    const productinfo = `Exit Fee PNR ${booking.pnr}`
    const firstname = booking.passengerDetails?.[0]?.name || booking.user?.name || 'User'
    const email = booking.user.email
    const phone = booking.user.phone || '9999'

    const udf1 = bookingId
    const udf2 = ''
    const udf3 = ''
    const udf4 = ''
    const udf5 = ''

    // Hash string: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT
    const hashString = `${process.env.PAYU_KEY}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${process.env.PAYU_SALT}`
    const hash = crypto.createHash('sha512').update(hashString).digest('hex')

    res.status(200).json({
      success: true,
      data: {
        key: process.env.PAYU_KEY,
        txnid,
        amount, // hash er sathe match korar jonno *100 koro na
        productinfo,
        firstname,
        email,
        phone,
        surl: `${process.env.BACKEND_URL}/api/payments/payu/success`,
        furl: `${process.env.BACKEND_URL}/api/payments/payu/fail`,
        hash,
        action: process.env.PAYU_URL,
        udf1,
        udf2,
        udf3,
        udf4,
        udf5
      }
    })
  } catch (err) {
    console.error('createPaymentIntentForExit error:', err)
    res.status(500).json({ message: err.message })
  }
}
// Webhook - dutoi handle korbe
export const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature']
  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature error:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  if (event.type === 'payment_intent.succeeded') {
    const { bookingId, type } = event.data.object.metadata

    try {
      const booking = await Booking.findById(bookingId)
      if (!booking) return res.status(404).end()

      // Idempotency check - already processed hole return
      if (booking.paymentStatus === 'Paid') {
        console.log('Webhook already processed for:', bookingId)
        return res.json({ received: true })
      }

      booking.paymentStatus = 'Paid'
      booking.paidAt = new Date()

      if (type === 'ticket') {
        // Mode B - Prepay
        booking.status = 'Confirmed'
        
        const bus = await Bus.findById(booking.bus)
        if (bus) {
          // Duplicate seat add hobe na check koro
          const newSeats = booking.seats.filter(s => !bus.bookedSeats.includes(s))
          if (newSeats.length > 0) {
            bus.bookedSeats.push(...newSeats)
            bus.availableSeats = bus.totalSeats - bus.bookedSeats.length
            await bus.save()
          }
        }
        console.log('✅ Mode B booking confirmed:', bookingId)

      } else if (type === 'exit_payment') {
        // Mode A - Exit payment
        booking.status = 'Completed'
        booking.exitCode = Math.floor(100000 + Math.random() * 900000).toString()
        booking.exitCodeExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
        console.log('✅ Mode A exit payment done, code generated:', booking.exitCode)
      }

      await booking.save()
    } catch (err) {
      console.error('Webhook DB update error:', err)
      return res.status(500).end()
    }
  }

  res.json({ received: true })
}

// Purano createPaymentIntentForExit function ta replace koro eta diye
export const createCheckoutSessionForExit = async (req, res) => {
  try {
    const { bookingId } = req.body
    const booking = await Booking.findById(bookingId)
    if (!booking) return res.status(404).json({ message: 'Booking not found' })
    if (booking.paymentStatus === 'Paid') return res.status(400).json({ message: 'Already paid' })

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'upi'],
      line_items: [{
        price_data: {
          currency: 'inr',
          product_data: { name: `Exit Payment - PNR ${booking.pnr}` },
          unit_amount: Math.round(booking.totalAmount * 100)
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/ticket/${bookingId}?paid=1`,
      cancel_url: `${process.env.CLIENT_URL}/ticket/${bookingId}`,
      metadata: { bookingId: booking._id.toString(), type: 'exit_payment' }
    })

    res.json({ url: session.url })
  } catch (err) {
    console.error('createCheckoutSessionForExit error:', err)
    res.status(500).json({ message: err.message })
  }
}
// PayU Success Callback
export const payuSuccess = async (req, res) => {
  try {
    const { txnid, status, udf1 } = req.body
    console.log('PayU Success Body:', req.body) // eta check koro terminal e

    if (status === 'success' && udf1) {
      const booking = await Booking.findById(udf1)

      if (booking && booking.paymentStatus !== 'Paid') {
        booking.paymentStatus = 'Paid'
        booking.paidAt = new Date()
        booking.status = 'Completed'
        booking.exitCode = Math.floor(100000 + Math.random() * 900000).toString()
        booking.exitCodeExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
        await booking.save()
        console.log('✅ Payment success, exit code:', booking.exitCode)
      }
    }

    res.redirect(`${process.env.CLIENT_URL}/ticket/${udf1}?paid=1`)
  } catch (err) {
    console.error('payuSuccess error:', err)
    res.status(500).send('Error')
  }
}
// PayU Fail Callback
export const payuFail = async (req, res) => {
  try {
    console.log('PayU Fail:', req.body)
    res.redirect(`${process.env.CLIENT_URL}/ticket/${req.body.udf1 || ''}?paid=0`)
  } catch (err) {
    console.error('payuFail error:', err)
    res.status(500).send('Error')
  }
}
// Booking details anar jonno - payment status check korte lagbe
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('bus')
      .populate('user', 'email phone')
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' })
    }

    // Nijer booking kina check koro
    if (booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    res.status(200).json({
      success: true,
      data: booking
    })
  } catch (err) {
    console.error('getBookingById error:', err)
    res.status(500).json({ message: err.message })
  }
}
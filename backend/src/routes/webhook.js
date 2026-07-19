const express = require('express')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const Booking = require('../models/Booking')
const router = express.Router()

router.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature']
  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object
    const bookingId = paymentIntent.metadata.bookingId

    await Booking.findByIdAndUpdate(bookingId, {
      paymentStatus: 'Paid',
      exitCode: Math.floor(100000 + Math.random() * 900000).toString()
    })
  }

  res.json({ received: true })
})

module.exports = router
import dotenv from 'dotenv'
dotenv.config()
console.log('EMAIL_USER:', process.env.EMAIL_USER)

import mongoose from 'mongoose'
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { PORT } from './src/config/env.js'

import connectDB from './src/config/db.js'
import { errorHandler } from './src/middleware/error.middleware.js'
import { initSocket } from './src/config/socket.js'
import { updateExpiredBookings, cleanupPendingBookings } from './src/controllers/booking.controller.js'
import { sendReminder } from './src/utils/reminder.js'
import Bus from './src/models/Bus.js'

// Routes
import reviewRoutes from './src/routes/reviewRoutes.js'
import quoteRoutes from './src/routes/quoteRoutes.js'
import { stripeWebhook } from './src/controllers/payment.controller.js' 
import authRoute from './src/routes/auth.route.js'
import busRoute from './src/routes/bus.route.js'
import cityRoute from './src/routes/city.route.js'
import bookingRoute from './src/routes/booking.route.js'
import paymentRoute from './src/routes/payment.route.js'
import ticketRoute from './src/routes/ticket.route.js'
import adminRoute from './src/routes/admin.route.js'
import conductorRoute from './src/routes/conductor.route.js'
import waitlistRoutes from './src/routes/waitlist.routes.js'
import couponRoutes from './src/routes/coupon.route.js'
import notificationRoutes from './src/routes/notificationRoutes.js'
import userRoutes from './src/routes/userRoutes.js'
import issueRoutes from './src/routes/issue.routes.js'
import offerRoutes from './src/routes/offerRoutes.js'
import statsRoutes from './src/routes/stats.route.js'
import searchRoutes from './src/routes/search.routes.js'   
import faqRoutes from './src/routes/faq.routes.js'

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: 'https://smartbussystem-1.onrender.com',
    credentials: true
  }
})
initSocket(io)

// CORS
app.use(cors({
  origin: 'https://smartbussystem-1.onrender.com',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`)
  next()
})
app.use('/uploads', express.static('uploads'))
// ✅ Stripe Webhook FIRST, before express.json() - raw body lagbe
app.post('/api/payments/stripe-webhook', express.raw({ type: 'application/json' }), stripeWebhook)

// ✅ Tarpor JSON + URL-encoded parser sob baki route er jonno
app.use(express.json())
app.use(express.urlencoded({ extended: true })) // PayU er jonno eta lagbe

// Routes - sob plural 'payments' use koro
app.use('/api/waitlist', waitlistRoutes)
app.use('/api/auth', authRoute)
app.use('/api/buses', busRoute)
app.use('/api/cities', cityRoute)
app.use('/api/search', searchRoutes) 
app.use('/api/faqs', faqRoutes)

app.use('/api/bookings', bookingRoute)
app.use('/api/payments', paymentRoute)  // changed from /api/payment
app.use('/api/tickets', ticketRoute)
app.use('/api/admin', adminRoute)
app.use('/api/conductor', conductorRoute)
app.use('/api/coupon', couponRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/users', userRoutes)
app.use('/api/issues', issueRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/offers', offerRoutes)
app.use('/api/quotes', quoteRoutes)

// Prottek minute e
setInterval(() => {
  console.log('🔔 Checking bus reminders...')
  sendReminder()
}, 60 * 1000)

// Prottek ghontay
setInterval(async () => {
  console.log('Running interval: updating expired bookings...')
  await updateExpiredBookings()
  await cleanupPendingBookings()
}, 60 * 60 * 1000)

app.use(errorHandler)

connectDB().then(async () => {
  try {
    await Bus.collection.dropIndex("lockedSeats.expiresAt_1")
    console.log('✅ TTL Index dropped successfully')
  } catch (e) {
    console.log('ℹ️ TTL Index not found or already dropped')
  }

  httpServer.listen(PORT, () => console.log(`Server running on ${PORT}`))
})

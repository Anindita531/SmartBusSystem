import express from 'express'
import {
  createPaymentIntent,
  createPaymentIntentForExit,
  stripeWebhook,
  payuSuccess,
  payuFail,
  getBookingById   // eta add koro
} from '../controllers/payment.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = express.Router()

router.post('/create-intent', protect, createPaymentIntent)
router.post('/create-exit-intent', protect, createPaymentIntentForExit)
router.get('/booking/:id', protect, getBookingById)   // eta add koro
router.post('/stripe-webhook', express.raw({type: 'application/json'}), stripeWebhook)
router.post('/payu/success', payuSuccess)
router.post('/payu/fail', payuFail)

export default router
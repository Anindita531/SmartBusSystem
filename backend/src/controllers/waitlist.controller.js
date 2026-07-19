import Waitlist from '../models/Waitlist.js'
import { successResponse, errorResponse } from '../utils/response.utils.js'

export const joinWaitlist = async (req, res) => {
  try {
    const { busId, seatsNeeded, journeyDate } = req.body
    const userId = req.user._id

    const exists = await Waitlist.findOne({ busId, userId, journeyDate })
    if (exists) return errorResponse(res, 400, 'Already in waitlist for this bus')

    await Waitlist.create({ busId, userId, seatsNeeded, journeyDate })
    successResponse(res, null, 'Added to waitlist. We will notify you when seats available')
  } catch (err) {
    errorResponse(res, 500, err.message)
  }
}

export const getMyWaitlist = async (req, res) => {
  try {
    const waitlists = await Waitlist.find({ userId: req.user._id })
      .populate('busId', 'busName from to journeyDate price')
      .sort({ createdAt: -1 })
    successResponse(res, waitlists)
  } catch (err) {
    errorResponse(res, 500, err.message)
  }
}
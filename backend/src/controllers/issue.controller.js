import { uploadToCloudinary } from '../utils/cloudinary.js'
import IssueReport from '../models/IssueReport.js'
import Booking from '../models/Booking.js'
import User from '../models/User.js'

export const reportIssue = async (req, res) => {
  try {
    const { issueType, bookingId, description } = req.body
    const userId = req.user.id

    if (!issueType || !description) {
      return res.status(400).json({ message: 'Issue type and description required' })
    }

    let proofUrl = null
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'issue-proofs')
      proofUrl = result.secure_url
    }

    const issue = await IssueReport.create({
      user: userId,
      issueType,
      bookingId,
      description,
      proofUrl
    })

    res.status(201).json({ 
      message: 'Issue reported successfully', 
      issue 
    })
  } catch (error) {
    console.error('Report issue error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const getUserIssues = async (req, res) => {
  try {
    const issues = await IssueReport.find({ user: req.user.id })
      .sort({ createdAt: -1 })
    res.json(issues)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

// ✅ Admin - Get all disputes
export const getFineDisputes = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' })
    }

    const disputes = await Booking.find({ 
      fineDisputeStatus: { $in: ['pending', 'under_review'] } 
    })
    .populate('user', 'name phone email')
    .populate('bus', 'busName busNumber')
    .sort({ fineDisputeFiledAt: -1 })

    res.json({ data: disputes })
  } catch (error) {
    console.error('Get disputes error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// ✅ Auto Investigation
export const investigateDispute = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' })
    }

    const { bookingId } = req.params
    const booking = await Booking.findById(bookingId)
      .populate('user')
      .populate('conductorId')

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' })
    }

    // Conductor এর past dispute rate
    const conductorDisputes = await Booking.countDocuments({
      conductorId: booking.conductorId,
      fineDisputeStatus: { $exists: true }
    })
    const conductorTotal = await Booking.countDocuments({
      conductorId: booking.conductorId
    })
    const conductorDisputeRate = conductorTotal > 0 
      ? ((conductorDisputes / conductorTotal) * 100).toFixed(1) + '%'
      : '0%'

    // Passenger past disputes
    const passengerPastDisputes = await Booking.countDocuments({
      user: booking.user._id,
      fineDisputeStatus: 'resolved'
    })

    // Simple suggestion logic
    let suggestion = 'REVIEW_MANUALLY'
    if (!booking.fineDisputeProof) {
      suggestion = 'REJECT' // No proof = auto reject
    } else if (parseFloat(conductorDisputeRate) > 20) {
      suggestion = 'APPROVE_REFUND' // Conductor shady
    } else if (passengerPastDisputes > 3) {
      suggestion = 'REJECT' // Passenger abuse
    }

    res.json({
      data: {
        investigation: {
          conductorDisputeRate,
          passengerPastDisputes,
          suggestion,
          booking: {
            pnr: booking.pnr,
            fineAmount: booking.fineAmount,
            fineReason: booking.fineReason
          }
        }
      }
    })
  } catch (error) {
    console.error('Investigation error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// ✅ Resolve dispute
export const resolveFineDispute = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' })
    }

    const { id } = req.params
    const { action, resolution, refundAmount, adminNotes } = req.body

    const booking = await Booking.findById(id)
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' })
    }

    booking.fineDisputeStatus = action // 'resolved' or 'rejected'
    booking.fineDisputeResolution = resolution
    booking.fineDisputeResolvedBy = req.user.id
    booking.fineDisputeResolvedAt = new Date()
    
    if (action === 'resolved' && refundAmount > 0) {
      booking.fineDisputeRefund = refundAmount
      // এখানে actual refund logic add করবি - Razorpay/Payment gateway
    }

    await booking.save()

    res.json({ message: `Dispute ${action} successfully`, booking })
  } catch (error) {
    console.error('Resolve error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}
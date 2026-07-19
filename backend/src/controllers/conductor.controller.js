import ConductorAssignment from '../models/ConductorAssignment.js'
import Bus from '../models/Bus.js'
import Booking from '../models/Booking.js'
import { successResponse, errorResponse } from '../utils/response.utils.js'
import { createNotification } from './notification.controller.js'

// GET /api/conductor/my-assigned-buses
export const getMyAssignments = async (req, res) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const assignments = await ConductorAssignment.find({
      conductorId: req.user._id,
      date: { $gte: new Date(today.getTime() - 7*24*60*60*1000) }
    })
    .populate({
      path: 'busId',
      match: { mode: { $ne: 'A' } }, // 🔥 Mode A bus skip koro
      populate: [
        { path: 'driver', select: 'name phone' },
        { path: 'conductor', select: 'name phone' }
      ]
    })
    .sort({ date: -1 })
    .lean()

    // null busId gula remove koro
    const buses = assignments
      .filter(a => a.busId) 
      .map(assignment => ({
        ...assignment.busId,
        assignmentStatus: assignment.status,
        assignmentId: assignment._id,
        journeyDate: assignment.date
      }))

    successResponse(res, buses, 'Assigned buses fetched')
  } catch (err) {
    console.log('getMyAssignments error:', err)
    errorResponse(res, 500, err.message)
  }
}
// PUT /api/conductor/update-location
// PUT /api/conductor/update-location
export const updateBusLocation = async (req, res) => {
  try {
    const { busId, checkpointOrder, action } = req.body
    const userId = req.user._id

    console.log('Checking assignment for:', { userId, busId })

    // ✅ FIX: conductorId field use করো, not conductor
    const assignment = await ConductorAssignment.findOne({
      conductorId: userId, // ✅ এখানে conductorId
      busId: busId
    })

    console.log('Found assignment:', assignment)

    if (!assignment) {
      return errorResponse(res, 403, 'You are not assigned to this bus')
    }

    const bus = await Bus.findById(busId)
    if (!bus) return errorResponse(res, 404, 'Bus not found')

    if (bus.tripStatus!== 'started') {
      return errorResponse(res, 400, 'Trip not started yet')
    }

    const checkpointIndex = bus.checkpoints.findIndex(cp => cp.order === checkpointOrder)
    if (checkpointIndex === -1) {
      return errorResponse(res, 404, 'Checkpoint not found')
    }

    const currentTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })

    if (action === 'arrived') {
      bus.checkpoints[checkpointIndex].actualArrivalTime = currentTime
      bus.currentLocation = bus.checkpoints[checkpointIndex].name
    } else if (action === 'departed') {
      bus.checkpoints[checkpointIndex].actualDepartedTime = currentTime
    }

    bus.lastUpdatedBy = userId
    bus.lastUpdatedAt = new Date()
    await bus.save()

    // Passenger notification
    const bookings = await Booking.find({ bus: busId, status: 'Confirmed' })
    for (let booking of bookings) {
      await createNotification(
        booking.user,
        'bus_update',
        `Bus ${action === 'arrived'? 'Arrived' : 'Departed'}`,
        `${bus.busName} ${action} at ${bus.checkpoints[checkpointIndex].name}`,
        { busId: bus._id, checkpoint: bus.checkpoints[checkpointIndex].name }
      )
    }

    successResponse(res, bus, `Marked ${action} at ${bus.checkpoints[checkpointIndex].name}`)
  } catch (err) {
    console.log('updateBusLocation error:', err)
    errorResponse(res, 500, err.message)
  }
}

// GET /api/conductor/bus/:busId/passengers
export const getBusPassengers = async (req, res) => {
  try {
    const { busId } = req.params
    const userId = req.user._id

    const assignment = await ConductorAssignment.findOne({
      conductorId: userId,
      busId: busId
    })

    if (!assignment) {
      return errorResponse(res, 403, 'You are not assigned to this bus')
    }

    const bookings = await Booking.find({
      bus: busId,
      status: { $in: ['Confirmed', 'Completed'] }
    })
   .populate('user', 'name phone')
   .sort({ createdAt: -1 })
   .lean()

    successResponse(res, bookings, 'Passengers fetched')
  } catch (err) {
    errorResponse(res, 500, err.message)
  }
}
export const updateCurrentStop = async (req, res) => {
  try {
    const { checkpointOrder } = req.body
    const conductorId = req.user._id

    const assignment = await ConductorAssignment.findOne({
      conductor: conductorId,
      date: { $gte: new Date().setHours(0,0,0,0) },
      status: 'active'
    })

    if (!assignment) return errorResponse(res, 404, 'No active trip')

    assignment.currentCheckpointOrder = checkpointOrder
    await assignment.save()

    successResponse(res, assignment, 'Stop updated')
  } catch (err) {
    errorResponse(res, 500, err.message)
  }
}

export const getTodayTrip = async (req, res) => {
  try {
    const conductorId = req.user.id;
    
    const assignment = await ConductorAssignment.findOne({
      conductorId: conductorId, // conductor না, conductorId হবে
      date: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999))
      }
    }).populate('busId'); // trip না, busId হবে

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'No trip assigned today' });
    }

    res.json({
      success: true,
      data: {
        bus: assignment.busId,
        currentCheckpointOrder: 1 // তোমার schema তে এই field নাই
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
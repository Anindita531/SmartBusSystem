import mongoose from 'mongoose'
import Bus from '../models/Bus.js'
import Booking from '../models/Booking.js'
import SeatLock from '../models/SeatLock.js'
import Waitlist from '../models/Waitlist.js'
import User from '../models/User.js'
import { successResponse, errorResponse } from '../utils/response.utils.js'
import ConductorAssignment from '../models/ConductorAssignment.js'
import { getIO } from '../config/socket.js'
import { calculateStageFare } from '../utils/fareCalculator.js'
import { createNotification } from './notification.controller.js'

export const searchBuses = async (req, res) => {
  try {
    const { from, to, date } = req.query
    console.log('Search params:', { from, to, date })

    if (!from ||!to ||!date) {
      return errorResponse(res, 400, 'Missing search parameters')
    }

    // ✅ FIX: UTC midnight use কর, BD timezone না
    // MongoDB তে journeyDate UTC 00:00 হিসাবে save আছে
    const startDate = new Date(date + 'T00:00:00.000Z')
    const endDate = new Date(date + 'T23:59:59.999Z')

    console.log('Date range UTC:', startDate, 'to', endDate)

    const buses = await Bus.find({
      from: { $regex: new RegExp(`^${from}$`, 'i') },
      to: { $regex: new RegExp(`^${to}$`, 'i') },
      journeyDate: { $gte: startDate, $lte: endDate },
      status: 'active'
    }).lean()

    console.log('Found buses:', buses.length)
    successResponse(res, buses, 'Buses fetched successfully')
  } catch (err) {
    console.log('Search bus error FULL:', err)
    errorResponse(res, 500, err.message)
  }
}

export const getAllRoutes = async (req, res) => {
  try {
    const { from } = req.query
    console.log('getAllRoutes called, from:', from)

    const baseFilter = { status: 'active' }

    if (from) {
      const toCities = await Bus.distinct('to', {
       ...baseFilter,
        from: { $regex: new RegExp(`^${from}$`, 'i') }
      })
      console.log('To cities found for', from, ':', toCities)
      return successResponse(res, toCities.sort(), 'To cities fetched')
    }

    const fromCities = await Bus.distinct('from', baseFilter)
    console.log('From cities found:', fromCities)
    successResponse(res, fromCities.sort(), 'From cities fetched')
  } catch (err) {
    console.log('Get routes error:', err)
    errorResponse(res, 500, err.message)
  }
}

export const getSeats = async (req, res) => {
  try {
    const { busId } = req.params
    const bus = await Bus.findById(busId).lean()
    if (!bus) return errorResponse(res, 404, 'Bus not found')

    const bookings = await Booking.find({
      bus: busId,
      status: { $in: ['Confirmed', 'Completed'] }
    })
    const bookedSeats = bookings.flatMap(b => b.seats)

    const locks = await SeatLock.find({
      busId,
      expiresAt: { $gt: new Date() }
    })

    const lockedSeats = locks.map(l => ({
      seatNumber: l.seatNumber,
      userId: l.userId,
      expiresAt: l.expiresAt
    }))

    const activeWaitlist = await Waitlist.findOne({
      busId,
      journeyDate: bus.journeyDate,
      notified: true,
      expiresAt: { $gt: new Date() }
    })

    let waitlistedSeats = []
    if (activeWaitlist) {
      const allSeats = Array.from({ length: bus.totalSeats }, (_, i) => `A${i + 1}`)
      const takenSeats = [...bookedSeats,...lockedSeats.map(l => l.seatNumber)]
      const availableSeats = allSeats.filter(s =>!takenSeats.includes(s))
      waitlistedSeats = availableSeats.slice(0, activeWaitlist.seatsNeeded)
    }

    successResponse(res, {
     ...bus,
      bookedSeats: bookedSeats || [],
      lockedSeats,
      waitlistedSeats,
      hasActiveWaitlist:!!activeWaitlist
    }, 'Seats fetched')
  } catch (err) {
    errorResponse(res, 500, err.message)
  }
}

export const getBusDetails = async (req, res) => {
  try {
    const { busId } = req.params

    if (!mongoose.Types.ObjectId.isValid(busId)) {
      return errorResponse(res, 400, 'Invalid bus ID')
    }

    const bus = await Bus.findById(busId)
     .populate('driver', 'name email phone')
     .populate('conductor', 'name email phone')
     .lean()

    if (!bus) return errorResponse(res, 404, 'Bus not found')

    successResponse(res, bus, 'Bus details fetched')
  } catch (err) {
    console.log('Get bus details error:', err)
    errorResponse(res, 500, err.message)
  }
}

export const createBus = async (req, res) => {
  try {
    const {
      busName, busNumber, busType, ac, from, to,
      departureTime, arrivalTime, duration,
      price, totalSeats, date, checkpoints,
      mode, driver, driverName, driverPhone,
      conductor, conductorName, conductorPhone
    } = req.body

    if (!busName ||!busNumber ||!from ||!to ||!date) {
      return errorResponse(res, 400, 'Required fields missing')
    }

    if (mode === 'B' &&!conductor) {
      return errorResponse(res, 400, 'Conductor is required for Mode B')
    }

    // ✅ FIX: Date + DepartureTime combine করে exact UTC time বানা
    const [hours, minutes] = departureTime.split(':').map(Number)
    const journeyDate = new Date(date + 'T00:00:00.000Z')
    journeyDate.setUTCHours(hours, minutes, 0, 0)

    console.log('Saving bus with journeyDate:', journeyDate) // Check কর

    const newBus = await Bus.create({
      busName,
      busNumber,
      busType,
      ac,
      mode: mode || 'A',
      from,
      to,
      departureTime,
      arrivalTime,
      duration,
      price: Number(price),
      totalSeats: Number(totalSeats),
      availableSeats: Number(totalSeats),
      journeyDate, // ✅ এখন 2026-05-31T17:30:00.000Z হবে যদি 23:00 দেয়
      checkpoints: checkpoints || [],
      bookedSeats: [],
      status: 'active',
      driver: driver || null,
      driverName: driverName || '',
      driverPhone: driverPhone || '',
      conductor: conductor || null,
      conductorName: conductorName || '',
      conductorPhone: conductorPhone || '',
      tripStatus: 'not_started',
      paymentType: mode === 'A'? 'pay_after_ride' : 'prepay'
    })

    successResponse(res, newBus, 'Bus created successfully')
  } catch (err) {
    console.log('Create bus error:', err)
    if (err.code === 11000) {
      return errorResponse(res, 400, 'Bus number already exists')
    }
    errorResponse(res, 500, err.message)
  }
}
export const quickBook = async (req, res) => {
  try {
    const { from, to } = req.body

    // 1. Find buses with available seats
    const buses = await Bus.find({
      from,
      to,
      journeyDate: { $gte: new Date() },
      status: 'active',
      availableSeats: { $gt: 0 } // IMPORTANT: seat ache kina
    }).sort({ departureTime: 1 })

    if (!buses.length) {
      return errorResponse(res, 404, 'No buses available for this route')
    }

    const bus = buses[0]

    // 2. Find first free seat
    const allSeats = Array.from({length: bus.totalSeats}, (_, i) => `S${i+1}`)
    const availableSeat = allSeats.find(s =>!bus.bookedSeats.includes(s))

    if (!availableSeat) {
      return errorResponse(res, 400, 'Bus Full. All seats booked.')
    }

    // 3. Lock seat for 5 min
    await SeatLock.create({
      busId: bus._id,
      userId: req.user._id,
      seatNumber: availableSeat,
      expiresAt: new Date(Date.now() + 5 * 60000)
    })

    return successResponse(res, {
      bus,
      seatNumber: availableSeat,
      price: bus.price,
      boardingPoint: bus.from,
      droppingPoint: bus.to
    })

  } catch (err) {
    return errorResponse(res, 500, err.message)
  }
}
export const getConductors = async (req, res) => {
  try {
    console.log('getConductors called by:', req.user?.id)

    const conductors = await User.find({ role: 'conductor' })
     .select('name email phone')
     .lean()

    console.log('Found conductors:', conductors.length)
    res.json({ data: conductors })
  } catch (err) {
    console.log('getConductors error:', err)
    res.status(500).json({ message: err.message })
  }
}

export const assignConductor = async (req, res) => {
  try {
    const { id } = req.params
    const { conductorId } = req.body

    const conductor = await User.findById(conductorId)
    if (!conductor || conductor.role!== 'conductor') {
      return errorResponse(res, 400, 'Invalid conductor')
    }

    const bus = await Bus.findById(id)
    if (!bus) return errorResponse(res, 404, 'Bus not found')

    try {
      await ConductorAssignment.create({
        conductorId: conductorId,
        busId: id,
        date: bus.journeyDate,
        status: 'assigned',
        assignedBy: req.user._id
      })
    } catch (err) {
      if (err.code === 11000) {
        return errorResponse(res, 400, 'Conductor already assigned on this date')
      }
      throw err
    }

    bus.conductor = conductorId
    bus.conductorName = conductor.name
    bus.conductorPhone = conductor.phone
    await bus.save()

    await createNotification(
      conductorId,
      'conductor_assigned',
      'New Bus Assigned',
      `You have been assigned to ${bus.busName} on ${new Date(bus.journeyDate).toLocaleDateString('en-GB')}`,
      { busId: bus._id }
    )

    successResponse(res, bus, 'Conductor assigned successfully')
  } catch (err) {
    errorResponse(res, 500, err.message)
  }
}

export const removeConductor = async (req, res) => {
  try {
    const bus = await Bus.findByIdAndUpdate(
      req.params.id,
      {
        $unset: { conductor: 1, conductorName: 1, conductorPhone: 1, conductorAssignedAt: 1 }
      },
      { new: true }
    )
    res.json({ message: 'Conductor removed', data: bus })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getBuses = async (req, res) => {
  try {
    const { page = 1, limit = 20, from, to, status } = req.query

    const query = {}
    if (from) query.from = new RegExp(from, 'i')
    if (to) query.to = new RegExp(to, 'i')
    if (status) query.status = status

    const buses = await Bus.find(query)
     .populate('conductor', 'name phone email')
     .populate('driver', 'name phone email')
     .sort({ createdAt: -1 })
     .limit(limit * 1)
     .skip((page - 1) * limit)
     .lean()

    const count = await Bus.countDocuments(query)

    res.json({
      data: buses,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      total: count
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getConductorBuses = async (req, res) => {
  try {
    const userId = req.user._id
    const buses = await Bus.find({
      $or: [
        { conductor: userId },
        { driver: userId }
      ],
      status: 'active'
    })
   .populate('driver', 'name phone')
   .populate('conductor', 'name phone')
   .sort({ journeyDate: 1 })
   .lean()

    successResponse(res, buses, 'Assigned buses fetched')
  } catch (err) {
    errorResponse(res, 500, err.message)
  }
}

export const updateBusStatus = async (req, res) => {
  try {
    const { status } = req.body
    const bus = await Bus.findById(req.params.id)
    const userId = req.user._id
    const userRole = req.user.role

    if (!bus) return errorResponse(res, 404, 'Bus not found')

    const isDriver = bus.driver?.toString() === userId.toString()
    const isConductor = bus.conductor?.toString() === userId.toString()

    if (!isDriver &&!isConductor) {
      return errorResponse(res, 403, 'Not authorized')
    }

    const updateData = {
      tripStatus: status,
      lastUpdatedBy: userId,
      lastUpdatedAt: new Date()
    }

    if (status === 'started' && userRole === 'driver') {
      updateData.driverDutyStart = new Date()
      updateData.startedAt = new Date()
      updateData.currentCheckpointOrder = 1
    }

    if (status === 'completed') {
      updateData.driverDutyEnd = new Date()
      updateData.conductorDutyEnd = new Date()
      updateData.completedAt = new Date()
    }

    const updatedBus = await Bus.findByIdAndUpdate(req.params.id, updateData, { new: true })
    successResponse(res, updatedBus, `Trip ${status}`)
  } catch (err) {
    errorResponse(res, 500, err.message)
  }
}

export const assignDriver = async (req, res) => {
  try {
    const { id } = req.params
    const { driverId } = req.body

    const driver = await User.findById(driverId)
    if (!driver || driver.role!== 'driver') {
      return errorResponse(res, 400, 'Invalid driver')
    }

    const alreadyAssigned = await Bus.findOne({
      driver: driverId,
      status: 'active',
      journeyDate: { $gte: new Date() }
    })
    if (alreadyAssigned) {
      return errorResponse(res, 400, `Already assigned to ${alreadyAssigned.busName}`)
    }

    const bus = await Bus.findByIdAndUpdate(
      id,
      {
        driver: driverId,
        driverName: driver.name,
        driverPhone: driver.phone,
        driverAssignedAt: new Date()
      },
      { new: true }
    ).populate('driver conductor', 'name phone')

    await createNotification(
      driverId,
      'driver_assigned',
      'New Bus Assigned',
      `You have been assigned to ${bus.busName} (${bus.busNumber}) for ${bus.from} → ${bus.to}`,
      { busId: bus._id }
    )

    successResponse(res, bus, 'Driver assigned successfully')
  } catch (err) {
    errorResponse(res, 500, err.message)
  }
}

export const removeDriver = async (req, res) => {
  try {
    const bus = await Bus.findByIdAndUpdate(
      req.params.id,
      {
        $unset: { driver: 1, driverName: 1, driverPhone: 1, driverAssignedAt: 1 }
      },
      { new: true }
    )
    successResponse(res, bus, 'Driver removed')
  } catch (err) {
    errorResponse(res, 500, err.message)
  }
}

export const updateBusLocation = async (req, res) => {
  try {
    const { id } = req.params
    const { lat, lng, checkpointIndex, status } = req.body
    const userId = req.user._id

    const bus = await Bus.findById(id)
    if (!bus) return errorResponse(res, 404, 'Bus not found')

    const isDriver = bus.driver?.toString() === userId.toString()
    const isConductor = bus.conductor?.toString() === userId.toString()
    if (!isDriver &&!isConductor) {
      return errorResponse(res, 403, 'You are not assigned to this bus')
    }

    if (bus.mode === 'A' && lat!== undefined && lng!== undefined) {
      bus.gpsLocation = {
        type: 'Point',
        coordinates: [lng, lat]
      }
      bus.lastLocationUpdate = new Date()
      bus.tripStatus = 'started'
      bus.lastUpdatedBy = userId
      bus.lastUpdatedAt = new Date()

      await bus.save()

      const io = getIO()
      io.to(`bus:${id}`).emit('locationUpdate', {
        busId: id,
        latitude: lat,
        longitude: lng,
        timestamp: bus.lastLocationUpdate,
        mode: 'A'
      })

      return successResponse(res, { message: 'GPS location updated' })
    }

    if (bus.mode === 'B' && checkpointIndex!== undefined) {
      if (!bus.checkpoints ||!bus.checkpoints[checkpointIndex]) {
        return errorResponse(res, 400, 'Invalid checkpoint index')
      }

      const currentTime = new Date().toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })

      if (status === 'arrived') {
        if (bus.checkpoints[checkpointIndex].actualArrivalTime) {
          return errorResponse(res, 400, 'Already arrived')
        }
        bus.checkpoints[checkpointIndex].actualArrivalTime = currentTime
        bus.tripStatus = 'started'
      } else if (status === 'departed') {
        if (!bus.checkpoints[checkpointIndex].actualArrivalTime) {
          return errorResponse(res, 400, 'Must arrive first')
        }
        if (bus.checkpoints[checkpointIndex].actualDepartedTime) {
          return errorResponse(res, 400, 'Already departed')
        }
        bus.checkpoints[checkpointIndex].actualDepartedTime = currentTime
        bus.tripStatus = 'started'
      }

      bus.currentLocationName = bus.checkpoints[checkpointIndex].name
      bus.currentCheckpointOrder = checkpointIndex
      bus.lastUpdatedBy = userId
      bus.lastUpdatedAt = new Date()

      await bus.save()

      const io = getIO()
      io.to(`bus:${id}`).emit('checkpointUpdate', {
        busId: id,
        checkpoint: bus.checkpoints[checkpointIndex].name,
        status,
        mode: 'B',
        timestamp: bus.lastUpdatedAt
      })

      return successResponse(res, bus, 'Checkpoint updated')
    }

    return errorResponse(res, 400, 'Invalid request')

  } catch (err) {
    console.log('Update location error:', err)
    errorResponse(res, 500, err.message)
  }
}

export const updateCheckpoint = async (req, res) => {
  try {
    const { id } = req.params
    const { checkpointOrder, action } = req.body

    const bus = await Bus.findById(id)
    if (!bus) return errorResponse(res, 404, 'Bus not found')

    if (bus.tripStatus!== 'started') {
      return errorResponse(res, 400, 'Start the trip first')
    }

    const orderNum = Number(checkpointOrder)
    const checkpointIndex = bus.checkpoints.findIndex(cp => cp.order === orderNum)

    if (checkpointIndex === -1) {
      return errorResponse(res, 404, `Checkpoint ${orderNum} not found`)
    }

    const currentTime = new Date().toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })

    if (action === 'arrived') {
      if (bus.checkpoints[checkpointIndex].actualArrivalTime) {
        return errorResponse(res, 400, 'Already arrived')
      }
      bus.checkpoints[checkpointIndex].actualArrivalTime = currentTime
      bus.currentLocation = bus.checkpoints[checkpointIndex].name
      bus.currentCheckpointOrder = orderNum
    } else if (action === 'departed') {
      if (!bus.checkpoints[checkpointIndex].actualArrivalTime) {
        return errorResponse(res, 400, 'Must arrive first')
      }
      if (bus.checkpoints[checkpointIndex].actualDepartedTime) {
        return errorResponse(res, 400, 'Already departed')
      }
      bus.checkpoints[checkpointIndex].actualDepartedTime = currentTime
    }

    bus.lastUpdatedBy = req.user._id
    bus.lastUpdatedAt = new Date()
    await bus.save()

    successResponse(res, bus, `Marked ${action} at ${bus.checkpoints[checkpointIndex].name}`)
  } catch (err) {
    console.error('Update checkpoint error:', err)
    errorResponse(res, 500, err.message)
  }
}

export const trackBus = async (req, res) => {
  try {
    const { id } = req.params
    console.log('Track bus request for ID:', id)

    const bus = await Bus.findById(id)
    .select('busName busNumber from to departureTime arrivalTime journeyDate checkpoints tripStatus currentLocation lastUpdatedAt mode gpsLocation currentCheckpointOrder')
    .lean()

    if (!bus) {
      return errorResponse(res, 404, 'Bus not found')
    }

    const lastArrived = [...(bus.checkpoints || [])]
    .reverse()
    .find(cp => cp.actualArrivalTime)

    const nextCheckpoint = (bus.checkpoints || [])
    .sort((a, b) => a.order - b.order)
    .find(cp =>!cp.actualArrivalTime)

    successResponse(res, {
    ...bus,
      lastArrived: lastArrived || null,
      nextCheckpoint: nextCheckpoint || null
    }, 'Bus location fetched')

  } catch (err) {
    console.log('Track bus error:', err)
    errorResponse(res, 500, err.message)
  }
}

export const startTrip = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id)
    if (!bus) return errorResponse(res, 404, 'Bus not found')

    if (bus.driver?.toString()!== req.user._id.toString()) {
      return errorResponse(res, 403, 'Only assigned driver can start trip')
    }

    bus.tripStatus = 'started'
    bus.currentCheckpointOrder = 1
    bus.currentLocation = bus.from
    bus.startedAt = new Date()
    await bus.save()

    successResponse(res, bus, 'Trip started')
  } catch (err) {
    errorResponse(res, 500, err.message)
  }
}
export const quickBookOptions = async (req, res) => {
  try {
    const { from, to, date } = req.body
    if (!from ||!to ||!date) {
      return errorResponse(res, 400, 'From, To and Date are required')
    }

    // Selected date er 00:00 to 23:59 UTC range
    const selectedDate = new Date(date)
    selectedDate.setUTCHours(0, 0, 0, 0)
    const nextDate = new Date(selectedDate)
    nextDate.setUTCDate(nextDate.getUTCDate() + 1)

    const baseQuery = {
      from: { $regex: new RegExp(`^${from.trim()}$`, 'i') },
      to: { $regex: new RegExp(`^${to.trim()}$`, 'i') },
      journeyDate: { $gte: selectedDate, $lt: nextDate },
      availableSeats: { $gt: 0 },
      status: 'active',
      tripStatus: { $in: ['not_started', 'started'] }
    }

    const modeABus = await Bus.findOne({ ...baseQuery, mode: 'A' })
      .sort({ departureTime: 1 })

    const modeBBus = await Bus.findOne({ ...baseQuery, mode: 'B' })
      .sort({ departureTime: 1 })

    console.log('Query:', baseQuery)
    console.log('Found:', { modeA: !!modeABus, modeB: !!modeBBus })

    if (!modeABus &&!modeBBus) {
      return errorResponse(res, 404, 'No buses available for this route')
    }

    const getFreeSeat = (bus) => {
      if (!bus) return null
      const allSeats = Array.from({ length: bus.totalSeats }, (_, i) => `S${i + 1}`)
      const seat = allSeats.find(s =>!bus.bookedSeats.includes(s))
      if (!seat) return null

      return {
        busId: bus._id,
        busName: bus.busName,
        busNumber: bus.busNumber,
        busType: bus.busType,
        mode: bus.mode,
        from: bus.from,
        to: bus.to,
        departureTime: bus.departureTime,
        arrivalTime: bus.arrivalTime,
        journeyDate: bus.journeyDate,
        seat,
        price: bus.price,
        availableSeats: bus.availableSeats
      }
    }

    return successResponse(res, {
      payAfterRide: getFreeSeat(modeABus),
      payNow: getFreeSeat(modeBBus)
    })
  } catch (err) {
    console.error('quickBookOptions error:', err)
    return errorResponse(res, 500, err.message)
  }
}

export const getActiveBookings = async (req, res) => {
  try {
    const { busId } = req.params

    if (!mongoose.Types.ObjectId.isValid(busId)) {
      return errorResponse(res, 400, 'Invalid bus ID')
    }

    const bookings = await Booking.find({
      bus: busId,
      paymentType: 'pay_after_ride',
      paymentStatus: 'Paid',        // payment hoye geche
      exitCodeUsed: false,          // exit code use hoy ni
      exitCodeExpiresAt: { $gt: new Date() },
      status: 'Completed'           // ✅ Confirmed na, Completed
    })
    .lean()

    successResponse(res, bookings, 'Active bookings fetched')
  } catch (err) {
    errorResponse(res, 500, err.message)
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
export const verifyExitCode = async (req, res) => {
  try {
    const { busId } = req.params
    const { code } = req.body

    const booking = await Booking.findOne({
      bus: busId,
      exitCode: code,
      status: 'Confirmed',
      exitCodeUsed: { $ne: true },  // ✅
      exitCodeExpiresAt: { $gt: new Date() } // expiry check
    })

    if (!booking) {
      return errorResponse(res, 400, 'Invalid or expired code')
    }

    booking.exitCodeUsed = true
    booking.status = 'Completed'
    booking.completedAt = new Date()
    await booking.save()

    successResponse(res, booking, 'Passenger verified successfully')
  } catch (err) {
    errorResponse(res, 500, err.message)
  }
}
export const markCashPayment = async (req, res) => {
  try {
    const { busId } = req.params
    const { bookingId } = req.body
    const driverId = req.user._id

    const booking = await Booking.findOne({
      _id: bookingId,
      bus: busId,
      paymentType: 'pay_after_ride',
      paymentStatus: 'Pending',
      exitCodeUsed: false
    })
    
    if (!booking) return errorResponse(res, 404, 'Booking not found or already paid')

    // Cash payment mark koro
    booking.paymentStatus = 'Paid'
    booking.paymentMethod = 'cash'
    booking.status = 'Completed'
    booking.paidAt = new Date()
    booking.exitCode = Math.floor(100000 + Math.random() * 900000).toString()
    booking.exitCodeExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
    
    await booking.save()

    // Passenger ke notification pathao
    await createNotification(
      booking.user,
      'exit_code',
      'Exit Code Generated',
      `Your exit code is ${booking.exitCode}. Show this to driver before exit.`,
      { bookingId: booking._id }
    )

    successResponse(res, booking, 'Cash payment confirmed. Exit code sent to passenger')
  } catch (err) {
    errorResponse(res, 500, err.message)
  }
}
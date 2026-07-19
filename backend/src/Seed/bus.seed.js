import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Bus from '../models/Bus.js'
import connectDB from '../config/db.js'

dotenv.config()

const getDateOnly = (offset = 0) => {
  const now = new Date()
  const bdTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }))
  bdTime.setHours(0, 0, 0, 0)
  bdTime.setDate(bdTime.getDate() + offset)
  return bdTime
}

// ✅ DISTANCE MAP
const distanceMap = {
  'Dhaka-Chittagong': 250, 'Dhaka-Sylhet': 240, 'Dhaka-Cox Bazar': 400,
  'Dhaka-Khulna': 280, 'Dhaka-Teknaf': 490, 'Dhaka-Rajshahi': 260,
  'Chittagong-Dhaka': 250, 'Sylhet-Dhaka': 240, 'Rajshahi-Dhaka': 260,
  'Kolkata-Siliguri': 580, 'Kolkata-Digha': 180,
  'Behala-Bonhoogly': 18
}

// ✅ COMMON STOPS MAP
const routeStops = {
  'Dhaka-Chittagong': ['Dhaka', 'Cumilla', 'Feni', 'Chittagong'],
  'Dhaka-Sylhet': ['Dhaka', 'Narsingdi', 'Bhairab', 'Habiganj', 'Sylhet'],
  'Dhaka-Cox Bazar': ['Dhaka', 'Cumilla', 'Feni', 'Chittagong', 'Cox Bazar'],
  'Dhaka-Khulna': ['Dhaka', 'Manikganj', 'Faridpur', 'Jessore', 'Khulna'],
  'Dhaka-Teknaf': ['Dhaka', 'Cumilla', 'Chittagong', 'Cox Bazar', 'Teknaf'],
  'Dhaka-Rajshahi': ['Dhaka', 'Tangail', 'Natore', 'Rajshahi'],
  'Chittagong-Dhaka': ['Chittagong', 'Feni', 'Cumilla', 'Dhaka'],
  'Sylhet-Dhaka': ['Sylhet', 'Habiganj', 'Bhairab', 'Narsingdi', 'Dhaka'],
  'Rajshahi-Dhaka': ['Rajshahi', 'Natore', 'Tangail', 'Dhaka'],
  'Kolkata-Siliguri': ['Kolkata', 'Krishnanagar', 'Malda', 'Raiganj', 'Siliguri'],
  'Kolkata-Digha': ['Kolkata', 'Nandigram', 'Contai', 'Digha'],
  'Behala-Bonhoogly': ['Behala', 'Taratala', 'Mominpur', 'Khidirpur', 'Esplanade', 'Shyambazar', 'Bonhoogly']
}

// ✅ AUTO GENERATE FUNCTION
const createBus = (data) => {
  const routeKey = `${data.from}-${data.to}`
  const distance = distanceMap[routeKey] || 200
  const stops = routeStops[routeKey] || [data.from, data.to]
  const durationHours = Math.ceil(distance / 50)
  const [depH, depM] = data.departureTime.split(':').map(Number)
  const arrH = depH + durationHours
  const arrivalTime = `${String(arrH).padStart(2,'0')}:${String(depM).padStart(2,'0')}`

  // auto checkpoints
  const checkpoints = stops.map((stop, i) => {
    const stopDistance = Math.round(distance * (i / (stops.length - 1)))
    const stopTime = depH + Math.round(durationHours * (i / (stops.length - 1)))
    const fare = Math.round(data.price * (stopDistance / distance))
    return {
      name: stop,
      order: i + 1,
      estimatedTime: `${String(stopTime).padStart(2,'0')}:${String(depM).padStart(2,'0')}`,
      distanceFromStart: stopDistance,
      fareFromHere: data.price - fare
    }
  })

  // ✅ UNIQUE BUS NUMBER
  const routeCode = data.from.substring(0,1) + data.to.substring(0,1)
  const uniqueBusNumber = `${data.busNumber}-${routeCode}-${data.departureTime.replace(':','')}`

  return {
    busName: data.busName,
    busNumber: uniqueBusNumber,
    busType: data.busType,
    mode: data.mode, // ✅ IMPORTANT
    ac: data.ac,
    from: data.from,
    to: data.to,
    departureTime: data.departureTime,
    arrivalTime: arrivalTime,
    duration: `${durationHours}h`,
    price: data.price,
    totalSeats: data.totalSeats || 40,
    availableSeats: data.totalSeats || 40,
    journeyDate: getDateOnly(0),
    checkpoints: checkpoints,
    bookedSeats: [],
    status: 'active',
    tripStatus: 'not_started',
    // Mode A hole gpsLocation add hobe
   ...(data.mode === 'A' && {
      gpsLocation: { type: 'Point', coordinates: [88.3, 22.5] } // Kolkata default
    })
  }
}

// ✅ SUDHU EI ARRAY TA EDIT KORBI
const busConfigs = [
  // Dhaka Routes - Mode B
  { from: 'Dhaka', to: 'Chittagong', busName: 'Green Line', busNumber: 'GL-101', busType: 'AC Sleeper', mode: 'B', ac: true, departureTime: '05:00', price: 1200 },
  { from: 'Dhaka', to: 'Chittagong', busName: 'TR Travels', busNumber: 'TR-901', busType: 'AC Sleeper', mode: 'B', ac: true, departureTime: '05:30', price: 1300 },
  { from: 'Dhaka', to: 'Chittagong', busName: 'Star Line', busNumber: 'SL-1001', busType: 'AC Seater', mode: 'B', ac: true, departureTime: '06:00', price: 1000 },
  { from: 'Dhaka', to: 'Sylhet', busName: 'Shohagh Paribahan', busNumber: 'SP-205', busType: 'Non-AC Seater', mode: 'B', ac: false, departureTime: '06:30', price: 700 },
  { from: 'Chittagong', to: 'Dhaka', busName: 'Hanif Enterprise', busNumber: 'HE-310', busType: 'AC Seater', mode: 'B', ac: true, departureTime: '07:00', price: 1100 },
  { from: 'Dhaka', to: 'Cox Bazar', busName: 'Ena Transport', busNumber: 'ET-401', busType: 'AC Sleeper', mode: 'B', ac: true, departureTime: '07:30', price: 1500 },
  { from: 'Dhaka', to: 'Khulna', busName: 'Shyamoli NR', busNumber: 'SN-501', busType: 'Non-AC Sleeper', mode: 'B', ac: false, departureTime: '08:00', price: 800 },
  { from: 'Sylhet', to: 'Dhaka', busName: 'Desh Travels', busNumber: 'DT-601', busType: 'AC Seater', mode: 'B', ac: true, departureTime: '08:30', price: 750 },
  { from: 'Dhaka', to: 'Teknaf', busName: 'Saintmartin Paribahan', busNumber: 'SM-701', busType: 'AC Sleeper', mode: 'B', ac: true, departureTime: '05:00', price: 1800 },
  { from: 'Rajshahi', to: 'Dhaka', busName: 'Eagle Paribahan', busNumber: 'EP-801', busType: 'Non-AC Seater', mode: 'B', ac: false, departureTime: '09:00', price: 600 },

  // Kolkata Long Routes - Mode B
  { from: 'Kolkata', to: 'Siliguri', busName: 'Royal Cruiser', busNumber: 'RC-001', busType: 'AC Sleeper', mode: 'B', ac: true, departureTime: '05:00', price: 900 },
  { from: 'Kolkata', to: 'Siliguri', busName: 'Greenline Express', busNumber: 'GL-502', busType: 'AC Seater', mode: 'B', ac: true, departureTime: '05:30', price: 850 },
  { from: 'Kolkata', to: 'Siliguri', busName: 'Night Rider', busNumber: 'NR-888', busType: 'AC Sleeper', mode: 'B', ac: true, departureTime: '06:00', price: 950 },
  { from: 'Kolkata', to: 'Siliguri', busName: 'Shyamoli Paribahan', busNumber: 'SP-777', busType: 'Non-AC Seater', mode: 'B', ac: false, departureTime: '06:30', price: 600 },
  { from: 'Kolkata', to: 'Siliguri', busName: 'Volvo Premium', busNumber: 'VP-999', busType: 'AC Sleeper', mode: 'B', ac: true, departureTime: '07:00', price: 1200 },
  { from: 'Kolkata', to: 'Siliguri', busName: 'Night Queen', busNumber: 'NQ-333', busType: 'AC Sleeper', mode: 'B', ac: true, departureTime: '07:30', price: 1100 },

  // Kolkata to Digha - Mode B
  { from: 'Kolkata', to: 'Digha', busName: 'SBSTC Volvo', busNumber: 'SB-501', busType: 'AC Seater', mode: 'B', ac: true, departureTime: '05:30', price: 250 },
  { from: 'Kolkata', to: 'Digha', busName: 'Green Line', busNumber: 'GL-D01', busType: 'AC Sleeper', mode: 'B', ac: true, departureTime: '06:00', price: 300 },
  { from: 'Kolkata', to: 'Digha', busName: 'Shyamoli', busNumber: 'SP-D02', busType: 'Non-AC Seater', mode: 'B', ac: false, departureTime: '06:30', price: 180 },
  { from: 'Kolkata', to: 'Digha', busName: 'CTC Express', busNumber: 'CTC-D03', busType: 'AC Seater', mode: 'B', ac: true, departureTime: '07:00', price: 220 },
  { from: 'Kolkata', to: 'Digha', busName: 'Royal Cruiser', busNumber: 'RC-D04', busType: 'Non-AC Seater', mode: 'B', ac: false, departureTime: '07:30', price: 150 },

  // ✅ Kolkata Local Routes - Mode A for Live Tracking
  { from: 'Behala', to: 'Bonhoogly', busName: 'S7', busNumber: 'S7', busType: 'Non-AC Seater', mode: 'A', ac: false, departureTime: '06:00', price: 25 },
  { from: 'Behala', to: 'Bonhoogly', busName: 'S7A', busNumber: 'S7A', busType: 'AC Seater', mode: 'A', ac: true, departureTime: '06:30', price: 40 },
  { from: 'Behala', to: 'Bonhoogly', busName: 'AC50', busNumber: 'AC50', busType: 'AC Seater', mode: 'A', ac: true, departureTime: '07:00', price: 50 },
]

const buses = busConfigs.map(createBus)

const seedBuses = async () => {
  try {
    await connectDB()
    console.log('✅ MongoDB Connected')

    await Bus.deleteMany({})
    console.log('🗑️ Old buses cleared')

    const result = await Bus.insertMany(buses)
    console.log(`✅ ${result.length} buses seeded successfully!`)

    console.log('\n📅 Seeded Routes:')
    result.forEach(bus => {
      console.log(`${bus.busNumber} | ${bus.from} → ${bus.to} | Mode:${bus.mode} | ${bus.departureTime} | ₹${bus.price}`)
    })

    process.exit(0)
  } catch (err) {
    console.error('❌ Seeding failed:', err)
    process.exit(1)
  }
}

seedBuses()
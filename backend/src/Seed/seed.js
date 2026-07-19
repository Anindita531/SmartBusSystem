import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Bus from '../models/Bus.js'

dotenv.config()

const today = new Date('2026-05-21T00:00:00.000Z')
const tomorrow = new Date('2026-05-22T00:00:00.000Z')
const day3 = new Date('2026-05-23T00:00:00.000Z')
const day4 = new Date('2026-05-24T00:00:00.000Z')

const buses = [
  // Bangladesh Routes - Dhaka to Chittagong
  {
    busName: 'Green Line',
    busNumber: 'GL-101',
    busType: 'AC Sleeper',
    ac: true,
    from: 'Dhaka',
    to: 'Chittagong',
    departureTime: '22:00',
    arrivalTime: '06:00',
    duration: '8h',
    price: 1200,
    totalSeats: 40,
    availableSeats: 40,
    journeyDate: today,
    status: 'active'
  },
  {
    busName: 'TR Travels',
    busNumber: 'TR-901',
    busType: 'AC Sleeper',
    ac: true,
    from: 'Dhaka',
    to: 'Chittagong',
    departureTime: '23:30',
    arrivalTime: '07:30',
    duration: '8h',
    price: 1300,
    totalSeats: 40,
    availableSeats: 40,
    journeyDate: tomorrow,
    status: 'active'
  },
  {
    busName: 'Star Line',
    busNumber: 'SL-1001',
    busType: 'AC Seater',
    ac: true,
    from: 'Dhaka',
    to: 'Chittagong',
    departureTime: '07:00',
    arrivalTime: '15:00',
    duration: '8h',
    price: 1000,
    totalSeats: 36,
    availableSeats: 36,
    journeyDate: day3,
    status: 'active'
  },
  {
    busName: 'Hanif Enterprise',
    busNumber: 'HE-310',
    busType: 'AC Seater',
    ac: true,
    from: 'Chittagong',
    to: 'Dhaka',
    departureTime: '23:00',
    arrivalTime: '07:00',
    duration: '8h',
    price: 1100,
    totalSeats: 36,
    availableSeats: 36,
    journeyDate: today,
    status: 'active'
  },
  
  // Dhaka to Sylhet
  {
    busName: 'Shohagh Paribahan',
    busNumber: 'SP-205',
    busType: 'Non-AC Seater',
    ac: false,
    from: 'Dhaka',
    to: 'Sylhet',
    departureTime: '08:30',
    arrivalTime: '14:30',
    duration: '6h',
    price: 700,
    totalSeats: 45,
    availableSeats: 45,
    journeyDate: today,
    status: 'active'
  },
  {
    busName: 'Desh Travels',
    busNumber: 'DT-601',
    busType: 'AC Seater',
    ac: true,
    from: 'Sylhet',
    to: 'Dhaka',
    departureTime: '09:00',
    arrivalTime: '15:00',
    duration: '6h',
    price: 750,
    totalSeats: 36,
    availableSeats: 36,
    journeyDate: day3,
    status: 'active'
  },
  
  // Dhaka to Cox Bazar / Teknaf
  {
    busName: 'Ena Transport',
    busNumber: 'ET-401',
    busType: 'AC Sleeper',
    ac: true,
    from: 'Dhaka',
    to: 'Cox Bazar',
    departureTime: '21:00',
    arrivalTime: '07:00',
    duration: '10h',
    price: 1500,
    totalSeats: 40,
    availableSeats: 40,
    journeyDate: tomorrow,
    status: 'active'
  },
  {
    busName: 'Saintmartin Paribahan',
    busNumber: 'SM-701',
    busType: 'AC Sleeper',
    ac: true,
    from: 'Dhaka',
    to: 'Teknaf',
    departureTime: '20:00',
    arrivalTime: '08:00',
    duration: '12h',
    price: 1800,
    totalSeats: 40,
    availableSeats: 40,
    journeyDate: day3,
    status: 'active'
  },
  
  // Dhaka to Khulna / Rajshahi
  {
    busName: 'Shyamoli NR',
    busNumber: 'SN-501',
    busType: 'Non-AC Sleeper',
    ac: false,
    from: 'Dhaka',
    to: 'Khulna',
    departureTime: '22:30',
    arrivalTime: '06:30',
    duration: '8h',
    price: 800,
    totalSeats: 40,
    availableSeats: 40,
    journeyDate: tomorrow,
    status: 'active'
  },
  {
    busName: 'Eagle Paribahan',
    busNumber: 'EP-801',
    busType: 'Non-AC Seater',
    ac: false,
    from: 'Rajshahi',
    to: 'Dhaka',
    departureTime: '07:00',
    arrivalTime: '13:00',
    duration: '6h',
    price: 600,
    totalSeats: 45,
    availableSeats: 45,
    journeyDate: day4,
    status: 'active'
  },
  
  // Kolkata to Siliguri - 4 days data
  {
    busName: 'SBSTC Express',
    busNumber: 'WB-01-1234',
    busType: 'AC Sleeper',
    ac: true,
    from: 'Kolkata',
    to: 'Siliguri',
    departureTime: '22:00',
    arrivalTime: '08:00',
    duration: '10h',
    price: 850,
    totalSeats: 40,
    availableSeats: 40,
    journeyDate: today,
    status: 'active'
  },
  {
    busName: 'Royal Cruiser',
    busNumber: 'WB-02-5678',
    busType: 'AC Seater',
    ac: true,
    from: 'Kolkata',
    to: 'Siliguri',
    departureTime: '20:30',
    arrivalTime: '06:00',
    duration: '9h 30m',
    price: 720,
    totalSeats: 45,
    availableSeats: 45,
    journeyDate: today,
    status: 'active'
  },
  {
    busName: 'Green Line',
    busNumber: 'WB-03-9012',
    busType: 'Non-AC',
    ac: false,
    from: 'Kolkata',
    to: 'Siliguri',
    departureTime: '21:00',
    arrivalTime: '07:30',
    duration: '10h 30m',
    price: 550,
    totalSeats: 50,
    availableSeats: 50,
    journeyDate: today,
    status: 'active'
  },
  {
    busName: 'SBSTC Express',
    busNumber: 'WB-01-1235',
    busType: 'AC Sleeper',
    ac: true,
    from: 'Kolkata',
    to: 'Siliguri',
    departureTime: '22:00',
    arrivalTime: '08:00',
    duration: '10h',
    price: 850,
    totalSeats: 40,
    availableSeats: 40,
    journeyDate: tomorrow,
    status: 'active'
  },
  {
    busName: 'Royal Cruiser',
    busNumber: 'WB-02-5679',
    busType: 'AC Seater',
    ac: true,
    from: 'Kolkata',
    to: 'Siliguri',
    departureTime: '20:30',
    arrivalTime: '06:00',
    duration: '9h 30m',
    price: 720,
    totalSeats: 45,
    availableSeats: 45,
    journeyDate: tomorrow,
    status: 'active'
  }
]

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('✅ MongoDB Connected')
    
    await Bus.deleteMany({}) // ✅ সব পুরান বাস ডিলিট - ডুপ্লিকেট থাকবে না
    console.log('🗑️ Deleted all old buses')
    
    const result = await Bus.insertMany(buses)
    console.log(`✅ ${result.length} buses inserted`)
    
    console.log('\n📅 All Routes:')
    result.forEach(bus => {
      console.log(`${bus.from} → ${bus.to} | ${bus.journeyDate.toDateString()} | ${bus.busName}`)
    })
    
    process.exit(0)
  } catch (err) {
    console.error('❌ Seeding failed:', err)
    process.exit(1)
  }
}

seedDB()
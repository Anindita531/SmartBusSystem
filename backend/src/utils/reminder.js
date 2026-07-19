import Booking from '../models/Booking.js'
import Bus from '../models/Bus.js'

export const sendReminder = async () => {
  try {
    const now = new Date()
    const after5Min = new Date(now.getTime() + 5 * 60 * 1000)

    // ✅ শুধু Confirmed booking, 5 মিনিট আগে
    const bookings = await Booking.find({
      status: 'Confirmed',
      reminder5Sent: false
    }).populate('bus user')

    for (const booking of bookings) {
      if (!booking.bus || !booking.bus.departureTime) continue

      const [hours, minutes] = booking.bus.departureTime.split(':')
      const busDeparture = new Date(booking.journeyDate)
      busDeparture.setHours(parseInt(hours), parseInt(minutes), 0, 0)

      // 5 মিনিটের মধ্যে হলে রিমাইন্ড
      if (busDeparture > now && busDeparture <= after5Min) {
        console.log(`📢 5 MIN REMINDER: ${booking.user.name} - ${booking.bus.busName} | PNR: ${booking.pnr} | Seats: ${booking.seats.join(', ')}`)
        console.log(`📍 Boarding: ${booking.bus.from} at ${booking.bus.departureTime}`)
        
        booking.reminder5Sent = true
        await booking.save()
      }
    }

    // ✅ Bonus: Locked seats এর জন্য রিমাইন্ড - 5 মিনিট আগে
    const busesWithLocks = await Bus.find({
      'lockedSeats.expiresAt': { $gt: now }
    }).populate('lockedSeats.userId')

    for (const bus of busesWithLocks) {
      const [hours, minutes] = bus.departureTime.split(':')
      const busDeparture = new Date(bus.journeyDate)
      busDeparture.setHours(parseInt(hours), parseInt(minutes), 0, 0)

      if (busDeparture > now && busDeparture <= after5Min) {
        for (const lock of bus.lockedSeats) {
          if (lock.expiresAt > now && lock.userId && !lock.reminderSent) {
            console.log(`🔒 LOCK REMINDER: ${lock.userId.name} - ${bus.busName} | Seat: ${lock.seatNumber}`)
            console.log(`⚠️ Lock expires in ${Math.round((lock.expiresAt - now) / 60000)} min. Book now!`)
            
            lock.reminderSent = true
          }
        }
        await bus.save()
      }
    }

  } catch (err) {
    console.log('Reminder cron error:', err.message)
  }
}
import cron from 'node-cron'
import Seat from '../models/Seat.js'

cron.schedule('*/5 * * * *', async () => {
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)
  await Seat.updateMany(
    { isHeld: true, heldAt: { $lt: fiveMinAgo } },
    { isHeld: false, heldBy: null, heldAt: null }
  )
  console.log('Expired seat holds cleared')
})
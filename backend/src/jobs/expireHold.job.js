import Seat from '../models/Seat.js'

export const expireHolds = async () => {
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000)
  await Seat.updateMany(
    { isHeld: true, heldAt: { $lt: tenMinAgo } },
    { isHeld: false, heldBy: null, heldAt: null }
  )
}
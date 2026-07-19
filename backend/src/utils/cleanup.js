// utils/cleanup.js
export const cleanupOrphanLocks = async () => {
  const locks = await SeatLock.find().populate('busId')
  const orphanIds = locks.filter(l => !l.busId).map(l => l._id)
  await SeatLock.deleteMany({ _id: { $in: orphanIds } })
  console.log(`Deleted ${orphanIds.length} orphan locks`)
}
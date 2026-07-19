// utils/fareCalculator.js
// utils/fareCalculator.js বা controller এ
export const calculateStageFare = (bus, fromCheckpoint, toCheckpoint) => {
  if (!bus.checkpoints || bus.checkpoints.length === 0) {
    throw new Error('No checkpoints found for this bus')
  }

  // ✅ Trim + lowercase করে match করো
  const fromName = fromCheckpoint?.trim().toLowerCase()
  const toName = toCheckpoint?.trim().toLowerCase()

  const fromIdx = bus.checkpoints.findIndex(
    cp => cp.name.trim().toLowerCase() === fromName
  )
  const toIdx = bus.checkpoints.findIndex(
    cp => cp.name.trim().toLowerCase() === toName
  )

  if (fromIdx === -1) {
    throw new Error(`Invalid boarding point: ${fromCheckpoint}. Available: ${bus.checkpoints.map(c => c.name).join(', ')}`)
  }
  if (toIdx === -1) {
    throw new Error(`Invalid dropping point: ${toCheckpoint}. Available: ${bus.checkpoints.map(c => c.name).join(', ')}`)
  }
  if (fromIdx >= toIdx) {
    throw new Error('Boarding must be before dropping')
  }

  let totalFare = 0
  for (let i = fromIdx; i < toIdx; i++) {
    totalFare += bus.checkpoints[i + 1].fareFromHere
  }

  return {
    fare: totalFare,
    boardingOrder: bus.checkpoints[fromIdx].order,
    droppingOrder: bus.checkpoints[toIdx].order,
    distance: bus.checkpoints[toIdx].distanceFromStart - bus.checkpoints[fromIdx].distanceFromStart
  }
}
export default calculateStageFare
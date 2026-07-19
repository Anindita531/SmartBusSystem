import express from 'express'
import { protect, restrictTo } from '../middleware/auth.middleware.js'
import {
  getMyAssignments,
  updateBusLocation,
  getBusPassengers,
  updateCurrentStop,
  getTodayTrip
} from '../controllers/conductor.controller.js'
import {authorize} from '../middleware/role.middleware.js'
import { conductorOnly } from '../middleware/auth.middleware.js'
const router = express.Router()

router.use(protect, restrictTo('conductor'))

router.get('/my-assigned-buses', getMyAssignments)
router.put('/update-location', updateBusLocation)
router.get('/bus/:busId/passengers', getBusPassengers)
router.post('/update-stop', authorize, conductorOnly, updateCurrentStop)
// router.get('/today-trip', auth, getTodayTrip); 
router.get('/today-trip', getTodayTrip); // testing এর জন্য
export default router
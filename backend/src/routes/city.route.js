import express from 'express'
import { getAllCities, searchCities } from '../controllers/city.controller.js'

const router = express.Router()
router.get('/', getAllCities)
router.get('/search', searchCities)

export default router
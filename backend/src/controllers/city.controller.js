import City from '../models/City.js'
import { successResponse, errorResponse } from '../utils/response.utils.js'

export const getAllCities = async (req, res) => {
  try {
    const cities = await City.find().sort({ name: 1 })
    successResponse(res, cities)
  } catch (err) {
    errorResponse(res, 500, err.message)
  }
}

export const searchCities = async (req, res) => {
  try {
    const { q } = req.query
    const cities = await City.find({ name: { $regex: q, $options: 'i' } }).limit(10)
    successResponse(res, cities)
  } catch (err) {
    errorResponse(res, 500, err.message)
  }
}
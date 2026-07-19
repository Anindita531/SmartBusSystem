import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { errorResponse } from '../utils/response.utils.js'

export const protect = async (req, res, next) => {
  if (req.method === 'OPTIONS') return next()

  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return errorResponse(res, 401, 'No token provided')

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await User.findById(decoded.id).select('-password')

    if (!req.user) return errorResponse(res, 401, 'User not found')

    next()
  } catch (err) {
    return errorResponse(res, 401, 'Token failed')
  }
}

export const adminOnly = (req, res, next) => {
  if (req.user.role!== 'admin') {
    return errorResponse(res, 403, 'Admin access only')
  }
  next()
}

export const conductorOnly = (req, res, next) => {
  if (req.user.role!== 'conductor') {
    return errorResponse(res, 403, 'Conductor access only')
  }
  next()
}

export const adminOrConductor = (req, res, next) => {
  if (req.user.role!== 'admin' && req.user.role!== 'conductor') {
    return errorResponse(res, 403, 'Access denied')
  }
  next()
}

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return errorResponse(res, 403, 'You do not have permission to perform this action')
    }
    next()
  }
}
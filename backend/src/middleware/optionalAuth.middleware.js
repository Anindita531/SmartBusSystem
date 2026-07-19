import { verifyToken } from '../utils/jwt.utils.js'
import User from '../models/User.js'

export const optionalAuth = async (req, res, next) => {
  let token
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
    try {
      const decoded = verifyToken(token)
      req.user = await User.findById(decoded.id).select('-password')
    } catch (err) {}
  }
  next()
}
import { errorResponse } from '../utils/response.utils.js'

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return errorResponse(res, 403, 'Access denied')
    }
    next()
  }
}
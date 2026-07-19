import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../config/env.js'

export const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' })
}

export const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET)
}
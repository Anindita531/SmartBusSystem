import User from '../models/User.js'

// GET /api/users/conductors - সব conductor list
export const getConductors = async (req, res) => {
  try {
    const conductors = await User.find({ role: 'conductor' })
     .select('name email phone')
     .sort({ name: 1 })
    res.json({ data: conductors })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ✅ GET /api/users/drivers - সব driver list
export const getDrivers = async (req, res) => {
  try {
    const drivers = await User.find({ role: 'driver' })
     .select('name email phone')
     .sort({ name: 1 })
    res.json({ data: drivers })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query // ✅ query param handle করো
    const query = role ? { role } : {}
    
    const users = await User.find(query).select('-password').sort({ createdAt: -1 })
    res.json({ data: users })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password')
    res.json({ message: 'Role updated', data: user })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
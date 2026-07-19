import mongoose from 'mongoose'

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI)
    console.log(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`)
  } catch (err) {
    console.error('DB Error:', err.message)
    process.exit(1)
  }
}

export default connectDB
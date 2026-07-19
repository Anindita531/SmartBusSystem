import api from './axios'

export const addReview = async (data) => {
  console.log('Sending review:', data) // ✅ Debug
  try {
    const res = await api.post('/reviews', data)
    console.log('Review response:', res.data) // ✅ Debug
    return res
  } catch (err) {
    console.log('Review error:', err.response?.data) // ✅ Error দেখবে
    throw err
  }
}
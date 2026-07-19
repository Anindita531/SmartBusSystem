import axios from 'axios'

export const sendSMS = async (phone, message) => {
  // Fast2SMS API - Free 50 SMS/day
  const url = 'https://www.fast2sms.com/dev/bulkV2'
  const response = await axios.post(url, {
    message,
    language: 'english',
    route: 'q',
    numbers: phone
  }, {
    headers: {
      authorization: process.env.FAST2SMS_API_KEY
    }
  })
  return response.data
}
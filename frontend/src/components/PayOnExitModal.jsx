import { useEffect, useState } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'

export default function PayOnExitModal({ bookingId, onClose }) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!bookingId) {
      toast.error('Booking ID missing')
      onClose()
      return
    }

    const createPayUData = async () => {
      try {
        const res = await api.post('/payments/create-exit-intent', { bookingId })
        const data = res.data

        if (!data.success) {
          throw new Error(data.message || 'Failed to create payment')
        }

        // Hidden form baniye PayU te auto submit
        const form = document.createElement('form')
        form.method = 'POST'
        form.action = data.data.action
        form.style.display = 'none'

        Object.keys(data.data).forEach(key => {
          if (key!== 'action') {
            const input = document.createElement('input')
            input.type = 'hidden'
            input.name = key
            input.value = data.data[key]
            form.appendChild(input)
          }
        })

        document.body.appendChild(form)
        form.submit()

      } catch (err) {
        console.error('PayU error:', err)
        toast.error(err.response?.data?.message || 'Failed to create payment')
        onClose()
      } finally {
        setLoading(false)
      }
    }

    createPayUData()
  }, [bookingId, onClose])

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg">
          <p className="text-center">Redirecting to PayU...</p>
        </div>
      </div>
    )
  }

  return null
}
import { useParams, useNavigate } from 'react-router-dom'
import PayOnExitModal from '../components/PayOnExitModal'

export default function PayOnExitPage() {
  const { bookingId } = useParams()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <PayOnExitModal 
          bookingId={bookingId} 
          onClose={() => navigate('/bookings')} 
        />
      </div>
    </div>
  )
}
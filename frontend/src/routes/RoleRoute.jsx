import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Loader from '../components/Loader'

export default function RoleRoute({ role }) {
  const { user, loading } = useAuth()
  
  if (loading) return <Loader />
  
  return user?.role === role ? <Outlet /> : <Navigate to="/" />
}
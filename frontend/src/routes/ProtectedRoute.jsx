import { Navigate, Outlet } from 'react-router-dom'

export default function ProtectedRoute() {
  const isAuth = localStorage.getItem('token') // পরে AuthContext দিয়ে করবে
  return isAuth? <Outlet /> : <Navigate to="/login" />
}
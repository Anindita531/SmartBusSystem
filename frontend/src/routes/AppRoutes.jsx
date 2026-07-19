import { Routes, Route, Navigate } from 'react-router-dom'
import Home from '../pages/Home'
import SearchResult from '../pages/SearchResult'
import SeatSelect from '../pages/SeatSelect'
import PassengerInfo from '../pages/PassengerInfo'
import Payment from '../pages/Payment'
import Ticket from '../pages/Ticket'
import Login from '../pages/Login'
import Register from '../pages/Register'
import Profile from '../pages/Profile'
import Bookings from '../pages/Bookings'
import TrackBus from '../pages/TrackBus'
import BusDetails from '../pages/BusDetails'
import Notifications from '../pages/Notifications'
import ConductorTrips from '../pages/conductor/ConductorTrips.jsx'
import PayFine from '../pages/PayFine.jsx'
import ReportIssue from '../pages/ReportIssue.jsx'
import Offers from '../pages/Offers.jsx'
import PayOnExitPage from '../pages/PayOnExitPage.jsx'
import FAQ from '../pages/FAQ.jsx'
import AIChat from '../pages/AIChat.jsx' 

// Admin pages
import AdminDashboard from '../pages/admin/AdminDashboard'
import ManageBuses from '../pages/admin/ManageBuses'
import AllBookings from '../pages/admin/AllBookings'
import Revenue from '../pages/admin/Revenue.jsx'
import Users from '../pages/admin/Users'
import AdminCoupons from '../pages/admin/AdminCoupons.jsx'
import FineDisputes from '../pages/admin/FineDisputes.jsx'
import AdminOffers from '../pages/admin/AdminOffers.jsx'
import ManageFAQs from '../pages/admin/ManageFAQs.jsx' // <-- 2. Admin FAQ manage page
// Conductor pages
import ConductorDashboard from '../pages/conductor/ConductorDashboard.jsx'
import ScanQR from '../pages/conductor/ScanQR.jsx'
// Driver pages
import DriverDashboard from '../pages/driver/DriverDashboard.jsx'
import DriverTrips from '../pages/driver/DriverTrips.jsx'
import ProtectedRoute from './ProtectedRoute'
import RoleRoute from './RoleRoute'
import Refund from '../pages/Refund.jsx'
import ManageQuotes from '../pages/admin/ManageQuotes.jsx'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/search" element={<SearchResult />} />
      <Route path="/bus/:busId/seats" element={<SeatSelect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/ai-chat" element={<AIChat />} />
      <Route path="/offers" element={<Offers />} /> 
      <Route path="/track/:busId" element={<TrackBus />} />     
      <Route path="/bus/:id" element={<BusDetails />} />
      <Route path="/report-issue" element={<ReportIssue />} />
      <Route path="/refund" element={<Refund />} />
      <Route path="/faq" element={<FAQ />} /> {/* <-- 3. Public FAQ route add */}

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/passenger-info" element={<PassengerInfo />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/ticket/:bookingId" element={<Ticket />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/notifications" element={<Notifications />} /> 
        <Route path="/pay-fine/:bookingId" element={<PayFine />} />
        <Route path="/pay-on-exit/:bookingId" element={<PayOnExitPage />} />
      </Route>

      {/* Admin Routes */}
      <Route element={<RoleRoute role="admin" />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/coupons" element={<AdminCoupons />} />
        <Route path="/admin/buses" element={<ManageBuses />} />
        <Route path="/admin/bookings" element={<AllBookings />} />
        <Route path="/admin/revenue" element={<Revenue />} />
        <Route path="/admin/users" element={<Users />} />
        <Route path="/admin/fine-disputes" element={<FineDisputes />} /> 
        <Route path="/admin/offers" element={<AdminOffers />} />
        <Route path="/admin/quotes" element={<ManageQuotes />} />
        <Route path="/admin/faqs" element={<ManageFAQs />} /> {/* <-- 4. Admin FAQ CRUD */}
      </Route>

      {/* Conductor Routes */}
      <Route element={<RoleRoute role="conductor" />}>
        <Route path="/conductor" element={<ConductorDashboard />} />
        <Route path="/conductor/scan" element={<ScanQR />} />
        <Route path="/conductor/trips" element={<ConductorTrips />} />
      </Route>

      {/* Driver Routes */}
      <Route element={<RoleRoute role="driver" />}>
        <Route path="/driver" element={<DriverDashboard />} />
        <Route path="/driver/trips" element={<DriverTrips />} />
      </Route>
    </Routes>
  )
}
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { BookingProvider } from './context/BookingContext'
import { SocketProvider } from './context/SocketContext'
import AppRoutes from './routes/AppRoutes'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import FloatingChatButton from './components/FloatingChatButton.jsx'
import { Toaster } from 'react-hot-toast'
import './index.css'

function App() {
  return (
    <BrowserRouter>
      <SocketProvider>
        <AuthProvider>
          <BookingProvider>
            <div className="min-h-screen bg-white flex-col">
              <Navbar />
              <main className="flex-1">
                <AppRoutes />
              </main>
              <Footer />
              <FloatingChatButton />
              <Toaster position="top-right" />
            </div>
          </BookingProvider>
        </AuthProvider>
      </SocketProvider>
    </BrowserRouter>
  )
}
export default App
import { createContext, useState } from 'react'

export const BookingContext = createContext()

export const BookingProvider = ({ children }) => {
  const [bookingData, setBookingData] = useState({
    busId: null,
    seats: [],
    passengers: [],
    totalAmount: 0
  })

  return (
    <BookingContext.Provider value={{ bookingData, setBookingData }}>
      {children}
    </BookingContext.Provider>
  )
}
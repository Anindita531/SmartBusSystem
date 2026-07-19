import { useContext } from 'react';
import { BookingContext } from '../context/BookingContext';
export const useBooking = () => useContext(BookingContext);
import { useEffect, useState } from 'react';
import { getBookings } from '../api/admin.api';

export default function ManageBookings() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    getBookings().then(res => setBookings(res.data || []));
  }, []);

  return (
    <div className="p-4">
      <h2>All Bookings</h2>
      {bookings.map(b => <div key={b._id}>{b._id} - {b.status}</div>)}
    </div>
  );
}
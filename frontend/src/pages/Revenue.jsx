import { useEffect, useState } from 'react';
import { getRevenue } from '../api/admin.api';

export default function Revenue() {
  const [data, setData] = useState(null);

  useEffect(() => {
    getRevenue().then(res => setData(res.data));
  }, []);

  if (!data) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <h2>Revenue: {data.total} BDT</h2>
    </div>
  );
}
import { useState } from 'react';
import api from '../api/axios';

export default function CitySearch({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async (e) => {
    setQuery(e.target.value);
    if (e.target.value.length > 2) {
      const res = await api.get('/api/cities/search?q=' + e.target.value);
      setResults(res.data || []);
    }
  };

  return (
    <div>
      <input placeholder="Search city" value={query} onChange={handleSearch} />
      {results.map(c => (
        <div key={c._id} onClick={() => onSelect(c.name)}>{c.name}</div>
      ))}
    </div>
  );
}
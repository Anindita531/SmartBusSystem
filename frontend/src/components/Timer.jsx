import { useEffect, useState } from 'react';

export default function Timer({ expiry }) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = new Date(expiry) - new Date();
      setTimeLeft(Math.max(0, Math.floor(diff / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiry]);

  const min = Math.floor(timeLeft / 60);
  const sec = timeLeft % 60;
  return <span>{min}:{sec < 10? '0' + sec : sec}</span>;
}
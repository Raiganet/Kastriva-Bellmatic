import { useEffect, useState } from 'react';

export function useClock(intervalMs = 250) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

'use client';
import { useEffect, useState } from 'react';

function mmss(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

// Isolated 1s timer — keeps the per-second re-render scoped to this small
// component instead of rerendering the whole live workout page every tick.
export function SessionClock({ startedAt }: { startedAt?: number }) {
  const start = startedAt ?? Date.now();
  const [elapsed, setElapsed] = useState(() => Math.floor((Date.now() - start) / 1000));
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [start]);
  return <span className="mono" style={{ fontSize: 12, fontWeight: 700 }}>{mmss(elapsed)}</span>;
}

'use client';
import { useState, useEffect, useCallback } from 'react';

export function useCountdownTimer(initialSeconds: number) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [total, setTotal] = useState(initialSeconds);

  useEffect(() => {
    if (!isRunning || remaining <= 0) {
      if (remaining <= 0) setIsRunning(false);
      return;
    }
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [isRunning, remaining]);

  const start = useCallback(
    (seconds?: number) => {
      const s = seconds ?? initialSeconds;
      setTotal(s);
      setRemaining(s);
      setIsRunning(true);
    },
    [initialSeconds]
  );

  const stop = useCallback(() => setIsRunning(false), []);

  const skip = useCallback(() => {
    setRemaining(0);
    setIsRunning(false);
  }, []);

  const addTime = useCallback((seconds: number) => {
    setRemaining((r) => r + seconds);
    setTotal((t) => t + seconds);
  }, []);

  return {
    remaining,
    total,
    isRunning,
    isDone: remaining <= 0 && !isRunning,
    start,
    stop,
    skip,
    addTime,
  };
}

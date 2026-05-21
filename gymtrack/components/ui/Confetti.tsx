'use client';
import { useMemo } from 'react';

const COLORS = ['#A3E635', '#00FF88', '#FBBF24', '#65A30D'] as const;

export function Confetti({ count = 30 }: { count?: number }) {
  const parts = useMemo(() => Array.from({ length: count }).map((_, i) => ({
    x: Math.random() * 100,
    y: 50 + Math.random() * 20,
    angle: Math.random() * Math.PI * 2,
    dist: 80 + Math.random() * 120,
    size: 4 + Math.random() * 5,
    rot: Math.random() * 360,
    delay: Math.random() * 0.2,
    dur: 0.9 + Math.random() * 0.6,
    color: COLORS[i % 4],
  })), [count]);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {parts.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size,
          background: p.color,
          borderRadius: i % 2 ? '50%' : '2px',
          boxShadow: `0 0 8px ${p.color}`,
          animation: `gt-confetti ${p.dur}s ${p.delay}s ease-out forwards`,
          ['--dx' as string]: `${Math.cos(p.angle) * p.dist}px`,
          ['--dy' as string]: `${Math.sin(p.angle) * p.dist - 100}px`,
          ['--r' as string]: `${p.rot}deg`,
        } as React.CSSProperties} />
      ))}
    </div>
  );
}

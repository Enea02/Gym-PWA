'use client';
import { useId } from 'react';

interface Props { values: number[]; height?: number; }

export function Sparkline({ values, height = 60 }: Props) {
  const uid = useId();
  if (!values?.length) return null;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const W = 100, H = 30;
  const pts = values.map((v, i) => [
    (i / (values.length - 1)) * W,
    H - ((v - min) / range) * H,
  ] as [number, number]);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ');
  const area = `${line} L ${W} ${H} L 0 ${H} Z`;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sf-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(163,230,53,0.45)" />
          <stop offset="100%" stopColor="rgba(163,230,53,0)" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sf-${uid})`} />
      <path d={line} fill="none" stroke="#A3E635" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts.at(-1)![0]} cy={pts.at(-1)![1]} r="2.2" fill="#A3E635" />
    </svg>
  );
}

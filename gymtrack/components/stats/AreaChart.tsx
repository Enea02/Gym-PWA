'use client';
import { useId } from 'react';

interface DataPoint { value: number; label?: string; pr?: boolean; }
interface Props { data: DataPoint[]; height?: number; showLabels?: boolean; yMin?: number; yMax?: number; }

export function AreaChart({ data, height = 160, showLabels = false, yMin, yMax }: Props) {
  const uid = useId();
  const W = 320, H = height, padL = 28, padR = 12, padT = 12, padB = 22;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const values = data.map(d => d.value);
  const min = yMin ?? Math.min(...values);
  const max = yMax ?? Math.max(...values);
  const range = max - min || 1;
  const pts = data.map((d, i) => ({
    x: padL + (i / (data.length - 1)) * innerW,
    y: padT + innerH - ((d.value - min) / range) * innerH,
    d,
  }));
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L ${padL + innerW} ${padT + innerH} L ${padL} ${padT + innerH} Z`;

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <linearGradient id={`af-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(163,230,53,0.55)" />
          <stop offset="100%" stopColor="rgba(163,230,53,0)" />
        </linearGradient>
      </defs>
      {Array.from({ length: 4 }).map((_, i) => {
        const y = padT + (i / 3) * innerH;
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={padL + innerW} y2={y}
              stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="2 4" />
            <text x={padL - 4} y={y + 3} fontSize="9" fill="#6B7B6B"
              fontFamily="JetBrains Mono, monospace" textAnchor="end">
              {(max - (i / 3) * range).toFixed(0)}
            </text>
          </g>
        );
      })}
      <path d={area} fill={`url(#af-${uid})`} />
      <path d={line} fill="none" stroke="#A3E635" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => p.d.pr ? (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="6" fill="rgba(163,230,53,0.2)" />
          <circle cx={p.x} cy={p.y} r="3.5" fill="#A3E635" stroke="#0A0F0A" strokeWidth="1.5" />
        </g>
      ) : null)}
      <circle cx={pts.at(-1)!.x} cy={pts.at(-1)!.y} r="4" fill="#A3E635" stroke="#0A0F0A" strokeWidth="2" />
      {showLabels && pts.map((p, i) => {
        if (i % Math.ceil(data.length / 5) !== 0 && i !== data.length - 1) return null;
        return p.d.label ? (
          <text key={i} x={p.x} y={H - 6} fontSize="9" fill="#6B7B6B"
            fontFamily="JetBrains Mono, monospace" textAnchor="middle">{p.d.label}</text>
        ) : null;
      })}
    </svg>
  );
}

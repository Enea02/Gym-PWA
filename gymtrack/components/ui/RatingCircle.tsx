'use client';
import { useId } from 'react';

interface Props {
  score: number;
  label?: string;
  sublabel?: string;
  size?: number;
  variant?: 'radial' | 'segmented';
}

export function RatingCircle({ score = 87, label, sublabel, size = 220, variant = 'radial' }: Props) {
  const uid = useId();
  const stroke = 14;
  const r = (size - stroke) / 2 - 2;
  const cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;

  return (
    <div style={{ width: size, height: size, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        position: 'absolute', inset: -4, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(163,230,53,0.35) 0%, transparent 65%)',
        filter: 'blur(10px)',
      }} />
      <svg width={size} height={size} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id={`grad-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A3E635" />
            <stop offset="100%" stopColor="#65A30D" />
          </linearGradient>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        {variant === 'radial' && (
          <circle cx={cx} cy={cy} r={r} fill="none"
            stroke={`url(#grad-${uid})`} strokeWidth={stroke}
            strokeDasharray={`${circ * pct} ${circ}`}
            strokeLinecap="round"
            style={{ filter: 'drop-shadow(0 0 8px rgba(163,230,53,0.5))' }} />
        )}
        {variant === 'segmented' && (() => {
          const N = 36, gap = 6, segDeg = 360 / N;
          const litCount = Math.round(N * pct);
          return Array.from({ length: N }).map((_, i) => {
            const lit = i < litCount;
            const a0 = (i * segDeg + gap / 2) * Math.PI / 180;
            const a1 = ((i + 1) * segDeg - gap / 2) * Math.PI / 180;
            const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
            const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
            const large = a1 - a0 > Math.PI ? 1 : 0;
            return (
              <path key={i}
                d={`M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`}
                stroke={lit ? `url(#grad-${uid})` : 'rgba(255,255,255,0.06)'}
                strokeWidth={lit ? stroke : stroke - 4}
                strokeLinecap="round" fill="none"
                style={lit ? { filter: 'drop-shadow(0 0 4px rgba(163,230,53,0.5))' } : undefined}
              />
            );
          });
        })()}
      </svg>
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span className="mono" style={{
          fontWeight: 800, fontSize: size * 0.34, lineHeight: 1, color: '#F5F5F4',
          letterSpacing: '-0.04em', textShadow: '0 0 30px rgba(163,230,53,0.4)',
        }}>{score}</span>
        {label && <span style={{ marginTop: 6, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#A8B5A8', textTransform: 'uppercase' }}>{label}</span>}
        {sublabel && <span style={{ marginTop: 4, fontSize: 12, color: '#6B7B6B' }}>{sublabel}</span>}
      </div>
    </div>
  );
}

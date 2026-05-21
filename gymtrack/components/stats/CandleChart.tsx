interface Candle { low: number; high: number; open: number; close: number; label: string; pr?: boolean; }
interface Props { data: Candle[]; height?: number; }

export function CandleChart({ data, height = 200 }: Props) {
  const W = 320, H = height, padL = 28, padR = 10, padT = 12, padB = 22;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const lows = data.map(d => d.low), highs = data.map(d => d.high);
  const min = Math.min(...lows) * 0.98, max = Math.max(...highs) * 1.02;
  const range = max - min || 1;
  const slot = innerW / data.length;
  const cw = Math.max(4, slot * 0.55);
  const y = (v: number) => padT + innerH - ((v - min) / range) * innerH;

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
      {Array.from({ length: 4 }).map((_, i) => {
        const yv = padT + (i / 3) * innerH;
        return (
          <g key={i}>
            <line x1={padL} y1={yv} x2={padL + innerW} y2={yv}
              stroke="rgba(255,255,255,0.05)" strokeDasharray="2 4" />
            <text x={padL - 4} y={yv + 3} fontSize="9" fill="#6B7B6B"
              fontFamily="JetBrains Mono, monospace" textAnchor="end">
              {(max - (i / 3) * range).toFixed(0)}
            </text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const cx = padL + slot * (i + 0.5);
        const up = d.close >= d.open;
        const color = up ? '#A3E635' : '#EF4444';
        return (
          <g key={i}>
            <line x1={cx} y1={y(d.high)} x2={cx} y2={y(d.low)} stroke={color} strokeWidth="1.2" />
            <rect x={cx - cw / 2} y={Math.min(y(d.open), y(d.close))}
              width={cw} height={Math.max(2, Math.abs(y(d.open) - y(d.close)))}
              fill={color} rx="1.5" />
            {d.pr && <circle cx={cx} cy={y(d.high) - 6} r="3" fill="#00FF88" />}
          </g>
        );
      })}
      {data.map((d, i) => {
        if (i % 3 !== 0 && i !== data.length - 1) return null;
        const cx = padL + slot * (i + 0.5);
        return (
          <text key={i} x={cx} y={H - 6} fontSize="9" fill="#6B7B6B"
            fontFamily="JetBrains Mono, monospace" textAnchor="middle">{d.label}</text>
        );
      })}
    </svg>
  );
}

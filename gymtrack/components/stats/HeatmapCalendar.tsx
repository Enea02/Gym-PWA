interface Props { data: number[][]; dayLabels?: string[]; }

export function HeatmapCalendar({ data, dayLabels }: Props) {
  const cell = 14, gap = 3;
  const rows = data.length, cols = data[0]?.length ?? 0;
  const W = cols * (cell + gap) + 26, H = rows * (cell + gap) + 4;
  const color = (v: number) => {
    if (v === 0) return 'rgba(255,255,255,0.05)';
    if (v === 1) return 'rgba(163,230,53,0.15)';
    if (v === 2) return 'rgba(163,230,53,0.35)';
    if (v === 3) return 'rgba(163,230,53,0.6)';
    return 'rgba(163,230,53,0.9)';
  };
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      {dayLabels && data.map((_, r) => (
        <text key={r} x={2} y={r * (cell + gap) + cell - 3}
          fontSize="9" fill="#6B7B6B" fontFamily="JetBrains Mono, monospace">
          {dayLabels[r]}
        </text>
      ))}
      {data.map((row, r) => row.map((v, c) => (
        <rect key={`${r}-${c}`}
          x={22 + c * (cell + gap)} y={r * (cell + gap)}
          width={cell} height={cell} rx="3"
          fill={color(v)} />
      )))}
    </svg>
  );
}

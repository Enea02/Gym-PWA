interface Props { total: number; done: number; size?: number; }

export function ProgressDots({ total, done, size = 10 }: Props) {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: size, height: size, borderRadius: '50%',
          background: i < done ? 'linear-gradient(135deg, #A3E635, #65A30D)' : 'transparent',
          border: i < done ? 'none' : '1.5px solid rgba(163,230,53,0.3)',
          boxShadow: i < done ? '0 0 8px rgba(163,230,53,0.6)' : 'none',
          transition: 'all 0.3s',
        }} />
      ))}
    </div>
  );
}

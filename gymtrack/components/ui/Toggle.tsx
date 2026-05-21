'use client';

interface Props { on: boolean; onChange: (v: boolean) => void; }

export function Toggle({ on, onChange }: Props) {
  return (
    <button onClick={() => onChange(!on)} type="button" style={{
      width: 46, height: 28, borderRadius: 999, padding: 0, border: 'none',
      background: on ? 'linear-gradient(135deg, #A3E635, #65A30D)' : 'rgba(255,255,255,0.1)',
      position: 'relative', cursor: 'pointer',
      boxShadow: on ? '0 0 16px rgba(163,230,53,0.5)' : 'none',
      transition: 'background 0.2s, box-shadow 0.2s',
      flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: 2, left: on ? 20 : 2,
        width: 24, height: 24, borderRadius: '50%',
        background: '#fff', transition: 'left 0.2s',
        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
      }} />
    </button>
  );
}

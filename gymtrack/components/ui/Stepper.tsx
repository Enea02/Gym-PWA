'use client';
import { Minus, Plus } from 'lucide-react';

interface Props {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  suffix?: string;
  big?: boolean;
  min?: number;
}

export function Stepper({ value, onChange, step = 2.5, suffix, big = false, min = 0 }: Props) {
  const dec = () => onChange(Math.max(min, +(value - step).toFixed(2)));
  const inc = () => onChange(+(value + step).toFixed(2));
  const btnStyle: React.CSSProperties = {
    width: big ? 48 : 34, height: big ? 48 : 34, borderRadius: 12,
    background: 'rgba(163,230,53,0.12)', color: '#A3E635',
    border: '1px solid rgba(163,230,53,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', padding: 0, flexShrink: 0,
  };
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: big ? '12px 14px' : '8px 10px',
      background: '#1A2420',
      border: '1px solid rgba(163,230,53,0.14)',
      borderRadius: 16,
    }}>
      <button onClick={dec} style={btnStyle} type="button">
        <Minus size={big ? 22 : 16} />
      </button>
      <div className="mono" style={{
        flex: 1, textAlign: 'center',
        fontSize: big ? 44 : 22, fontWeight: 800, color: '#F5F5F4',
        lineHeight: 1, letterSpacing: '-0.03em',
      }}>
        {value}
        {suffix && <span style={{ fontSize: big ? 16 : 11, color: '#6B7B6B', marginLeft: 6, fontWeight: 600 }}>{suffix}</span>}
      </div>
      <button onClick={inc} style={btnStyle} type="button">
        <Plus size={big ? 22 : 16} />
      </button>
    </div>
  );
}

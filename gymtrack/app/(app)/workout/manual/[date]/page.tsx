'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, MoreHorizontal, Plus, X, Calendar } from 'lucide-react';

const INITIAL_DATA = [
  { id: 'bench', name: 'Panca piana bilanciere', sets: [{ weight: 92.5, reps: 8 }, { weight: 92.5, reps: 8 }, { weight: 90, reps: 7 }, { weight: 87.5, reps: 6 }] },
  { id: 'incline', name: 'Panca inclinata manubri', sets: [{ weight: 32, reps: 10 }, { weight: 32, reps: 10 }, { weight: 30, reps: 9 }, { weight: 30, reps: 8 }] },
  { id: 'ohp', name: 'Military press', sets: [{ weight: 57.5, reps: 6 }, { weight: 57.5, reps: 6 }, { weight: 55, reps: 5 }, { weight: 52.5, reps: 5 }] },
  { id: 'lat-raise', name: 'Alzate laterali', sets: [{ weight: 12, reps: 12 }, { weight: 12, reps: 12 }, { weight: 10, reps: 12 }] },
];

const cellInput: React.CSSProperties = {
  width: '100%', appearance: 'none', boxSizing: 'border-box',
  height: 32, padding: '0 10px', fontSize: 13, fontWeight: 700, color: '#F5F5F4',
  background: '#1A2420', border: '1px solid rgba(163,230,53,0.12)',
  borderRadius: 8, outline: 'none', textAlign: 'center',
  fontFamily: 'JetBrains Mono, monospace', fontVariantNumeric: 'tabular-nums',
};

export default function ManualRecordingPage() {
  const router = useRouter();
  const [data, setData] = useState(INITIAL_DATA);

  function update(ei: number, si: number, field: 'weight' | 'reps', val: number) {
    setData(d => d.map((ex, eix) => eix !== ei ? ex : {
      ...ex, sets: ex.sets.map((s, six) => six !== si ? s : { ...s, [field]: val }),
    }));
  }
  function addSet(ei: number) {
    setData(d => d.map((ex, eix) => eix !== ei ? ex : {
      ...ex, sets: [...ex.sets, { weight: ex.sets.at(-1)?.weight ?? 0, reps: ex.sets.at(-1)?.reps ?? 8 }],
    }));
  }
  function removeSet(ei: number, si: number) {
    setData(d => d.map((ex, eix) => eix !== ei ? ex : {
      ...ex, sets: ex.sets.filter((_, i) => i !== si),
    }));
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: 'var(--page-bg)', overflow: 'hidden' }}>
      {/* Top bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10,
        paddingTop: 56, paddingBottom: 12,
        background: 'linear-gradient(180deg, #0A0F0A 75%, transparent)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px' }}>
          <button onClick={() => router.back()} style={{
            width: 36, height: 36, borderRadius: 11, background: 'rgba(255,255,255,0.06)',
            border: 'none', color: '#F5F5F4', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <ChevronLeft size={18} />
          </button>
          <div>
            <div style={{ fontSize: 10, color: '#6B7B6B', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center' }}>REGISTRAZIONE MANUALE</div>
            <div style={{ fontSize: 14, fontWeight: 700, textAlign: 'center' }}>Push Day</div>
          </div>
          <div style={{ width: 36 }} />
        </div>
      </div>

      <div className="gt-scroll" style={{ position: 'absolute', inset: 0, paddingTop: 108, paddingBottom: 110 }}>
        <div style={{ padding: '0 18px' }}>
          {/* Date selector */}
          <div className="gt-card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(163,230,53,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={18} color="#A3E635" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: '#6B7B6B', fontWeight: 700, textTransform: 'uppercase' }}>DATA ALLENAMENTO</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>Venerdì 17 Mag, 19:30</div>
            </div>
            <ChevronRight size={16} color="#6B7B6B" />
          </div>

          {/* Exercises */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.map((ex, ei) => (
              <div key={ex.id} className="gt-card" style={{ padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{ex.name}</div>
                    <div style={{ fontSize: 10, color: '#6B7B6B', fontWeight: 600, marginTop: 2 }}>{ex.sets.length} serie</div>
                  </div>
                  <button style={{ padding: 8, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: 'none', color: '#A8B5A8', cursor: 'pointer' }}>
                    <MoreHorizontal size={16} />
                  </button>
                </div>

                {/* Table header */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '36px 1fr 1fr 36px',
                  fontSize: 9, fontWeight: 700, color: '#6B7B6B',
                  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, padding: '0 4px', gap: 8,
                }}>
                  <div>#</div><div>PESO (kg)</div><div>REPS</div><div />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {ex.sets.map((s, si) => (
                    <div key={si} style={{ display: 'grid', gridTemplateColumns: '36px 1fr 1fr 36px', gap: 8, alignItems: 'center' }}>
                      <div className="mono" style={{
                        textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#A3E635',
                        padding: '8px 0', borderRadius: 8, background: 'rgba(163,230,53,0.06)',
                      }}>{si + 1}</div>
                      <input type="number" value={s.weight} onChange={e => update(ei, si, 'weight', +e.target.value)} className="mono" style={cellInput} />
                      <input type="number" value={s.reps} onChange={e => update(ei, si, 'reps', +e.target.value)} className="mono" style={cellInput} />
                      <button onClick={() => removeSet(ei, si)} style={{
                        height: 32, borderRadius: 8, background: 'rgba(239,68,68,0.08)',
                        border: 'none', color: '#EF4444', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <X size={14} color="#EF4444" />
                      </button>
                    </div>
                  ))}
                </div>

                <button onClick={() => addSet(ei)} style={{
                  marginTop: 8, width: '100%', padding: '8px 0', borderRadius: 10,
                  background: 'transparent', border: '1px dashed rgba(163,230,53,0.3)',
                  color: '#A3E635', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                  <Plus size={12} color="#A3E635" /> Aggiungi serie
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Save bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10,
        padding: '12px 18px 30px',
        background: 'linear-gradient(0deg, #0A0F0A 70%, transparent)',
      }}>
        <button onClick={() => router.back()} className="gt-btn-primary" style={{
          width: '100%', height: 54, borderRadius: 16, fontSize: 15,
        }}>
          Salva allenamento
        </button>
      </div>
    </div>
  );
}

'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Clock, Play, PencilLine, Plus, MoreHorizontal } from 'lucide-react';

const WEEK_PLAN = [
  { day: 'Lun', dayEn: 'L', num: 11, status: 'done' as const, title: 'Push Day', subtitle: 'Petto & Tricipiti', exCount: 6, volume: 4820 },
  { day: 'Mar', dayEn: 'M', num: 12, status: 'rest' as const, title: 'Recupero', subtitle: 'Stretching & mobility', exCount: 0, volume: 0 },
  { day: 'Mer', dayEn: 'M', num: 13, status: 'done' as const, title: 'Pull Day', subtitle: 'Schiena & Bicipiti', exCount: 7, volume: 5210 },
  { day: 'Gio', dayEn: 'G', num: 14, status: 'done' as const, title: 'Leg Day', subtitle: 'Quadricipiti & Glutei', exCount: 6, volume: 6480 },
  { day: 'Ven', dayEn: 'V', num: 15, status: 'today' as const, title: 'Push Day', subtitle: 'Petto & Spalle', exCount: 7, volume: 0 },
  { day: 'Sab', dayEn: 'S', num: 16, status: 'planned' as const, title: 'Pull Day', subtitle: 'Schiena & Trapezi', exCount: 6, volume: 0 },
  { day: 'Dom', dayEn: 'D', num: 17, status: 'rest' as const, title: 'Riposo', subtitle: 'Off', exCount: 0, volume: 0 },
];

const TODAY_EXERCISES = [
  { id: 'bench', name: 'Panca piana bilanciere', muscle: 'Petto', sets: 4, reps: 8, weight: 92.5, rest: 120, progress: '+2.5 kg' },
  { id: 'incline', name: 'Panca inclinata manubri', muscle: 'Petto', sets: 4, reps: 10, weight: 32, rest: 90, progress: '+1 serie' },
  { id: 'ohp', name: 'Military press', muscle: 'Spalle', sets: 4, reps: 6, weight: 57.5, rest: 120, progress: 'mantieni' },
  { id: 'lat-raise', name: 'Alzate laterali', muscle: 'Spalle', sets: 5, reps: 12, weight: 12, rest: 60, progress: '+1 serie' },
  { id: 'dips', name: 'Dips parallele', muscle: 'Petto', sets: 4, reps: 10, weight: 10, rest: 90, progress: '+2.5 kg' },
  { id: 'pushdown', name: 'Push-down ai cavi', muscle: 'Tricipiti', sets: 4, reps: 12, weight: 27.5, rest: 60, progress: '+1 serie' },
  { id: 'french', name: 'French press EZ', muscle: 'Tricipiti', sets: 3, reps: 10, weight: 22.5, rest: 75, progress: '+2.5 kg' },
];

export default function WorkoutPage() {
  const [selectedIdx, setSelectedIdx] = useState(4);
  const router = useRouter();
  const current = WEEK_PLAN[selectedIdx];

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#0A0F0A', overflow: 'hidden' }}>
      <div className="gt-scroll" style={{ position: 'absolute', inset: 0, paddingTop: 60, paddingBottom: 130 }}>
        {/* Top */}
        <div style={{ padding: '14px 22px 12px' }}>
          <div style={{ fontSize: 13, color: '#6B7B6B', fontWeight: 600, marginBottom: 2 }}>
            Maggio 2026 · Settimana 20
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>Allenamenti</h1>
        </div>

        {/* Days row */}
        <div style={{ display: 'flex', gap: 7, padding: '6px 22px 18px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {WEEK_PLAN.map((d, i) => {
            const isSelected = i === selectedIdx;
            const isToday = d.status === 'today';
            const isDone = d.status === 'done';
            const isRest = d.status === 'rest';
            return (
              <button key={d.day} onClick={() => setSelectedIdx(i)} style={{
                appearance: 'none', flex: 1, minWidth: 42,
                padding: '12px 6px',
                background: isSelected ? 'linear-gradient(135deg, #A3E635, #65A30D)' : '#1A2420',
                border: isSelected ? 'none' : `1px solid rgba(163,230,53,${isToday ? 0.4 : 0.12})`,
                borderRadius: 14, cursor: 'pointer',
                color: isSelected ? '#0A0F0A' : '#F5F5F4',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                boxShadow: isSelected ? '0 6px 20px -4px rgba(163,230,53,0.5)' : 'none',
              }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                  color: isSelected ? '#0A0F0A' : (isToday ? '#A3E635' : '#6B7B6B'),
                }}>{d.dayEn}</span>
                <span className="mono" style={{ fontSize: 18, fontWeight: 800 }}>{d.num}</span>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: isDone ? (isSelected ? '#0A0F0A' : '#A3E635') : isToday ? (isSelected ? '#0A0F0A' : '#00FF88') : 'transparent',
                  border: (!isDone && !isToday) ? `1.5px solid ${isRest ? '#4A584A' : 'rgba(163,230,53,0.4)'}` : 'none',
                  boxShadow: (isDone && !isSelected) ? '0 0 6px rgba(163,230,53,0.7)' : 'none',
                }} />
              </button>
            );
          })}
        </div>

        {/* Day detail */}
        <div style={{ margin: '0 22px' }}>
          {current.status === 'rest' ? (
            <div className="gt-card" style={{
              padding: '28px 22px', textAlign: 'center',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
            }}>
              <div style={{ fontSize: 34 }}>🧘</div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{current.title}</div>
              <div style={{ fontSize: 13, color: '#A8B5A8' }}>{current.subtitle}</div>
            </div>
          ) : (
            <div className="gt-card-hi" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  {current.status === 'today' && (
                    <div className="gt-chip" style={{ marginBottom: 8 }}>
                      <span style={{ width: 6, height: 6, borderRadius: 99, background: '#A3E635' }} /> OGGI
                    </div>
                  )}
                  {current.status === 'done' && (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 99,
                      background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
                      color: '#22C55E', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8,
                    }}>
                      <CheckCircle2 size={12} /> COMPLETATO
                    </div>
                  )}
                  {current.status === 'planned' && (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 99,
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                      color: '#A8B5A8', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8,
                    }}>
                      <Clock size={12} /> PROGRAMMATO
                    </div>
                  )}
                  <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>{current.title}</div>
                  <div style={{ fontSize: 13, color: '#A8B5A8', marginTop: 3 }}>{current.subtitle}</div>
                </div>
                <button style={{
                  width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.06)', color: '#A8B5A8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                }}><MoreHorizontal size={18} /></button>
              </div>

              {/* Exercise list */}
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {TODAY_EXERCISES.map((ex, i) => (
                  <div key={ex.id} style={{
                    background: '#1A2420', border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 14, padding: '12px 14px',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: current.status === 'done' ? 'linear-gradient(135deg, #A3E635, #65A30D)' : 'rgba(163,230,53,0.08)',
                      border: current.status === 'done' ? 'none' : '1px solid rgba(163,230,53,0.18)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: current.status === 'done' ? '#0A0F0A' : '#A3E635',
                    }}>
                      {current.status === 'done'
                        ? <CheckCircle2 size={18} color="#0A0F0A" />
                        : <span className="mono" style={{ fontSize: 13, fontWeight: 800 }}>{String(i + 1).padStart(2, '0')}</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6B7B6B', fontSize: 11, marginTop: 3 }}>
                        <span className="mono" style={{ fontWeight: 700 }}>{ex.sets}×{ex.reps}</span>
                        <span style={{ width: 3, height: 3, borderRadius: 99, background: '#4A584A' }} />
                        <span className="mono" style={{ fontWeight: 700 }}>{ex.weight} kg</span>
                        <span style={{ width: 3, height: 3, borderRadius: 99, background: '#4A584A' }} />
                        <Clock size={11} /> <span className="mono">{ex.rest}s</span>
                      </div>
                    </div>
                    {ex.progress && (
                      <span className="mono" style={{
                        fontSize: 10, fontWeight: 800, color: '#A3E635',
                        padding: '4px 8px', borderRadius: 99, background: 'rgba(163,230,53,0.12)',
                      }}>{ex.progress}</span>
                    )}
                  </div>
                ))}
              </div>

              {/* CTAs */}
              {(current.status === 'today' || current.status === 'planned') && (
                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button onClick={() => router.push('/workout/live/new')} className="gt-btn-primary" style={{
                    width: '100%', height: 54, borderRadius: 16, fontSize: 15,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}>
                    <Play size={16} color="#0A0F0A" /> Inizia live
                  </button>
                  <button onClick={() => router.push('/workout/manual/today')} className="gt-btn-secondary" style={{
                    width: '100%', height: 50, borderRadius: 16, fontSize: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}>
                    <PencilLine size={14} /> Registra manuale
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Week summary */}
        <div style={{ margin: '24px 22px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10, padding: '0 0' }}>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', color: '#A8B5A8', textTransform: 'uppercase' }}>Riepilogo settimana</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { v: '3/5', l: 'Completati', sub: <div style={{ marginTop: 8, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}><div style={{ width: '60%', height: '100%', background: 'linear-gradient(135deg, #A3E635, #65A30D)' }} /></div> },
              { v: '16.5', u: 't', l: 'Volume', sub: <div className="mono" style={{ marginTop: 6, fontSize: 10, color: '#A3E635', fontWeight: 700 }}>+8% vs prev</div> },
              { v: '412', l: 'Reps totali' },
              { v: '79', u: 'min', l: 'Tempo medio' },
            ].map((s, i) => (
              <div key={i} className="gt-card" style={{ padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7B6B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{s.l}</div>
                <div className="mono" style={{ fontSize: 24, fontWeight: 800, color: '#F5F5F4', letterSpacing: '-0.04em', lineHeight: 1 }}>
                  {s.v}{s.u && <span style={{ fontSize: 11, color: '#6B7B6B', marginLeft: 4 }}>{s.u}</span>}
                </div>
                {s.sub}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAB */}
      <button style={{
        position: 'fixed', bottom: 110, right: 22, zIndex: 50,
        width: 56, height: 56, borderRadius: 28,
        background: 'linear-gradient(135deg, #A3E635, #65A30D)',
        border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 12px 30px -4px rgba(163,230,53,0.6), inset 0 1px 0 rgba(255,255,255,0.4)',
      }}>
        <Plus size={24} color="#0A0F0A" />
      </button>
    </div>
  );
}

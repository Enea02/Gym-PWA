'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Clock, Play, PencilLine, Plus, MoreHorizontal, X } from 'lucide-react';

interface PlannedExercise {
  id: string;
  orderIndex: number;
  plannedSets: number;
  plannedReps: number;
  plannedWeightKg: number | null;
  defaultRestSeconds: number | null;
  template: { name: string; muscleGroup: string | null };
}

interface WorkoutPlan {
  id: string;
  name: string;
  dayOfWeek: number;
  exercises: PlannedExercise[];
}

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
const DAY_LABELS_SHORT = ['D', 'L', 'M', 'M', 'G', 'V', 'S'];

function getWeekDates() {
  const today = new Date();
  const dow = today.getDay(); // 0=Sun
  // Start from Monday (or Sunday if that's 0)
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dow + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export default function WorkoutPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  // Selected day index in the week row (0=Mon ... 6=Sun)
  const today = new Date();
  const todayDow = today.getDay(); // 0=Sun,1=Mon,...
  // Convert to Mon-based index: Mon=0,...,Sun=6
  const todayMondayIdx = (todayDow + 6) % 7;
  const [selectedIdx, setSelectedIdx] = useState(todayMondayIdx);

  // Add exercise modal state
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [newEx, setNewEx] = useState({ name: '', muscleGroup: 'chest' as string, sets: 3, reps: 10, weight: 0, rest: 90 });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const weekDates = getWeekDates();

  useEffect(() => {
    fetch('/api/workouts/plans')
      .then(r => r.json())
      .then(data => {
        setPlans(Array.isArray(data) ? data : []);
        setLoadingPlans(false);
      })
      .catch(() => setLoadingPlans(false));
  }, []);

  // Map plan by dayOfWeek (0=Sun..6=Sat)
  // weekDates[0]=Mon, weekDates[6]=Sun
  // weekDates[i].getDay() gives the JS day for that slot
  function getPlanForSlot(slotIdx: number): WorkoutPlan | null {
    const date = weekDates[slotIdx];
    if (!date) return null;
    const dow = date.getDay(); // 0=Sun
    return plans.find(p => p.dayOfWeek === dow) ?? null;
  }

  const currentDate = weekDates[selectedIdx];
  const currentPlan = getPlanForSlot(selectedIdx);
  const isToday = currentDate ? currentDate.toDateString() === today.toDateString() : false;
  const isPast = currentDate ? currentDate < new Date(today.getFullYear(), today.getMonth(), today.getDate()) : false;

  async function handleAddExercise() {
    if (!newEx.name.trim()) {
      setSaveError('Inserisci il nome dell\'esercizio');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      // 1. Create exercise template
      const tplRes = await fetch('/api/exercises/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newEx.name.trim(), muscleGroup: newEx.muscleGroup }),
      });

      if (!tplRes.ok) {
        const err = await tplRes.json().catch(() => ({}));
        throw new Error(err?.error ?? 'Errore creazione esercizio');
      }

      const template = await tplRes.json();

      // 2. Create plan for the selected day if it doesn't exist
      const selectedDate = weekDates[selectedIdx];
      const targetDow = selectedDate ? selectedDate.getDay() : todayDow;
      let plan = plans.find(p => p.dayOfWeek === targetDow) ?? null;

      if (!plan) {
        const planRes = await fetch('/api/workouts/plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `Piano ${DAY_LABELS[(targetDow + 6) % 7]}`,
            dayOfWeek: targetDow,
            exercises: [{
              exerciseTemplateId: template.id,
              orderIndex: 0,
              plannedSets: newEx.sets,
              plannedReps: newEx.reps,
              plannedWeightKg: newEx.weight > 0 ? newEx.weight : null,
              defaultRestSeconds: newEx.rest,
            }],
          }),
        });
        if (!planRes.ok) {
          const err = await planRes.json().catch(() => ({}));
          throw new Error(err?.error ?? 'Errore creazione piano');
        }
        const newPlan = await planRes.json();
        setPlans(prev => [...prev, newPlan]);
      } else {
        // Add exercise to existing plan
        const planRes = await fetch(`/api/workouts/plans/${plan.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exercises: [...plan.exercises.map((ex, i) => ({
              exerciseTemplateId: ex.template ? (ex as any).exerciseTemplateId ?? ex.id : ex.id,
              orderIndex: ex.orderIndex,
              plannedSets: ex.plannedSets,
              plannedReps: ex.plannedReps,
              plannedWeightKg: ex.plannedWeightKg,
              defaultRestSeconds: ex.defaultRestSeconds,
            })), {
              exerciseTemplateId: template.id,
              orderIndex: plan.exercises.length,
              plannedSets: newEx.sets,
              plannedReps: newEx.reps,
              plannedWeightKg: newEx.weight > 0 ? newEx.weight : null,
              defaultRestSeconds: newEx.rest,
            }],
          }),
        });
        // If PATCH not available, just refresh
        if (planRes.ok) {
          const updated = await planRes.json();
          setPlans(prev => prev.map(p => p.id === plan!.id ? updated : p));
        }
      }

      // Refresh plans
      const refreshed = await fetch('/api/workouts/plans').then(r => r.json());
      if (Array.isArray(refreshed)) setPlans(refreshed);

      setShowAddExercise(false);
      setNewEx({ name: '', muscleGroup: 'chest', sets: 3, reps: 10, weight: 0, rest: 90 });
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Errore sconosciuto');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#0A0F0A', overflow: 'hidden' }}>
      <div className="gt-scroll" style={{ position: 'absolute', inset: 0, paddingTop: 44, paddingBottom: 130 }}>
        {/* Top */}
        <div style={{ padding: '14px 22px 12px' }}>
          <div style={{ fontSize: 13, color: '#6B7B6B', fontWeight: 600, marginBottom: 2 }}>
            {today.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })} · Settimana {getWeekNumber(today)}
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>Allenamenti</h1>
        </div>

        {/* Days row */}
        <div style={{ display: 'flex', gap: 7, padding: '6px 22px 18px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {weekDates.map((date, i) => {
            const isSelected = i === selectedIdx;
            const isThisToday = date.toDateString() === today.getDate().toString() || date.toDateString() === today.toDateString();
            const hasPlan = getPlanForSlot(i) !== null;
            const dayLabel = DAY_LABELS_SHORT[(date.getDay() + 6) % 7] ?? '';
            const dayNum = date.getDate();
            return (
              <button key={i} onClick={() => setSelectedIdx(i)} style={{
                appearance: 'none', flex: 1, minWidth: 42,
                padding: '12px 6px',
                background: isSelected ? 'linear-gradient(135deg, #A3E635, #65A30D)' : '#1A2420',
                border: isSelected ? 'none' : `1px solid rgba(163,230,53,${isThisToday ? 0.4 : 0.12})`,
                borderRadius: 14, cursor: 'pointer',
                color: isSelected ? '#0A0F0A' : '#F5F5F4',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                boxShadow: isSelected ? '0 6px 20px -4px rgba(163,230,53,0.5)' : 'none',
              }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                  color: isSelected ? '#0A0F0A' : (isThisToday ? '#A3E635' : '#6B7B6B'),
                }}>{dayLabel}</span>
                <span className="mono" style={{ fontSize: 18, fontWeight: 800 }}>{dayNum}</span>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: hasPlan ? (isSelected ? '#0A0F0A' : '#A3E635') : 'transparent',
                  border: !hasPlan ? `1.5px solid rgba(163,230,53,0.3)` : 'none',
                  boxShadow: (hasPlan && !isSelected) ? '0 0 6px rgba(163,230,53,0.7)' : 'none',
                }} />
              </button>
            );
          })}
        </div>

        {/* Day detail */}
        <div style={{ margin: '0 22px' }}>
          {loadingPlans ? (
            <div className="gt-card" style={{ padding: '28px 22px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: '#6B7B6B' }}>Caricamento...</div>
            </div>
          ) : currentPlan ? (
            <div className="gt-card-hi" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  {isToday && (
                    <div className="gt-chip" style={{ marginBottom: 8 }}>
                      <span style={{ width: 6, height: 6, borderRadius: 99, background: '#A3E635' }} /> OGGI
                    </div>
                  )}
                  {isPast && !isToday && (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 99,
                      background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
                      color: '#22C55E', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8,
                    }}>
                      <CheckCircle2 size={12} /> PASSATO
                    </div>
                  )}
                  {!isToday && !isPast && (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 99,
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                      color: '#A8B5A8', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8,
                    }}>
                      <Clock size={12} /> PROGRAMMATO
                    </div>
                  )}
                  <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>{currentPlan.name}</div>
                  <div style={{ fontSize: 13, color: '#A8B5A8', marginTop: 3 }}>{currentPlan.exercises.length} esercizi</div>
                </div>
                <button style={{
                  width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.06)', color: '#A8B5A8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                }}><MoreHorizontal size={18} /></button>
              </div>

              {/* Exercise list */}
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {currentPlan.exercises.map((ex, i) => (
                  <div key={ex.id} style={{
                    background: '#1A2420', border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 14, padding: '12px 14px',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: 'rgba(163,230,53,0.08)',
                      border: '1px solid rgba(163,230,53,0.18)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#A3E635',
                    }}>
                      <span className="mono" style={{ fontSize: 13, fontWeight: 800 }}>{String(i + 1).padStart(2, '0')}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.template.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6B7B6B', fontSize: 11, marginTop: 3 }}>
                        <span className="mono" style={{ fontWeight: 700 }}>{ex.plannedSets}×{ex.plannedReps}</span>
                        {ex.plannedWeightKg && (
                          <>
                            <span style={{ width: 3, height: 3, borderRadius: 99, background: '#4A584A' }} />
                            <span className="mono" style={{ fontWeight: 700 }}>{ex.plannedWeightKg} kg</span>
                          </>
                        )}
                        {ex.defaultRestSeconds && (
                          <>
                            <span style={{ width: 3, height: 3, borderRadius: 99, background: '#4A584A' }} />
                            <Clock size={11} /> <span className="mono">{ex.defaultRestSeconds}s</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTAs */}
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
            </div>
          ) : (
            <div className="gt-card" style={{ padding: '32px 22px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 34 }}>🏋️</div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>Nessun piano configurato</div>
              <div style={{ fontSize: 13, color: '#A8B5A8', lineHeight: 1.5 }}>
                Premi <span style={{ color: '#A3E635', fontWeight: 700 }}>+</span> per aggiungere esercizi a questo giorno.
              </div>
              <button onClick={() => setShowAddExercise(true)} style={{
                marginTop: 6, padding: '10px 20px', borderRadius: 99,
                background: 'rgba(163,230,53,0.12)', border: '1px solid rgba(163,230,53,0.3)',
                color: '#A3E635', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                <Plus size={14} color="#A3E635" /> Aggiungi esercizio
              </button>
            </div>
          )}
        </div>

        {/* Week summary */}
        <div style={{ margin: '24px 22px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', color: '#A8B5A8', textTransform: 'uppercase' }}>Riepilogo settimana</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="gt-card" style={{ padding: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7B6B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Pianificati</div>
              <div className="mono" style={{ fontSize: 24, fontWeight: 800, color: '#F5F5F4' }}>{plans.length}<span style={{ fontSize: 11, color: '#6B7B6B', marginLeft: 4 }}>giorni</span></div>
              <div style={{ marginTop: 8, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, (plans.length / 7) * 100)}%`, height: '100%', background: 'linear-gradient(135deg, #A3E635, #65A30D)' }} />
              </div>
            </div>
            <div className="gt-card" style={{ padding: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7B6B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Esercizi totali</div>
              <div className="mono" style={{ fontSize: 24, fontWeight: 800, color: '#F5F5F4' }}>
                {plans.reduce((sum, p) => sum + p.exercises.length, 0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAB */}
      <button onClick={() => setShowAddExercise(true)} style={{
        position: 'fixed', bottom: 110, right: 22, zIndex: 50,
        width: 56, height: 56, borderRadius: 28,
        background: 'linear-gradient(135deg, #A3E635, #65A30D)',
        border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 12px 30px -4px rgba(163,230,53,0.6), inset 0 1px 0 rgba(255,255,255,0.4)',
      }}>
        <Plus size={24} color="#0A0F0A" />
      </button>

      {/* Add Exercise Modal */}
      {showAddExercise && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(7,11,7,0.88)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'flex-end',
        }} onClick={e => { if (e.target === e.currentTarget) setShowAddExercise(false); }}>
          <div style={{
            width: '100%', background: '#141A14',
            border: '1px solid rgba(163,230,53,0.2)', borderBottom: 'none',
            borderRadius: '24px 24px 0 0',
            padding: '20px 22px 40px',
            animation: 'gt-slide-up 0.3s ease',
          }}>
            {/* Handle */}
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '0 auto 18px' }} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>Aggiungi esercizio</div>
                <div style={{ fontSize: 12, color: '#6B7B6B', marginTop: 2 }}>
                  {currentDate ? DAY_LABELS[(currentDate.getDay() + 6) % 7] + ' ' + currentDate.getDate() : 'Oggi'}
                </div>
              </div>
              <button onClick={() => setShowAddExercise(false)} style={{
                width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.06)',
                border: 'none', color: '#A8B5A8', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <X size={16} />
              </button>
            </div>

            {/* Form fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Name */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7B6B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Nome esercizio</div>
                <input
                  type="text"
                  placeholder="es. Panca piana bilanciere"
                  value={newEx.name}
                  onChange={e => setNewEx(s => ({ ...s, name: e.target.value }))}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    height: 44, padding: '0 14px', fontSize: 14, fontWeight: 600, color: '#F5F5F4',
                    background: '#1A2420', border: '1px solid rgba(163,230,53,0.2)',
                    borderRadius: 12, outline: 'none', fontFamily: 'Manrope, sans-serif',
                  }}
                />
              </div>

              {/* Muscle group */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7B6B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Gruppo muscolare</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {[
                    { k: 'chest', l: '🏋️ Petto' }, { k: 'back', l: '🪨 Schiena' },
                    { k: 'legs', l: '🦵 Gambe' }, { k: 'shoulders', l: '💪 Spalle' },
                    { k: 'arms', l: '🦾 Braccia' }, { k: 'core', l: '🎯 Core' },
                    { k: 'cardio', l: '🫀 Cardio' },
                  ].map(m => (
                    <button key={m.k} onClick={() => setNewEx(s => ({ ...s, muscleGroup: m.k }))} style={{
                      padding: '6px 12px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                      background: newEx.muscleGroup === m.k ? 'linear-gradient(135deg,#A3E635,#65A30D)' : 'rgba(255,255,255,0.06)',
                      color: newEx.muscleGroup === m.k ? '#0A0F0A' : '#A8B5A8',
                    }}>{m.l}</button>
                  ))}
                </div>
              </div>

              {/* Series / Reps / Weight / Rest — 2x2 grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Serie', key: 'sets' as const, step: 1, suffix: '' },
                  { label: 'Ripetizioni', key: 'reps' as const, step: 1, suffix: '' },
                  { label: 'Peso (kg)', key: 'weight' as const, step: 2.5, suffix: 'kg' },
                  { label: 'Riposo (sec)', key: 'rest' as const, step: 15, suffix: 's' },
                ].map(f => (
                  <div key={f.key}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7B6B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{f.label}</div>
                    <div style={{ display: 'flex', alignItems: 'center', background: '#1A2420', border: '1px solid rgba(163,230,53,0.15)', borderRadius: 12, overflow: 'hidden' }}>
                      <button
                        onClick={() => setNewEx(s => ({ ...s, [f.key]: Math.max(0, s[f.key] - f.step) }))}
                        style={{ width: 36, height: 42, background: 'transparent', border: 'none', color: '#A3E635', fontSize: 18, cursor: 'pointer', flexShrink: 0 }}
                      >−</button>
                      <div className="mono" style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 800, color: '#F5F5F4' }}>
                        {newEx[f.key]}{f.suffix}
                      </div>
                      <button
                        onClick={() => setNewEx(s => ({ ...s, [f.key]: s[f.key] + f.step }))}
                        style={{ width: 36, height: 42, background: 'transparent', border: 'none', color: '#A3E635', fontSize: 18, cursor: 'pointer', flexShrink: 0 }}
                      >+</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Error */}
              {saveError && (
                <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444', fontSize: 12, fontWeight: 600 }}>
                  {saveError}
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleAddExercise}
                disabled={saving}
                className="gt-btn-primary"
                style={{
                  width: '100%', height: 54, borderRadius: 16, fontSize: 15, marginTop: 4,
                  opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Salvataggio...' : 'Aggiungi esercizio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

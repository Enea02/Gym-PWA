'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Plus, X, Check } from 'lucide-react';

const DOW_LABELS = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
const DOW_JS = [0, 1, 2, 3, 4, 5, 6]; // Sunday=0

const MUSCLE_GROUPS = [
  { k: 'chest', l: '🏋️ Petto' }, { k: 'back', l: '🪨 Schiena' },
  { k: 'legs', l: '🦵 Gambe' }, { k: 'shoulders', l: '💪 Spalle' },
  { k: 'arms', l: '🦾 Braccia' }, { k: 'core', l: '🎯 Core' }, { k: 'cardio', l: '🫀 Cardio' },
];

interface Exercise {
  name: string;
  muscleGroup: string;
  sets: number;
  reps: number;
  weight: number;
  rest: number;
}

interface TrainingDay {
  name: string;
  dayOfWeek: number; // JS day 0=Sun
  exercises: Exercise[];
}

function newExercise(): Exercise {
  return { name: '', muscleGroup: 'chest', sets: 4, reps: 8, weight: 60, rest: 90 };
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '10px 12px',
  fontSize: 14, color: '#F5F5F4', background: '#111811',
  border: '1px solid rgba(163,230,53,0.18)', borderRadius: 10,
  outline: 'none', fontFamily: 'Manrope, sans-serif',
};

function NumInput({ value, onChange, min = 0, step = 1 }: { value: number; onChange: (v: number) => void; min?: number; step?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', background: '#111811', border: '1px solid rgba(163,230,53,0.15)', borderRadius: 10, overflow: 'hidden' }}>
      <button type="button" onClick={() => onChange(Math.max(min, value - step))}
        style={{ width: 34, height: 38, background: 'transparent', border: 'none', color: '#A3E635', fontSize: 18, cursor: 'pointer', flexShrink: 0 }}>−</button>
      <span className="mono" style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 800, color: '#F5F5F4' }}>{value}</span>
      <button type="button" onClick={() => onChange(value + step)}
        style={{ width: 34, height: 38, background: 'transparent', border: 'none', color: '#A3E635', fontSize: 18, cursor: 'pointer', flexShrink: 0 }}>+</button>
    </div>
  );
}

export default function PlannerPage() {
  const router = useRouter();
  const [step, setStep] = useState<'days' | 'exercises' | 'saving'>('days');
  const [numDays, setNumDays] = useState(3);
  const [days, setDays] = useState<TrainingDay[]>([]);
  const [currentDayIdx, setCurrentDayIdx] = useState(0);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // ── Step 1: choose days ──
  function initDays() {
    const defaultDow = [1, 3, 5, 2, 4, 6, 0]; // Mon,Wed,Fri,Tue,Thu,Sat,Sun
    const names = ['Giorno A', 'Giorno B', 'Giorno C', 'Giorno D', 'Giorno E', 'Giorno F', 'Giorno G'];
    const d: TrainingDay[] = Array.from({ length: numDays }, (_, i) => ({
      name: names[i] ?? `Giorno ${i + 1}`,
      dayOfWeek: defaultDow[i] ?? i,
      exercises: [],
    }));
    setDays(d);
    setCurrentDayIdx(0);
    setStep('exercises');
  }

  // ── Exercise helpers ──
  function updateDay(idx: number, patch: Partial<TrainingDay>) {
    setDays(prev => prev.map((d, i) => i === idx ? { ...d, ...patch } : d));
  }

  function addExercise(dayIdx: number) {
    setDays(prev => prev.map((d, i) => i === dayIdx ? { ...d, exercises: [...d.exercises, newExercise()] } : d));
  }

  function updateExercise(dayIdx: number, exIdx: number, patch: Partial<Exercise>) {
    setDays(prev => prev.map((d, i) => i !== dayIdx ? d : {
      ...d,
      exercises: d.exercises.map((e, j) => j !== exIdx ? e : { ...e, ...patch }),
    }));
  }

  function removeExercise(dayIdx: number, exIdx: number) {
    setDays(prev => prev.map((d, i) => i !== dayIdx ? d : {
      ...d, exercises: d.exercises.filter((_, j) => j !== exIdx),
    }));
  }

  // ── Save ──
  async function save() {
    // Validation
    for (const d of days) {
      if (!d.name.trim()) { setError('Dai un nome ad ogni giorno'); return; }
      if (d.exercises.length === 0) { setError(`"${d.name}" non ha esercizi`); return; }
      for (const ex of d.exercises) {
        if (!ex.name.trim()) { setError(`Un esercizio in "${d.name}" non ha nome`); return; }
      }
    }

    setSaving(true); setError('');

    try {
      for (const day of days) {
        // 1. Create exercise templates
        const templateIds: string[] = [];
        for (const ex of day.exercises) {
          const res = await fetch('/api/exercises/templates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: ex.name.trim(), muscleGroup: ex.muscleGroup }),
          });
          if (!res.ok) throw new Error('Errore creazione esercizi');
          const tpl = await res.json();
          templateIds.push(tpl.id);
        }

        // 2. Create workout plan
        const planRes = await fetch('/api/workouts/plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: day.name.trim(),
            dayOfWeek: day.dayOfWeek,
            exercises: day.exercises.map((ex, i) => ({
              exerciseTemplateId: templateIds[i],
              orderIndex: i,
              plannedSets: ex.sets,
              plannedReps: ex.reps,
              plannedWeightKg: ex.weight > 0 ? ex.weight : null,
              defaultRestSeconds: ex.rest,
            })),
          }),
        });
        if (!planRes.ok) throw new Error('Errore creazione piano');
      }

      router.push('/workout');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore sconosciuto');
      setSaving(false);
    }
  }

  const currentDay = days[currentDayIdx];

  // ─────────── STEP 1: choose number of days ───────────
  if (step === 'days') {
    return (
      <div style={{ position: 'relative', minHeight: '100vh', background: '#0A0F0A' }}>
        {/* top glow */}
        <div style={{ position: 'absolute', top: -80, left: -40, right: -40, height: 300, background: 'radial-gradient(60% 60% at 50% 30%, rgba(163,230,53,0.2), transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', padding: '56px 22px 130px' }}>
          <button onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: 11, background: 'rgba(255,255,255,0.06)', border: 'none', color: '#F5F5F4', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: 28 }}>
            <ChevronLeft size={18} />
          </button>

          <div className="gt-chip" style={{ marginBottom: 12 }}>🗓️ Nuova Scheda</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 8px' }}>Crea la tua scheda</h1>
          <p style={{ fontSize: 14, color: '#A8B5A8', margin: '0 0 40px', lineHeight: 1.5 }}>
            Quanti giorni di allenamento a settimana vuoi pianificare?
          </p>

          {/* Day selector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 40 }}>
            {[1, 2, 3, 4, 5, 6, 7].map(n => (
              <button key={n} onClick={() => setNumDays(n)} style={{
                height: 72, borderRadius: 20, border: 'none', cursor: 'pointer',
                background: numDays === n ? 'linear-gradient(135deg, #A3E635, #65A30D)' : '#1A2420',
                outline: numDays === n ? 'none' : '1px solid rgba(163,230,53,0.1)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                boxShadow: numDays === n ? '0 8px 24px -4px rgba(163,230,53,0.5)' : 'none',
                transform: numDays === n ? 'translateY(-2px)' : 'none',
                transition: 'all 0.2s',
              }}>
                <span className="mono" style={{ fontSize: 28, fontWeight: 800, color: numDays === n ? '#0A0F0A' : '#F5F5F4', lineHeight: 1 }}>{n}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: numDays === n ? '#0A0F0A' : '#6B7B6B', textTransform: 'uppercase' }}>
                  {n === 1 ? 'giorno' : 'giorni'}
                </span>
              </button>
            ))}
          </div>

          {/* Common presets */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7B6B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Schede popolari</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { days: 3, name: 'Full Body 3×', desc: 'Lun/Mer/Ven — ideale per principianti e intermedi' },
                { days: 4, name: 'Upper/Lower 4×', desc: 'Lun/Mar/Gio/Ven — ottimo per la progressione' },
                { days: 5, name: 'Push/Pull/Legs 5×', desc: 'Lun–Ven — per atleti avanzati' },
              ].map(p => (
                <button key={p.days} onClick={() => setNumDays(p.days)} style={{
                  padding: '12px 14px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)',
                  background: numDays === p.days ? 'rgba(163,230,53,0.08)' : '#1A2420',
                  cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12,
                  outline: numDays === p.days ? '1px solid rgba(163,230,53,0.3)' : 'none',
                }}>
                  <div className="mono" style={{ fontSize: 20, fontWeight: 800, color: '#A3E635', width: 24, textAlign: 'center' }}>{p.days}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#F5F5F4', marginBottom: 2 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: '#6B7B6B' }}>{p.desc}</div>
                  </div>
                  {numDays === p.days && <Check size={16} color="#A3E635" style={{ marginLeft: 'auto' }} />}
                </button>
              ))}
            </div>
          </div>

          <button onClick={initDays} className="gt-btn-primary" style={{ width: '100%', height: 56, borderRadius: 18, fontSize: 16 }}>
            Avanti → Aggiungi esercizi
          </button>
        </div>
      </div>
    );
  }

  // ─────────── STEP 2: add exercises per day ───────────
  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#0A0F0A' }}>
      {/* Fixed header */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 20, background: '#0A0F0A', padding: '44px 18px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => setStep('days')} style={{ width: 36, height: 36, borderRadius: 11, background: 'rgba(255,255,255,0.06)', border: 'none', color: '#F5F5F4', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <ChevronLeft size={18} />
          </button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#6B7B6B', fontWeight: 700, textTransform: 'uppercase' }}>Scheda · {days.length} giorni</div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>Configura gli esercizi</div>
          </div>
          <button onClick={save} disabled={saving} style={{ padding: '6px 14px', borderRadius: 10, background: 'linear-gradient(135deg, #A3E635, #65A30D)', border: 'none', color: '#0A0F0A', fontWeight: 800, fontSize: 13, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? '...' : 'Salva'}
          </button>
        </div>

        {/* Day tabs */}
        <div style={{ display: 'flex', gap: 6, marginTop: 10, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {days.map((d, i) => (
            <button key={i} onClick={() => setCurrentDayIdx(i)} style={{
              flexShrink: 0, padding: '6px 14px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
              background: currentDayIdx === i ? 'linear-gradient(135deg, #A3E635, #65A30D)' : 'rgba(255,255,255,0.06)',
              color: currentDayIdx === i ? '#0A0F0A' : '#A8B5A8',
            }}>
              {d.name || `Giorno ${i + 1}`}
              {d.exercises.length > 0 && <span style={{ marginLeft: 5, fontSize: 10, opacity: 0.8 }}>({d.exercises.length})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ paddingTop: 148, paddingBottom: 130, padding: '148px 18px 130px' }}>
        {currentDay && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Day name + day of week */}
            <div className="gt-card" style={{ padding: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7B6B', textTransform: 'uppercase', marginBottom: 6 }}>Nome giorno</div>
                  <input value={currentDay.name} onChange={e => updateDay(currentDayIdx, { name: e.target.value })} style={inputStyle} placeholder="es. Push Day" />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7B6B', textTransform: 'uppercase', marginBottom: 6 }}>Giorno settimana</div>
                  <select value={currentDay.dayOfWeek} onChange={e => updateDay(currentDayIdx, { dayOfWeek: +e.target.value })}
                    style={{ ...inputStyle, appearance: 'none', WebkitAppearance: 'none' }}>
                    {DOW_JS.map(d => <option key={d} value={d}>{DOW_LABELS[d]}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Exercise list */}
            {currentDay.exercises.map((ex, ei) => (
              <div key={ei} className="gt-card-hi" style={{ padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div className="mono" style={{ fontSize: 12, fontWeight: 800, color: '#A3E635' }}>
                    Esercizio {ei + 1}
                  </div>
                  <button onClick={() => removeExercise(currentDayIdx, ei)} style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={14} color="#EF4444" />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Name */}
                  <input value={ex.name} onChange={e => updateExercise(currentDayIdx, ei, { name: e.target.value })}
                    placeholder="Nome esercizio" style={inputStyle} />

                  {/* Muscle group */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {MUSCLE_GROUPS.map(m => (
                      <button key={m.k} type="button" onClick={() => updateExercise(currentDayIdx, ei, { muscleGroup: m.k })} style={{
                        padding: '4px 10px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                        background: ex.muscleGroup === m.k ? 'linear-gradient(135deg, #A3E635, #65A30D)' : 'rgba(255,255,255,0.06)',
                        color: ex.muscleGroup === m.k ? '#0A0F0A' : '#A8B5A8',
                      }}>{m.l}</button>
                    ))}
                  </div>

                  {/* Sets/Reps/Weight/Rest */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                      { l: 'Serie', k: 'sets' as const, step: 1, min: 1 },
                      { l: 'Reps', k: 'reps' as const, step: 1, min: 1 },
                      { l: 'Peso (kg)', k: 'weight' as const, step: 2.5, min: 0 },
                      { l: 'Riposo (s)', k: 'rest' as const, step: 15, min: 15 },
                    ].map(f => (
                      <div key={f.k}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7B6B', textTransform: 'uppercase', marginBottom: 4 }}>{f.l}</div>
                        <NumInput value={ex[f.k]} onChange={v => updateExercise(currentDayIdx, ei, { [f.k]: v })} step={f.step} min={f.min} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Add exercise button */}
            <button onClick={() => addExercise(currentDayIdx)} style={{
              width: '100%', padding: '14px 0', borderRadius: 14,
              background: 'transparent', border: '1.5px dashed rgba(163,230,53,0.35)',
              color: '#A3E635', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <Plus size={16} color="#A3E635" /> Aggiungi esercizio
            </button>

            {error && (
              <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444', fontSize: 13 }}>
                {error}
              </div>
            )}

            {/* Navigation between days */}
            <div style={{ display: 'flex', gap: 8 }}>
              {currentDayIdx > 0 && (
                <button onClick={() => setCurrentDayIdx(i => i - 1)} className="gt-btn-secondary" style={{ flex: 1, height: 48, borderRadius: 14, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  ← {days[currentDayIdx - 1]?.name}
                </button>
              )}
              {currentDayIdx < days.length - 1 ? (
                <button onClick={() => setCurrentDayIdx(i => i + 1)} className="gt-btn-primary" style={{ flex: 1, height: 48, borderRadius: 14, fontSize: 13 }}>
                  {days[currentDayIdx + 1]?.name} →
                </button>
              ) : (
                <button onClick={save} disabled={saving} className="gt-btn-primary" style={{ flex: 1, height: 54, borderRadius: 16, fontSize: 15, opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Salvataggio…' : '✓ Salva scheda'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

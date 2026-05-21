'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, MoreHorizontal, Check, Plus, ChevronRight, Square, Zap, Bell, Play, CheckCircle2 } from 'lucide-react';
import { Stepper } from '@/components/ui/Stepper';
import { ProgressDots } from '@/components/ui/ProgressDots';
import { RatingCircle } from '@/components/ui/RatingCircle';
import { Confetti } from '@/components/ui/Confetti';

const DEMO_EXERCISES = [
  { id: 'bench', name: 'Panca piana bilanciere', muscle: 'Petto', sets: 4, reps: 8, weight: 92.5, rest: 120, pr: 90 },
  { id: 'incline', name: 'Panca inclinata manubri', muscle: 'Petto', sets: 4, reps: 10, weight: 32, rest: 90 },
  { id: 'ohp', name: 'Military press', muscle: 'Spalle', sets: 4, reps: 6, weight: 57.5, rest: 120, pr: 60 },
  { id: 'lat-raise', name: 'Alzate laterali', muscle: 'Spalle', sets: 5, reps: 12, weight: 12, rest: 60 },
  { id: 'dips', name: 'Dips parallele', muscle: 'Petto', sets: 4, reps: 10, weight: 10, rest: 90 },
  { id: 'pushdown', name: 'Push-down ai cavi', muscle: 'Tricipiti', sets: 4, reps: 12, weight: 27.5, rest: 60 },
];

function mmss(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

type ExerciseStatus = 'pending' | 'active' | 'done';

interface ExerciseState {
  id: string;
  name: string;
  muscle: string;
  sets: number;
  reps: number;
  weight: number;
  rest: number;
  pr?: number;
  completedSets: number;
  status: ExerciseStatus;
}

export default function LiveTrackingPage() {
  const router = useRouter();

  // View: 'list' = exercise selection overview, 'exercise' = active exercise
  const [view, setView] = useState<'list' | 'exercise'>('list');
  const [activeExIdx, setActiveExIdx] = useState<number | null>(null);

  // Exercises state
  const [exercises, setExercises] = useState<ExerciseState[]>(() =>
    DEMO_EXERCISES.map(e => ({ ...e, completedSets: 0, status: 'pending' as ExerciseStatus }))
  );

  // Per-exercise state (set counter, weight, reps)
  const [setIdx, setSetIdx] = useState(1);
  const [weight, setWeight] = useState(0);
  const [reps, setReps] = useState(0);
  const [volume, setVolume] = useState(0);

  // Session timer (always running)
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Rest timer
  const [resting, setResting] = useState(false);
  const [restRemaining, setRestRemaining] = useState(0);
  const [restTotal, setRestTotal] = useState(0);
  useEffect(() => {
    if (!resting || restRemaining <= 0) { if (restRemaining <= 0) setResting(false); return; }
    const id = setTimeout(() => setRestRemaining(r => r - 1), 1000);
    return () => clearTimeout(id);
  }, [resting, restRemaining]);

  // PR celebration
  const [prCelebration, setPrCelebration] = useState<{ name: string; prev: number; value: number } | null>(null);

  const activeEx = activeExIdx !== null ? exercises[activeExIdx] : null;

  function openExercise(idx: number) {
    const ex = exercises[idx];
    if (!ex || ex.status === 'done') return;
    setActiveExIdx(idx);
    setSetIdx(ex.completedSets + 1);
    setWeight(ex.weight);
    setReps(ex.reps);
    setExercises(prev => prev.map((e, i) => i === idx ? { ...e, status: 'active' } : e));
    setView('exercise');
  }

  function completeSet() {
    if (activeExIdx === null || !activeEx) return;
    const newVol = weight * reps;
    setVolume(v => v + newVol);

    if (activeEx.pr && weight > activeEx.pr) {
      setPrCelebration({ name: activeEx.name, prev: activeEx.pr, value: weight });
    }

    const newCompleted = activeEx.completedSets + 1;
    const isDone = newCompleted >= activeEx.sets;

    setExercises(prev => prev.map((e, i) => i === activeExIdx ? {
      ...e,
      completedSets: newCompleted,
      status: isDone ? 'done' : 'active',
    } : e));

    if (isDone) {
      setView('list');
      setActiveExIdx(null);
      return;
    }

    // Start rest timer
    const restSec = activeEx.rest;
    setRestRemaining(restSec);
    setRestTotal(restSec);
    setResting(true);
    setSetIdx(s => s + 1);
  }

  const completedCount = exercises.filter(e => e.status === 'done').length;
  const allDone = completedCount === exercises.length;

  // ─── LIVE header (always visible) ───
  function LiveHeader({ onBack }: { onBack: () => void }) {
    return (
      <div style={{ position: 'absolute', top: 44, left: 16, right: 16, zIndex: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onBack} style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', color: '#F5F5F4', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ChevronLeft size={18} />
        </button>
        <div style={{ padding: '7px 14px', borderRadius: 99, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(163,230,53,0.25)', backdropFilter: 'blur(10px)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: 99, background: '#00FF88', boxShadow: '0 0 8px #00FF88', animation: 'gt-pulse 1.6s ease-in-out infinite' }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: '#A3E635' }}>LIVE</span>
          <span style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.12)' }} />
          <span className="mono" style={{ fontSize: 12, fontWeight: 700 }}>{mmss(elapsed)}</span>
          <span style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.12)' }} />
          <span className="mono" style={{ fontSize: 11, color: '#A3E635', fontWeight: 700 }}>{completedCount}/{exercises.length}</span>
        </div>
        <button style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', color: '#F5F5F4', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <MoreHorizontal size={18} />
        </button>
      </div>
    );
  }

  // ─── VIEW: EXERCISE LIST ───
  if (view === 'list') {
    return (
      <div style={{ position: 'fixed', inset: 0, background: `radial-gradient(80% 50% at 50% 0%, rgba(163,230,53,0.12), transparent 60%), #070B07`, overflow: 'hidden' }}>
        <LiveHeader onBack={() => router.back()} />

        {/* Scrollable list — fix: use min-height: 100% + paddingBottom so it always scrolls fully */}
        <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' as any, paddingTop: 100, paddingBottom: 100 }}>
          <div style={{ padding: '0 18px', minHeight: '100%' }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 4px' }}>
              {allDone ? '✅ Allenamento completato!' : 'Scegli esercizio'}
            </h2>
            <p style={{ fontSize: 13, color: '#A8B5A8', margin: '0 0 18px' }}>
              {allDone
                ? `Ottimo! ${volume.toLocaleString('it-IT')} kg di volume totale`
                : 'Tocca un esercizio per iniziare o continuare'}
            </p>

            {/* Progress bar */}
            <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', marginBottom: 18, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(completedCount / exercises.length) * 100}%`, background: 'linear-gradient(90deg, #A3E635, #65A30D)', borderRadius: 2, transition: 'width 0.4s' }} />
            </div>

            {/* Exercise rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {exercises.map((ex, i) => {
                const isDone = ex.status === 'done';
                const isActive = ex.status === 'active';
                return (
                  <button key={ex.id} onClick={() => !isDone && openExercise(i)} style={{
                    appearance: 'none', width: '100%', textAlign: 'left',
                    padding: '14px 16px', borderRadius: 18,
                    background: isDone
                      ? 'rgba(34,197,94,0.08)'
                      : isActive
                      ? 'rgba(163,230,53,0.1)'
                      : '#1A2420',
                    border: isDone
                      ? '1px solid rgba(34,197,94,0.25)'
                      : isActive
                      ? '1px solid rgba(163,230,53,0.35)'
                      : '1px solid rgba(255,255,255,0.06)',
                    cursor: isDone ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: 14,
                  }}>
                    {/* Status icon */}
                    <div style={{
                      width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                      background: isDone
                        ? 'rgba(34,197,94,0.2)'
                        : isActive
                        ? 'linear-gradient(135deg, #A3E635, #65A30D)'
                        : 'rgba(255,255,255,0.04)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {isDone
                        ? <CheckCircle2 size={20} color="#22C55E" />
                        : isActive
                        ? <Play size={18} color="#0A0F0A" />
                        : <span className="mono" style={{ fontSize: 13, fontWeight: 800, color: '#6B7B6B' }}>{String(i + 1).padStart(2, '0')}</span>}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isDone ? '#22C55E' : '#F5F5F4', marginBottom: 3 }}>
                        {ex.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#6B7B6B' }}>
                        <span className="mono">{ex.sets}×{ex.reps}</span>
                        <span>·</span>
                        <span className="mono">{ex.weight} kg</span>
                        <span>·</span>
                        <span className="mono">{ex.rest}s</span>
                      </div>
                    </div>

                    {/* Set progress */}
                    <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <ProgressDots total={ex.sets} done={ex.completedSets} size={10} />
                      <span className="mono" style={{ fontSize: 10, color: isDone ? '#22C55E' : '#6B7B6B', fontWeight: 700 }}>
                        {ex.completedSets}/{ex.sets}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Volume + finish */}
            <div style={{ marginTop: 20, padding: '14px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: '#6B7B6B', fontWeight: 700, textTransform: 'uppercase' }}>Volume sessione</div>
                <div className="mono" style={{ fontSize: 20, fontWeight: 800 }}>{volume.toLocaleString('it-IT')} <span style={{ fontSize: 11, color: '#6B7B6B' }}>kg</span></div>
              </div>
              <button onClick={() => router.back()} style={{ padding: '10px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Square size={12} color="#EF4444" /> Finisci
              </button>
            </div>
          </div>
        </div>

        {/* Rest overlay (can appear over list too) */}
        {resting && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 90, background: 'rgba(7,11,7,0.94)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 100, animation: 'gt-bounce-in 0.4s cubic-bezier(0.6,1.5,0.4,1)' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#A3E635', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 4 }}>RECUPERO</div>
            <div style={{ fontSize: 13, color: '#A8B5A8', marginBottom: 24 }}>Prossima serie in arrivo…</div>
            <RatingCircle score={restRemaining} label="SECONDI" size={260} />
            <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 10, width: 260 }}>
              <button onClick={() => { setResting(false); setRestRemaining(0); openExercise(activeExIdx!); }} className="gt-btn-primary" style={{ width: '100%', height: 54, borderRadius: 18, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Zap size={14} color="#0A0F0A" /> Salta riposo
              </button>
              <button onClick={() => { setRestRemaining(r => r + 30); setRestTotal(t => t + 30); }} className="gt-btn-secondary" style={{ width: '100%', height: 48, borderRadius: 14, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Plus size={14} /> +30s
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── VIEW: ACTIVE EXERCISE ───
  if (!activeEx || activeExIdx === null) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: `radial-gradient(80% 50% at 50% 0%, rgba(163,230,53,0.18), transparent 60%), #070B07`, overflow: 'hidden' }}>
      <LiveHeader onBack={() => setView('list')} />

      {/* Scrollable exercise detail — fix: no overflow hidden on parent */}
      <div style={{
        position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
        overflowY: 'auto',
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch' as any,
        paddingTop: 100,
        paddingBottom: 32,
      }}>
        <div style={{ padding: '0 20px', minHeight: '100%' }}>
          {/* Exercise meta */}
          <div style={{ fontSize: 11, fontWeight: 700, color: '#A3E635', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            Esercizio {activeExIdx + 1} / {exercises.length}
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 6px', lineHeight: 1.15 }}>{activeEx.name}</h1>
          <div style={{ display: 'flex', gap: 12, color: '#A8B5A8', fontSize: 12, marginBottom: 16 }}>
            <span><span className="mono" style={{ color: '#F5F5F4', fontWeight: 700 }}>{activeEx.sets}</span> serie</span>
            <span><span className="mono" style={{ color: '#F5F5F4', fontWeight: 700 }}>{activeEx.reps}</span> reps</span>
            <span><span className="mono" style={{ color: '#F5F5F4', fontWeight: 700 }}>{activeEx.rest}s</span> riposo</span>
          </div>

          {/* Set tracker */}
          <div style={{ padding: '14px 16px', borderRadius: 16, background: '#1A2420', border: '1px solid rgba(163,230,53,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7B6B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Serie {setIdx} di {activeEx.sets}
              </div>
              <div className="mono" style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, marginTop: 3 }}>
                {String(setIdx).padStart(2, '0')}
                <span style={{ fontSize: 14, color: '#6B7B6B', fontWeight: 600 }}>/{String(activeEx.sets).padStart(2, '0')}</span>
              </div>
            </div>
            <ProgressDots total={activeEx.sets} done={activeEx.completedSets} size={14} />
          </div>

          {/* Steppers */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7B6B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                Peso (kg){activeEx.pr && <span className="mono" style={{ color: '#A3E635', marginLeft: 8 }}>PR @ {activeEx.pr}</span>}
              </div>
              <Stepper value={weight} onChange={setWeight} step={2.5} suffix="kg" big />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7B6B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                Ripetizioni · Target: <span className="mono" style={{ color: '#A3E635' }}>{activeEx.reps}</span>
              </div>
              <Stepper value={reps} onChange={setReps} step={1} big />
            </div>
          </div>

          {/* Complete set */}
          <button onClick={completeSet} className="gt-btn-primary" style={{ width: '100%', height: 60, borderRadius: 18, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
            <Check size={18} color="#0A0F0A" /> Completa serie
          </button>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button onClick={() => setView('list')} className="gt-btn-secondary" style={{ flex: 1, height: 44, borderRadius: 14, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              ← Lista esercizi
            </button>
            <button onClick={() => {
              const next = exercises.findIndex((e, i) => i > activeExIdx && e.status !== 'done');
              if (next !== -1) openExercise(next); else setView('list');
            }} className="gt-btn-secondary" style={{ flex: 1, height: 44, borderRadius: 14, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              Prossimo <ChevronRight size={14} />
            </button>
          </div>

          {/* Volume + finish */}
          <div style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: '#6B7B6B', fontWeight: 700, textTransform: 'uppercase' }}>Volume totale</div>
              <div className="mono" style={{ fontSize: 20, fontWeight: 800 }}>{volume.toLocaleString('it-IT')} <span style={{ fontSize: 11, color: '#6B7B6B' }}>kg</span></div>
            </div>
            <button onClick={() => router.back()} style={{ padding: '10px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Square size={12} color="#EF4444" /> Finisci
            </button>
          </div>
        </div>
      </div>

      {/* Rest overlay */}
      {resting && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 90, background: 'rgba(7,11,7,0.94)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 100, animation: 'gt-bounce-in 0.4s cubic-bezier(0.6,1.5,0.4,1)' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#A3E635', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 4 }}>RECUPERO</div>
          <div style={{ fontSize: 13, color: '#A8B5A8', marginBottom: 24 }}>Prossima: <span style={{ color: '#F5F5F4', fontWeight: 700 }}>Serie {setIdx}</span></div>
          <RatingCircle score={restRemaining} label="SECONDI" size={260} />
          <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 10, width: 260 }}>
            <button onClick={() => { setResting(false); setRestRemaining(0); }} className="gt-btn-primary" style={{ width: '100%', height: 54, borderRadius: 18, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Zap size={14} color="#0A0F0A" /> Salta riposo
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setRestRemaining(r => r + 30); setRestTotal(t => t + 30); }} className="gt-btn-secondary" style={{ flex: 1, height: 48, borderRadius: 14, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Plus size={14} /> +30s
              </button>
              <button className="gt-btn-secondary" style={{ flex: 1, height: 48, borderRadius: 14, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bell size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PR Celebration */}
      {prCelebration && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 110, background: 'rgba(7,11,7,0.9)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', animation: 'gt-bounce-in 0.4s cubic-bezier(0.6,1.5,0.4,1)' }} onClick={() => setPrCelebration(null)}>
          <Confetti count={40} />
          <div style={{ position: 'relative', width: 280, padding: '32px 22px 26px', textAlign: 'center', background: 'linear-gradient(180deg, rgba(163,230,53,0.18), rgba(163,230,53,0.04))', border: '1px solid rgba(163,230,53,0.4)', borderRadius: 28, boxShadow: '0 0 60px rgba(163,230,53,0.4)' }}>
            <div style={{ fontSize: 64, marginBottom: 8 }}>🏆</div>
            <div className="mono" style={{ fontSize: 13, fontWeight: 800, color: '#A3E635', textTransform: 'uppercase', letterSpacing: '0.18em' }}>NUOVO RECORD</div>
            <div style={{ marginTop: 8, fontSize: 20, fontWeight: 800 }}>{prCelebration.name}</div>
            <div style={{ marginTop: 12, fontSize: 13, color: '#A8B5A8' }}>Precedente: <span className="mono" style={{ color: '#F5F5F4', fontWeight: 700 }}>{prCelebration.prev} kg</span></div>
            <div className="mono" style={{ marginTop: 12, fontSize: 52, fontWeight: 800, color: '#A3E635', letterSpacing: '-0.04em', textShadow: '0 0 30px rgba(163,230,53,0.6)' }}>
              {prCelebration.value}<span style={{ fontSize: 22, color: '#6B7B6B', marginLeft: 4 }}>kg</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

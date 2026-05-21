'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, MoreHorizontal, Check, Plus, ChevronRight, Square, Zap, Bell } from 'lucide-react';
import { Stepper } from '@/components/ui/Stepper';
import { ProgressDots } from '@/components/ui/ProgressDots';
import { RatingCircle } from '@/components/ui/RatingCircle';
import { Confetti } from '@/components/ui/Confetti';

const EXERCISES = [
  { id: 'bench', name: 'Panca piana bilanciere', muscle: 'Petto', sets: 4, reps: 8, weight: 92.5, rest: 120, pr: 90, overrides: [90, 120, 150, 150] },
  { id: 'incline', name: 'Panca inclinata manubri', muscle: 'Petto', sets: 4, reps: 10, weight: 32, rest: 90 },
  { id: 'ohp', name: 'Military press', muscle: 'Spalle', sets: 4, reps: 6, weight: 57.5, rest: 120, pr: 60 },
  { id: 'lat-raise', name: 'Alzate laterali', muscle: 'Spalle', sets: 5, reps: 12, weight: 12, rest: 60 },
  { id: 'dips', name: 'Dips parallele', muscle: 'Petto', sets: 4, reps: 10, weight: 10, rest: 90 },
  { id: 'pushdown', name: 'Push-down ai cavi', muscle: 'Tricipiti', sets: 4, reps: 12, weight: 27.5, rest: 60 },
];

function mmss(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export default function LiveTrackingPage() {
  const router = useRouter();
  const [exIdx, setExIdx] = useState(0);
  const [setIdx, setSetIdx] = useState(1);
  const ex = EXERCISES[exIdx] ?? EXERCISES[0]!;
  const [weight, setWeight] = useState(ex.weight);
  const [reps, setReps] = useState(ex.reps);
  const [volume, setVolume] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [resting, setResting] = useState(false);
  const [restRemaining, setRestRemaining] = useState(ex.rest);
  const [restTotal, setRestTotal] = useState(ex.rest);
  const [prCelebration, setPrCelebration] = useState<{ name: string; prev: number; value: number } | null>(null);

  // Session timer
  useEffect(() => {
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Rest timer
  useEffect(() => {
    if (!resting) return;
    if (restRemaining <= 0) { setResting(false); return; }
    const id = setTimeout(() => setRestRemaining(r => r - 1), 1000);
    return () => clearTimeout(id);
  }, [resting, restRemaining]);

  // Reset on exercise change
  useEffect(() => {
    const next = EXERCISES[exIdx];
    if (next) { setWeight(next.weight); setReps(next.reps); setSetIdx(1); }
  }, [exIdx]);

  function completeSet() {
    setVolume(v => v + weight * reps);
    if (ex.pr && weight > ex.pr) {
      setPrCelebration({ name: ex.name, prev: ex.pr, value: weight });
    }
    if (setIdx >= ex.sets) {
      if (exIdx < EXERCISES.length - 1) setExIdx(i => i + 1);
      return;
    }
    const restSec = (ex.overrides as number[] | undefined)?.[setIdx - 1] ?? ex.rest;
    setRestRemaining(restSec);
    setRestTotal(restSec);
    setResting(true);
    setSetIdx(s => s + 1);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: `radial-gradient(80% 50% at 50% 0%, rgba(163,230,53,0.18), transparent 60%), #070B07`,
      overflow: 'hidden',
    }}>
      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 56, left: 16, right: 16, zIndex: 5,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <button onClick={() => router.back()} style={{
          width: 38, height: 38, borderRadius: 12,
          background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)',
          color: '#F5F5F4', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <ChevronLeft size={18} />
        </button>
        <div style={{
          padding: '7px 14px', borderRadius: 99,
          background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(163,230,53,0.25)',
          backdropFilter: 'blur(10px)',
          display: 'inline-flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: 99, background: '#00FF88', boxShadow: '0 0 8px #00FF88', animation: 'gt-pulse 1.6s ease-in-out infinite' }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: '#A3E635' }}>LIVE</span>
          <span style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.12)' }} />
          <span className="mono" style={{ fontSize: 12, fontWeight: 700 }}>{mmss(elapsed)}</span>
        </div>
        <button style={{
          width: 38, height: 38, borderRadius: 12,
          background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)',
          color: '#F5F5F4', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <MoreHorizontal size={18} />
        </button>
      </div>

      <div className="gt-scroll" style={{ position: 'absolute', inset: 0, paddingTop: 116, paddingBottom: 22 }}>
        <div style={{ padding: '0 22px' }}>
          {/* Exercise meta */}
          <div style={{ fontSize: 11, fontWeight: 700, color: '#A3E635', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            Esercizio {exIdx + 1} / {EXERCISES.length}
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', margin: 0, lineHeight: 1.1 }}>{ex.name}</h1>
          <div style={{ display: 'flex', gap: 14, marginTop: 8, color: '#A8B5A8', fontSize: 12 }}>
            <span><span className="mono" style={{ color: '#F5F5F4', fontWeight: 700 }}>{ex.sets}</span> serie</span>
            <span><span className="mono" style={{ color: '#F5F5F4', fontWeight: 700 }}>{ex.reps}</span> reps</span>
            <span><span className="mono" style={{ color: '#F5F5F4', fontWeight: 700 }}>{ex.rest}s</span> riposo</span>
          </div>

          {/* Exercise placeholder */}
          <div style={{
            marginTop: 16, height: 132, borderRadius: 18,
            background: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.04) 8px, rgba(255,255,255,0.01) 8px, rgba(255,255,255,0.01) 16px)',
            border: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
          }}>
            <svg width="80" height="60" viewBox="0 0 24 24" fill="none" stroke="rgba(163,230,53,0.35)" strokeWidth="1.5">
              <rect x="2" y="9" width="3" height="6" rx="1"/>
              <rect x="5" y="7" width="3" height="10" rx="1"/>
              <rect x="16" y="7" width="3" height="10" rx="1"/>
              <rect x="19" y="9" width="3" height="6" rx="1"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
          </div>

          {/* Set tracker */}
          <div style={{
            marginTop: 18, padding: '14px 16px', borderRadius: 16,
            background: '#1A2420', border: '1px solid rgba(163,230,53,0.15)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7B6B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Serie {setIdx} di {ex.sets}
              </div>
              <div className="mono" style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, marginTop: 3 }}>
                {String(setIdx).padStart(2, '0')}
                <span style={{ fontSize: 14, color: '#6B7B6B', fontWeight: 600 }}>/{String(ex.sets).padStart(2, '0')}</span>
              </div>
            </div>
            <ProgressDots total={ex.sets} done={setIdx - 1} size={14} />
          </div>

          {/* Steppers */}
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7B6B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                Peso (kg)
                {ex.pr && <span className="mono" style={{ color: '#A3E635', marginLeft: 8 }}>PR @ {ex.pr}</span>}
              </div>
              <Stepper value={weight} onChange={setWeight} step={2.5} suffix="kg" big />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7B6B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                Ripetizioni · Target: <span className="mono" style={{ color: '#A3E635' }}>{ex.reps}</span>
              </div>
              <Stepper value={reps} onChange={setReps} step={1} big />
            </div>
          </div>

          {/* Complete set CTA */}
          <button onClick={completeSet} className="gt-btn-primary" style={{
            width: '100%', height: 60, borderRadius: 18, fontSize: 16, marginTop: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <Check size={18} color="#0A0F0A" /> Completa serie
          </button>

          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button className="gt-btn-secondary" style={{
              flex: 1, height: 44, borderRadius: 14, fontSize: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <Plus size={14} /> Aggiungi serie
            </button>
            <button onClick={() => exIdx < EXERCISES.length - 1 && setExIdx(i => i + 1)} className="gt-btn-secondary" style={{
              flex: 1, height: 44, borderRadius: 14, fontSize: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              Prossimo <ChevronRight size={14} />
            </button>
          </div>

          {/* Volume + finish */}
          <div style={{
            marginTop: 18, display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 14px', borderRadius: 14,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: '#6B7B6B', fontWeight: 700, textTransform: 'uppercase' }}>Volume totale</div>
              <div className="mono" style={{ fontSize: 20, fontWeight: 800 }}>
                {volume.toLocaleString('it-IT')} <span style={{ fontSize: 11, color: '#6B7B6B' }}>kg</span>
              </div>
            </div>
            <button onClick={() => router.back()} style={{
              padding: '10px 16px', borderRadius: 12,
              background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#EF4444', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              <Square size={12} color="#EF4444" /> Finisci
            </button>
          </div>
        </div>
      </div>

      {/* Rest overlay */}
      {resting && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 90,
          background: 'rgba(7,11,7,0.94)', backdropFilter: 'blur(8px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 100,
          animation: 'gt-bounce-in 0.4s cubic-bezier(0.6,1.5,0.4,1)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#A3E635', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 4 }}>
            RECUPERO
          </div>
          <div style={{ fontSize: 13, color: '#A8B5A8', marginBottom: 24 }}>
            Prossima: <span style={{ color: '#F5F5F4', fontWeight: 700 }}>Serie {setIdx}</span>
          </div>
          <RatingCircle score={restRemaining} label="SECONDI" size={280} />
          <div style={{ marginTop: 30, display: 'flex', flexDirection: 'column', gap: 10, width: 280 }}>
            <button onClick={() => { setResting(false); setRestRemaining(0); }} className="gt-btn-primary" style={{
              width: '100%', height: 54, borderRadius: 18, fontSize: 15,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <Zap size={14} color="#0A0F0A" /> Salta riposo
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setRestRemaining(r => r + 30); setRestTotal(t => t + 30); }} className="gt-btn-secondary" style={{
                flex: 1, height: 48, borderRadius: 14, fontSize: 13,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                <Plus size={14} /> +30s
              </button>
              <button className="gt-btn-secondary" style={{
                flex: 1, height: 48, borderRadius: 14, fontSize: 13,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Bell size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PR Celebration */}
      {prCelebration && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 110,
          background: 'rgba(7,11,7,0.9)', backdropFilter: 'blur(8px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          animation: 'gt-bounce-in 0.4s cubic-bezier(0.6,1.5,0.4,1)',
        }} onClick={() => setPrCelebration(null)}>
          <Confetti count={40} />
          <div style={{
            position: 'relative', width: 280, padding: '32px 22px 26px',
            textAlign: 'center',
            background: 'linear-gradient(180deg, rgba(163,230,53,0.18), rgba(163,230,53,0.04))',
            border: '1px solid rgba(163,230,53,0.4)', borderRadius: 28,
            boxShadow: '0 0 60px rgba(163,230,53,0.4), 0 30px 80px rgba(0,0,0,0.6)',
          }}>
            <div style={{ fontSize: 64, marginBottom: 8, filter: 'drop-shadow(0 0 24px rgba(163,230,53,0.7))' }}>🏆</div>
            <div className="mono" style={{ fontSize: 13, fontWeight: 800, color: '#A3E635', textTransform: 'uppercase', letterSpacing: '0.18em' }}>
              NUOVO RECORD
            </div>
            <div style={{ marginTop: 8, fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>{prCelebration.name}</div>
            <div style={{ marginTop: 12, fontSize: 13, color: '#A8B5A8' }}>
              Precedente: <span className="mono" style={{ color: '#F5F5F4', fontWeight: 700 }}>{prCelebration.prev} kg</span>
            </div>
            <div className="mono" style={{
              marginTop: 12, fontSize: 56, fontWeight: 800, color: '#A3E635',
              letterSpacing: '-0.04em', lineHeight: 1,
              textShadow: '0 0 30px rgba(163,230,53,0.6)',
            }}>
              {prCelebration.value}<span style={{ fontSize: 24, color: '#6B7B6B', fontWeight: 700, marginLeft: 4 }}>kg</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

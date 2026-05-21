import { RatingCircle } from '@/components/ui/RatingCircle';
import { Sparkline } from '@/components/ui/Sparkline';
import { Flame, ArrowUp, Trophy, Zap, Play, PencilLine } from 'lucide-react';
import Link from 'next/link';

const DEMO = {
  streak: 28,
  perfScore: 87,
  performanceTrend: [62, 68, 71, 74, 73, 80, 87],
  weekly: { done: 4, target: 5 },
  totalVolumeWeekKg: 12450,
  prThisMonth: 3,
  weight: 79.4,
  nextWorkout: {
    title: 'Push Day',
    subtitle: 'Petto & Spalle',
    exercises: [
      { name: 'Panca piana bilanciere', sets: 4, reps: 8, weight: 92.5 },
      { name: 'Panca inclinata manubri', sets: 4, reps: 10, weight: 32 },
      { name: 'Military press', sets: 4, reps: 6, weight: 57.5 },
    ],
    total: 7,
  },
};

function SectionHead({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 18px', marginBottom: 10 }}>
      <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', color: '#A8B5A8', textTransform: 'uppercase' }}>{title}</span>
      {action}
    </div>
  );
}

function StatCard({ value, unit, label, children }: { value: string | number; unit?: string; label: string; children?: React.ReactNode }) {
  return (
    <div className="gt-card" style={{ padding: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7B6B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span className="mono" style={{ fontSize: 30, fontWeight: 800, color: '#F5F5F4', letterSpacing: '-0.04em', lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ fontSize: 12, color: '#6B7B6B', fontWeight: 600 }}>{unit}</span>}
      </div>
      {children}
    </div>
  );
}

export function HomeContent({ userName }: { userName: string }) {
  const score = DEMO.perfScore;
  const scoreLabel = score >= 85 ? 'Stai spaccando 🔥' : score >= 70 ? 'Continua così 🚀' : 'Stai costruendo 🔨';

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#0A0F0A', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: -120, left: -40, right: -40, height: 360,
        background: 'radial-gradient(60% 70% at 50% 30%, rgba(163,230,53,0.22), transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="gt-scroll" style={{ position: 'absolute', inset: 0, paddingTop: 60, paddingBottom: 130 }}>
        <div style={{ padding: '14px 22px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, color: '#6B7B6B', fontWeight: 600, marginBottom: 2 }}>Venerdì, 17 Mag 2026</div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.025em' }}>
              Ciao, {userName} <span style={{ display: 'inline-block', transform: 'rotate(8deg)' }}>👋</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 99, background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', color: '#FBBF24' }}>
            <Flame size={14} />
            <span className="mono" style={{ fontSize: 13, fontWeight: 800 }}>{DEMO.streak}</span>
          </div>
        </div>

        <div style={{ margin: '14px 22px 22px', padding: '26px 18px 22px', borderRadius: 26, background: 'radial-gradient(circle at 50% 0%, rgba(163,230,53,0.10), transparent 70%), #1A2420', border: '1px solid rgba(163,230,53,0.18)', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 18, left: 18, fontSize: 11, fontWeight: 700, color: '#6B7B6B', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Performance Score</div>
          <div style={{ position: 'absolute', top: 16, right: 18, display: 'flex', alignItems: 'center', gap: 4, color: '#A3E635' }}>
            <ArrowUp size={12} />
            <span className="mono" style={{ fontSize: 12, fontWeight: 800 }}>+14</span>
            <span style={{ fontSize: 10, color: '#6B7B6B', fontWeight: 600 }}>vs sett. scorsa</span>
          </div>
          <div style={{ marginTop: 10 }}>
            <RatingCircle score={score} sublabel="su 100" size={210} />
          </div>
          <div style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 99, background: 'rgba(163,230,53,0.15)', border: '1px solid rgba(163,230,53,0.3)' }}>
            <Zap size={12} color="#A3E635" />
            <span style={{ fontSize: 13, fontWeight: 800, color: '#A3E635' }}>{scoreLabel}</span>
          </div>
        </div>

        <div style={{ margin: '0 22px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <StatCard value={`${DEMO.weekly.done}/${DEMO.weekly.target}`} label="Questa settimana">
            <div style={{ marginTop: 10, display: 'flex', gap: 4 }}>
              {Array.from({ length: DEMO.weekly.target }).map((_, i) => (
                <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < DEMO.weekly.done ? 'linear-gradient(135deg, #A3E635, #65A30D)' : 'rgba(255,255,255,0.08)' }} />
              ))}
            </div>
          </StatCard>
          <StatCard value={(DEMO.totalVolumeWeekKg / 1000).toFixed(1)} unit="t" label="Volume">
            <div style={{ marginTop: 6, fontSize: 11, color: '#6B7B6B', fontWeight: 600 }}>{DEMO.totalVolumeWeekKg.toLocaleString('it-IT')} kg</div>
          </StatCard>
          <StatCard value={`+${DEMO.prThisMonth}`} label="PR questo mese">
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, color: '#A3E635' }}>
              <Trophy size={14} /><span style={{ fontSize: 11, fontWeight: 700 }}>Panca, Squat, Stacco</span>
            </div>
          </StatCard>
          <StatCard value={DEMO.weight} unit="kg" label="Peso corporeo">
            <div style={{ marginTop: 6, fontSize: 11, color: '#FBBF24', fontWeight: 700 }}>−0.6 kg questa sett.</div>
          </StatCard>
        </div>

        <div style={{ marginTop: 22 }}>
          <SectionHead title="Prossimo allenamento" />
          <div style={{ margin: '0 22px' }}>
            <div className="gt-card-hi" style={{ padding: 18, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(163,230,53,0.18), transparent 70%)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
                <div>
                  <div className="gt-chip" style={{ marginBottom: 10 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 99, background: '#A3E635', boxShadow: '0 0 8px rgba(163,230,53,0.8)' }} /> OGGI
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>{DEMO.nextWorkout.title}</div>
                  <div style={{ fontSize: 13, color: '#A8B5A8', marginTop: 3 }}>{DEMO.nextWorkout.subtitle}</div>
                </div>
                <div style={{ textAlign: 'right', padding: '6px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.04)' }}>
                  <div className="mono" style={{ fontSize: 18, fontWeight: 800 }}>{DEMO.nextWorkout.total}</div>
                  <div style={{ fontSize: 9, color: '#6B7B6B', fontWeight: 700, textTransform: 'uppercase' }}>esercizi</div>
                </div>
              </div>
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {DEMO.nextWorkout.exercises.map((ex, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: '#6B7B6B', width: 16 }}>{String(i + 1).padStart(2, '0')}</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{ex.name}</span>
                    </div>
                    <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: '#A8B5A8' }}>{ex.sets}×{ex.reps} · {ex.weight}kg</span>
                  </div>
                ))}
                <div style={{ fontSize: 11, color: '#6B7B6B', fontWeight: 600, textAlign: 'center', marginTop: 2 }}>+{DEMO.nextWorkout.total - 3} esercizi</div>
              </div>
              <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                <Link href="/workout/live/new" className="gt-btn-primary" style={{ flex: 2, height: 50, borderRadius: 16, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }}>
                  <Play size={14} color="#0A0F0A" /> Inizia
                </Link>
                <Link href="/workout/manual/today" className="gt-btn-secondary" style={{ flex: 1, height: 50, borderRadius: 16, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none' }}>
                  <PencilLine size={14} /> Manuale
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 22 }}>
          <SectionHead title="Trend performance" action={
            <Link href="/stats" style={{ background: 'transparent', border: 'none', color: '#A3E635', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2, textDecoration: 'none' }}>
              Vedi tutto →
            </Link>
          } />
          <div style={{ margin: '0 22px' }}>
            <div className="gt-card" style={{ padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#6B7B6B', fontWeight: 700, textTransform: 'uppercase' }}>Performance Score</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                    <span className="mono" style={{ fontSize: 26, fontWeight: 800 }}>{score}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#A3E635' }}>+25 pts</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {['7G', '1M', '3M'].map((p, i) => (
                    <div key={p} className="mono" style={{ padding: '4px 8px', borderRadius: 8, fontSize: 10, fontWeight: 700, color: i === 0 ? '#A3E635' : '#6B7B6B', background: i === 0 ? 'rgba(163,230,53,0.12)' : 'transparent' }}>{p}</div>
                  ))}
                </div>
              </div>
              <Sparkline values={DEMO.performanceTrend} height={60} />
            </div>
          </div>
        </div>

        <div style={{ margin: '22px 22px 0', padding: 14, borderRadius: 14, background: '#1A2420', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div style={{ fontSize: 18, marginTop: 1 }}>💡</div>
          <div style={{ fontSize: 12, color: '#A8B5A8', lineHeight: 1.4 }}>
            Hai completato 4 sessioni su 5 questa settimana. Aggiungi un allenamento sabato per raggiungere il tuo obiettivo!
          </div>
        </div>
      </div>
    </div>
  );
}

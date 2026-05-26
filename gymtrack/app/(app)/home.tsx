'use client';
import { RatingCircle } from '@/components/ui/RatingCircle';
import { Sparkline } from '@/components/ui/Sparkline';
import { Flame, ArrowUp, Trophy, Zap, Play, PencilLine } from 'lucide-react';
import Link from 'next/link';
import { useSettings } from '@/components/providers/SettingsProvider';
import { useDashboardStats, usePlans } from '@/hooks/useStats';

function LoadingSkeleton() {
  const shimmer: React.CSSProperties = {
    background: 'linear-gradient(90deg, #1A2420 25%, #243020 50%, #1A2420 75%)',
    backgroundSize: '200% 100%',
    animation: 'gt-skeleton 1.5s infinite',
    borderRadius: 12,
  };
  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: 'var(--page-bg)', overflow: 'hidden' }}>
      <div className="gt-scroll" style={{ position: 'absolute', inset: 0, paddingTop: 44, paddingBottom: 130 }}>
        <div style={{ padding: '14px 22px 8px' }}>
          <div style={{ ...shimmer, height: 14, width: 160, marginBottom: 8 }} />
          <div style={{ ...shimmer, height: 28, width: 200 }} />
        </div>
        <div style={{ margin: '14px 22px 22px', height: 320, ...shimmer, borderRadius: 26 }} />
        <div style={{ margin: '0 22px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[0, 1, 2, 3].map(i => <div key={i} style={{ ...shimmer, height: 80 }} />)}
        </div>
      </div>
    </div>
  );
}

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

function formatDate() {
  return new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
}

export function HomeContent({ userName }: { userName: string }) {
  const { formatWeight, unit } = useSettings();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: plans = [], isLoading: plansLoading } = usePlans();

  // Find today's plan: getDay() returns 0=Sun,1=Mon,...,6=Sat
  // Schema dayOfWeek: 0=Sun,1=Mon,...,6=Sat (matching JS getDay())
  const todayDow = new Date().getDay();
  const todayPlan = plans.find(p => p.dayOfWeek === todayDow) ?? null;

  if (statsLoading || plansLoading) return <LoadingSkeleton />;

  const score = stats?.performanceScore ?? 0;
  const scoreLabel = score >= 85 ? 'Stai spaccando 🔥' : score >= 70 ? 'Continua così 🚀' : score >= 40 ? 'Stai costruendo 🔨' : 'Riparti con calma 💪';

  const completed = stats?.completedThisWeek ?? 0;
  const planned = stats?.plannedThisWeek ?? 5;
  // Volume: convert to lbs if needed (1 kg = 2.20462 lbs), show in tonnes/kilo-pounds
  const rawVolume = stats?.weeklyVolume ?? 0;
  const displayVolume = unit === 'lbs'
    ? (rawVolume * 2.20462 / 1000).toFixed(1)
    : (rawVolume / 1000).toFixed(1);
  const volumeUnit = unit === 'lbs' ? 'klbs' : 't';
  const volumeSubLabel = unit === 'lbs'
    ? `${(rawVolume * 2.20462).toLocaleString('it-IT', { maximumFractionDigits: 0 })} lbs`
    : `${rawVolume.toLocaleString('it-IT')} kg`;
  const volumeGrowth = stats?.volumeGrowthPct ?? 0;
  const prCount = stats?.prCount ?? 0;
  const weightKg = stats?.currentWeightKg ?? null;
  const trend = stats?.performanceTrend ?? [0, 0, 0, 0, 0, 0, 0];
  const streak = stats?.streakDays ?? 0;

  // Preview exercises — show first 3
  const previewExercises = todayPlan?.exercises.slice(0, 3) ?? [];
  const totalExercises = todayPlan?.exercises.length ?? 0;

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: 'var(--page-bg)', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: -120, left: -40, right: -40, height: 360,
        background: 'radial-gradient(60% 70% at 50% 30%, rgba(163,230,53,0.22), transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="gt-scroll" style={{ position: 'absolute', inset: 0, paddingTop: 44, paddingBottom: 130 }}>
        <div style={{ padding: '14px 22px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, color: '#6B7B6B', fontWeight: 600, marginBottom: 2, textTransform: 'capitalize' }}>{formatDate()}</div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.025em' }}>
              Ciao, {userName} <span style={{ display: 'inline-block', transform: 'rotate(8deg)' }}>👋</span>
            </div>
          </div>
          {streak > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 99, background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', color: '#FBBF24' }}>
              <Flame size={14} />
              <span className="mono" style={{ fontSize: 13, fontWeight: 800 }}>{streak}</span>
            </div>
          )}
        </div>

        {/* Performance score */}
        <div style={{ margin: '14px 22px 22px', padding: '26px 18px 22px', borderRadius: 26, background: 'radial-gradient(circle at 50% 0%, rgba(163,230,53,0.10), transparent 70%), #1A2420', border: '1px solid rgba(163,230,53,0.18)', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 18, left: 18, fontSize: 11, fontWeight: 700, color: '#6B7B6B', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Performance Score</div>
          {volumeGrowth !== 0 && (
            <div style={{ position: 'absolute', top: 16, right: 18, display: 'flex', alignItems: 'center', gap: 4, color: volumeGrowth >= 0 ? '#A3E635' : '#EF4444' }}>
              <ArrowUp size={12} style={{ transform: volumeGrowth < 0 ? 'rotate(180deg)' : undefined }} />
              <span className="mono" style={{ fontSize: 12, fontWeight: 800 }}>{volumeGrowth > 0 ? '+' : ''}{volumeGrowth.toFixed(0)}%</span>
              <span style={{ fontSize: 10, color: '#6B7B6B', fontWeight: 600 }}>volume</span>
            </div>
          )}
          <div style={{ marginTop: 10 }}>
            <RatingCircle score={score} sublabel="su 100" size={210} />
          </div>
          <div style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 99, background: 'rgba(163,230,53,0.15)', border: '1px solid rgba(163,230,53,0.3)' }}>
            <Zap size={12} color="#A3E635" />
            <span style={{ fontSize: 13, fontWeight: 800, color: '#A3E635' }}>{scoreLabel}</span>
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ margin: '0 22px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <StatCard value={`${completed}/${planned}`} label="Questa settimana">
            <div style={{ marginTop: 10, display: 'flex', gap: 4 }}>
              {Array.from({ length: Math.max(planned, 1) }).map((_, i) => (
                <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < completed ? 'linear-gradient(135deg, #A3E635, #65A30D)' : 'rgba(255,255,255,0.08)' }} />
              ))}
            </div>
          </StatCard>
          <StatCard value={displayVolume} unit={volumeUnit} label="Volume">
            <div style={{ marginTop: 6, fontSize: 11, color: '#6B7B6B', fontWeight: 600 }}>{volumeSubLabel}</div>
          </StatCard>
          <StatCard value={`+${prCount}`} label="PR questo mese">
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, color: prCount > 0 ? '#A3E635' : '#6B7B6B' }}>
              <Trophy size={14} />
              <span style={{ fontSize: 11, fontWeight: 700 }}>{prCount > 0 ? `${prCount} record battut${prCount === 1 ? 'o' : 'i'}` : 'Nessun PR'}</span>
            </div>
          </StatCard>
          <StatCard value={weightKg !== null ? (unit === 'lbs' ? (weightKg * 2.20462).toFixed(1) : weightKg) : '—'} unit={weightKg !== null ? unit : undefined} label="Peso corporeo">
            {weightKg !== null
              ? <div style={{ marginTop: 6, fontSize: 11, color: '#A8B5A8', fontWeight: 700 }}>aggiornato oggi</div>
              : <div style={{ marginTop: 6, fontSize: 11, color: '#6B7B6B', fontWeight: 700 }}>nessun dato</div>
            }
          </StatCard>
        </div>

        {/* Next workout */}
        <div style={{ marginTop: 22 }}>
          <SectionHead title="Prossimo allenamento" />
          <div style={{ margin: '0 22px' }}>
            {todayPlan ? (
              <div className="gt-card-hi" style={{ padding: 18, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(163,230,53,0.18), transparent 70%)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
                  <div>
                    <div className="gt-chip" style={{ marginBottom: 10 }}>
                      <span style={{ width: 6, height: 6, borderRadius: 99, background: '#A3E635', boxShadow: '0 0 8px rgba(163,230,53,0.8)' }} /> OGGI
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>{todayPlan.name}</div>
                    <div style={{ fontSize: 13, color: '#A8B5A8', marginTop: 3 }}>{totalExercises} esercizi</div>
                  </div>
                  <div style={{ textAlign: 'right', padding: '6px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.04)' }}>
                    <div className="mono" style={{ fontSize: 18, fontWeight: 800 }}>{totalExercises}</div>
                    <div style={{ fontSize: 9, color: '#6B7B6B', fontWeight: 700, textTransform: 'uppercase' }}>esercizi</div>
                  </div>
                </div>
                {previewExercises.length > 0 && (
                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {previewExercises.map((ex, i) => (
                      <div key={ex.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: '#6B7B6B', width: 16 }}>{String(i + 1).padStart(2, '0')}</span>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{ex.template.name}</span>
                        </div>
                        <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: '#A8B5A8' }}>
                          {ex.plannedSets}×{ex.plannedReps}{ex.plannedWeightKg ? ` · ${formatWeight(ex.plannedWeightKg)}` : ''}
                        </span>
                      </div>
                    ))}
                    {totalExercises > 3 && (
                      <div style={{ fontSize: 11, color: '#6B7B6B', fontWeight: 600, textAlign: 'center', marginTop: 2 }}>+{totalExercises - 3} esercizi</div>
                    )}
                  </div>
                )}
                <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                  <Link href="/workout/live/new" className="gt-btn-primary" style={{ flex: 2, height: 50, borderRadius: 16, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }}>
                    <Play size={14} color="#0A0F0A" /> Inizia
                  </Link>
                  <Link href="/workout/manual/today" className="gt-btn-secondary" style={{ flex: 1, height: 50, borderRadius: 16, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none' }}>
                    <PencilLine size={14} /> Manuale
                  </Link>
                </div>
              </div>
            ) : (
              <div className="gt-card" style={{ padding: '22px 18px', textAlign: 'center' }}>
                <div style={{ fontSize: 30, marginBottom: 10 }}>🛋️</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Nessun allenamento pianificato oggi</div>
                <div style={{ fontSize: 13, color: '#A8B5A8', marginBottom: 14 }}>Goditi il riposo, o aggiungi una sessione libera.</div>
                <Link href="/workout" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 99,
                  background: 'rgba(163,230,53,0.12)', border: '1px solid rgba(163,230,53,0.3)',
                  color: '#A3E635', fontWeight: 700, fontSize: 13, textDecoration: 'none',
                }}>
                  Vai agli allenamenti →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Trend */}
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
                    {trend.length > 1 && (
                      <span style={{ fontSize: 12, fontWeight: 700, color: trend[trend.length - 1]! >= trend[0]! ? '#A3E635' : '#EF4444' }}>
                        {trend[trend.length - 1]! >= trend[0]! ? '+' : ''}{(trend[trend.length - 1]! - trend[0]!).toFixed(0)} pts
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {['7G', '1M', '3M'].map((p, i) => (
                    <div key={p} className="mono" style={{ padding: '4px 8px', borderRadius: 8, fontSize: 10, fontWeight: 700, color: i === 0 ? '#A3E635' : '#6B7B6B', background: i === 0 ? 'rgba(163,230,52,0.12)' : 'transparent' }}>{p}</div>
                  ))}
                </div>
              </div>
              <Sparkline values={trend} height={60} />
            </div>
          </div>
        </div>

        {/* Tip */}
        {completed < planned && (
          <div style={{ margin: '22px 22px 0', padding: 14, borderRadius: 14, background: '#1A2420', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ fontSize: 18, marginTop: 1 }}>💡</div>
            <div style={{ fontSize: 12, color: '#A8B5A8', lineHeight: 1.4 }}>
              Hai completato {completed} sessioni su {planned} questa settimana. {planned - completed === 1 ? 'Ancora una e hai finito!' : `Ne mancano ${planned - completed} al tuo obiettivo.`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

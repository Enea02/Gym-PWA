'use client';
import { useState, useEffect, useMemo } from 'react';
import { Trophy, ArrowUp, ArrowDown, ChevronDown, Flame, X } from 'lucide-react';
import { AreaChart } from '@/components/stats/AreaChart';
import { CandleChart } from '@/components/stats/CandleChart';
import { HeatmapCalendar } from '@/components/stats/HeatmapCalendar';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  isSystem: boolean;
}

interface DataPoint {
  date: string;
  maxWeightKg: number;
  totalVolume: number;
  setCount: number;
  isPR: boolean;
}

interface HeatmapCell {
  date: string;
  count: number;
  volume: number;
  intensity: number;
  isToday: boolean;
}

interface Measurement {
  id: string;
  measuredAt: string;
  weightKg: number | null;
}

interface PR {
  id: string;
  exerciseName: string;
  weightKg: number;
  reps: number;
  completedAt: string;
}

interface DashStats {
  completionRate: number;
  completedThisWeek: number;
  plannedThisWeek: number;
  streakDays: number;
  weeklyVolume: number;
  prCount: number;
  volumeGrowth: number;
  performanceScore: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PERIOD_DAYS: Record<string, number> = {
  '7G': 7, '1M': 30, '3M': 90, '6M': 180, '1A': 365, 'ALL': 3650,
};

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Petto', back: 'Schiena', legs: 'Gambe',
  shoulders: 'Spalle', arms: 'Braccia', core: 'Core', cardio: 'Cardio',
};

const MUSCLE_COLORS: Record<string, string> = {
  chest: 'rgba(163,230,53,0.18)',
  back: 'rgba(59,130,246,0.18)',
  legs: 'rgba(251,191,36,0.18)',
  shoulders: 'rgba(168,85,247,0.18)',
  arms: 'rgba(239,68,68,0.18)',
  core: 'rgba(20,184,166,0.18)',
  cardio: 'rgba(249,115,22,0.18)',
};

const MUSCLE_TEXT: Record<string, string> = {
  chest: '#A3E635', back: '#3B82F6', legs: '#FBBF24',
  shoulders: '#A855F7', arms: '#EF4444', core: '#14B4A6', cardio: '#F97316',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
}

function shortLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHead({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
      padding: '0 22px', marginBottom: 10,
    }}>
      <span style={{
        fontSize: 13, fontWeight: 700, letterSpacing: '0.06em',
        color: '#A8B5A8', textTransform: 'uppercase',
      }}>{title}</span>
      {action}
    </div>
  );
}

function SkeletonBlock({ h = 160, radius = 16 }: { h?: number; radius?: number }) {
  return (
    <div style={{
      height: h, borderRadius: radius,
      background: 'linear-gradient(90deg, #1A2420 0%, #243028 50%, #1A2420 100%)',
      backgroundSize: '200% 100%',
      animation: 'gt-shimmer 1.4s infinite',
    }} />
  );
}

// ─── Exercise Picker Modal ────────────────────────────────────────────────────

function ExercisePicker({
  exercises,
  selectedId,
  onSelect,
  onClose,
}: {
  exercises: Exercise[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() =>
    exercises.filter(e =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      MUSCLE_LABELS[e.muscleGroup]?.toLowerCase().includes(search.toLowerCase())
    ), [exercises, search]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-end',
    }} onClick={onClose}>
      <div style={{
        width: '100%', maxHeight: '75vh',
        background: '#1A2420', borderRadius: '20px 20px 0 0',
        padding: '0 0 env(safe-area-inset-bottom)',
        display: 'flex', flexDirection: 'column',
        border: '1px solid rgba(163,230,53,0.12)',
        borderBottom: 'none',
      }} onClick={e => e.stopPropagation()}>
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.12)' }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px 8px',
        }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#F5F5F4' }}>Seleziona esercizio</span>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 10,
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#A8B5A8', cursor: 'pointer',
          }}>
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '4px 20px 10px' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cerca esercizio…"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, padding: '10px 14px', color: '#F5F5F4',
              fontSize: 14, outline: 'none',
            }}
          />
        </div>

        {/* List */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {filtered.length === 0 && (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: '#6B7B6B', fontSize: 13 }}>
              Nessun esercizio trovato
            </div>
          )}
          {filtered.map(ex => (
            <button key={ex.id} onClick={() => { onSelect(ex.id); onClose(); }} style={{
              width: '100%', textAlign: 'left',
              border: 'none', padding: '12px 20px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 12,
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              background: ex.id === selectedId ? 'rgba(163,230,53,0.07)' : 'none',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: MUSCLE_COLORS[ex.muscleGroup] ?? 'rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 800, color: MUSCLE_TEXT[ex.muscleGroup] ?? '#A8B5A8',
                letterSpacing: '-0.02em',
              }}>
                {ex.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 700, color: '#F5F5F4',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{ex.name}</div>
                <div style={{ marginTop: 2 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    padding: '2px 7px', borderRadius: 99,
                    background: MUSCLE_COLORS[ex.muscleGroup] ?? 'rgba(255,255,255,0.06)',
                    color: MUSCLE_TEXT[ex.muscleGroup] ?? '#A8B5A8',
                  }}>
                    {MUSCLE_LABELS[ex.muscleGroup] ?? ex.muscleGroup}
                  </span>
                </div>
              </div>
              {ex.id === selectedId && (
                <div style={{
                  width: 20, height: 20, borderRadius: 99,
                  background: 'linear-gradient(135deg, #A3E635, #65A30D)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1.5 5l2.5 2.5 4.5-5" stroke="#0A0F0A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StatsPage() {
  const [period, setPeriod] = useState('1M');
  const [metric, setMetric] = useState<'weight' | 'sets' | 'volume'>('weight');

  // Exercise selector
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExId, setSelectedExId] = useState<string | null>(null);
  const [showExPicker, setShowExPicker] = useState(false);

  // Data
  const [progressionData, setProgressionData] = useState<DataPoint[]>([]);
  const [heatmapGrid, setHeatmapGrid] = useState<HeatmapCell[]>([]);
  const [heatmapWeeks, setHeatmapWeeks] = useState(16);
  const [bodyWeightData, setBodyWeightData] = useState<Measurement[]>([]);
  const [recentPRs, setRecentPRs] = useState<PR[]>([]);
  const [dashStats, setDashStats] = useState<DashStats | null>(null);

  // Loading states
  const [loadingProgression, setLoadingProgression] = useState(false);
  const [loadingInit, setLoadingInit] = useState(true);

  // Load static data on mount
  useEffect(() => {
    const promises = [
      fetch('/api/exercises/templates')
        .then(r => r.json())
        .then((list: Exercise[]) => {
          setExercises(list);
          if (list.length > 0) setSelectedExId(list[0].id);
        }),
      fetch('/api/stats/heatmap?weeks=16')
        .then(r => r.json())
        .then(d => {
          setHeatmapGrid(d.grid ?? []);
          setHeatmapWeeks(d.weeks ?? 16);
        }),
      fetch('/api/stats/body-weight?days=365')
        .then(r => r.json())
        .then(d => {
          // API returns a plain array
          const arr: Measurement[] = Array.isArray(d) ? d : (d.measurements ?? []);
          setBodyWeightData(arr);
        }),
      fetch('/api/stats/recent-prs')
        .then(r => r.json())
        .then(d => setRecentPRs(d.prs ?? [])),
      fetch('/api/stats/dashboard')
        .then(r => r.json())
        .then(d => setDashStats(d)),
    ];
    Promise.allSettled(promises).finally(() => setLoadingInit(false));
  }, []);

  // Reload progression when exercise or period changes
  useEffect(() => {
    if (!selectedExId) return;
    setLoadingProgression(true);
    fetch(`/api/stats/exercise-progression?exerciseId=${selectedExId}&period=${PERIOD_DAYS[period]}`)
      .then(r => r.json())
      .then(d => setProgressionData(d.progression ?? []))
      .finally(() => setLoadingProgression(false));
  }, [selectedExId, period]);

  // ── Derived data ────────────────────────────────────────────────────────────

  const selectedExercise = useMemo(
    () => exercises.find(e => e.id === selectedExId) ?? null,
    [exercises, selectedExId],
  );

  // CandleChart data from progressionData
  const candleData = useMemo(() =>
    progressionData.map((p, i) => {
      const prev = progressionData[i - 1]?.maxWeightKg ?? p.maxWeightKg;
      return {
        low: Math.min(prev, p.maxWeightKg) * 0.99,
        high: Math.max(prev, p.maxWeightKg) * 1.01,
        open: prev,
        close: p.maxWeightKg,
        label: shortLabel(p.date),
        pr: p.isPR,
      };
    }),
    [progressionData],
  );

  // AreaChart data
  const volumeChartData = useMemo(() =>
    progressionData.map(p => ({ value: p.totalVolume, label: shortLabel(p.date), pr: p.isPR })),
    [progressionData],
  );
  const setsChartData = useMemo(() =>
    progressionData.map(p => ({ value: p.setCount, label: shortLabel(p.date), pr: p.isPR })),
    [progressionData],
  );

  // Max weight and growth
  const maxWeight = useMemo(() => {
    if (progressionData.length === 0) return null;
    return Math.max(...progressionData.map(d => d.maxWeightKg));
  }, [progressionData]);

  const weightGrowth = useMemo(() => {
    if (progressionData.length < 2) return null;
    const first = progressionData[0]!.maxWeightKg;
    const last = progressionData[progressionData.length - 1]!.maxWeightKg;
    if (first === 0) return null;
    return ((last - first) / first) * 100;
  }, [progressionData]);

  const prCountInPeriod = useMemo(
    () => progressionData.filter(d => d.isPR).length,
    [progressionData],
  );

  // Heatmap: reshape flat grid → 7×N matrix
  const heatmapMatrix = useMemo(() => {
    if (heatmapGrid.length === 0) return [];
    const rows: number[][] = Array.from({ length: 7 }, () => []);
    heatmapGrid.forEach((cell, idx) => {
      const row = idx % 7; // day-of-week row (0=Sun .. 6=Sat)
      rows[row]!.push(cell.intensity);
    });
    return rows;
  }, [heatmapGrid]);

  // Body weight chart
  const weightChartData = useMemo(() => {
    const sorted = [...bodyWeightData]
      .filter(m => m.weightKg != null)
      .sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime());
    return sorted.map((m, i) => ({
      value: m.weightKg as number,
      label: i % 4 === 0 ? shortLabel(m.measuredAt) : '',
    }));
  }, [bodyWeightData]);

  const currentWeight = useMemo(() => {
    const valid = bodyWeightData.filter(m => m.weightKg != null);
    if (valid.length === 0) return null;
    return valid[valid.length - 1]!.weightKg as number;
  }, [bodyWeightData]);

  const weightDelta = useMemo(() => {
    const valid = bodyWeightData.filter(m => m.weightKg != null);
    if (valid.length < 2) return null;
    return (valid[valid.length - 1]!.weightKg as number) - (valid[0]!.weightKg as number);
  }, [bodyWeightData]);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Shimmer keyframe */}
      <style>{`
        @keyframes gt-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {showExPicker && (
        <ExercisePicker
          exercises={exercises}
          selectedId={selectedExId}
          onSelect={setSelectedExId}
          onClose={() => setShowExPicker(false)}
        />
      )}

      <div style={{ position: 'relative', minHeight: '100vh', background: '#0A0F0A', overflow: 'hidden' }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: -80, left: -40, right: -40, height: 300,
          background: 'radial-gradient(60% 60% at 50% 30%, rgba(163,230,53,0.12), transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div className="gt-scroll" style={{ position: 'absolute', inset: 0, paddingTop: 44, paddingBottom: 130 }}>

          {/* ── Header ── */}
          <div style={{ padding: '14px 22px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              {loadingInit ? (
                <div style={{ width: 140, height: 14, borderRadius: 7, background: '#1A2420', marginBottom: 4 }} />
              ) : (
                <div style={{ fontSize: 13, color: '#6B7B6B', fontWeight: 600 }}>
                  {dashStats ? `${dashStats.streakDays} gg streak · ${dashStats.prCount} PR/mese` : 'Le tue statistiche'}
                </div>
              )}
              <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', margin: '2px 0 0', color: '#F5F5F4' }}>
                Statistiche
              </h1>
            </div>
          </div>

          {/* ── Period selector ── */}
          <div style={{ padding: '8px 22px 18px', display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {(['7G', '1M', '3M', '6M', '1A', 'ALL'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)} className="mono" style={{
                flex: '0 0 auto', padding: '8px 14px', borderRadius: 99,
                background: p === period ? 'linear-gradient(135deg, #A3E635, #65A30D)' : '#1A2420',
                border: p === period ? 'none' : '1px solid rgba(255,255,255,0.06)',
                color: p === period ? '#0A0F0A' : '#A8B5A8',
                fontWeight: 800, fontSize: 12, cursor: 'pointer',
                boxShadow: p === period ? '0 6px 18px -4px rgba(163,230,53,0.5)' : 'none',
              }}>{p}</button>
            ))}
          </div>

          {/* ── Main chart card ── */}
          <div style={{ padding: '0 22px' }}>
            <div className="gt-card-hi" style={{ padding: 16, position: 'relative', overflow: 'hidden' }}>

              {/* Exercise selector button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <button onClick={() => setShowExPicker(true)} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '6px 10px', borderRadius: 10,
                    background: 'rgba(163,230,53,0.1)', border: '1px solid rgba(163,230,53,0.2)',
                    color: '#F5F5F4', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    maxWidth: '100%',
                  }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                      {selectedExercise?.name ?? 'Seleziona esercizio'}
                    </span>
                    <ChevronDown size={12} style={{ flexShrink: 0 }} />
                  </button>

                  {/* Max weight + growth */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 12 }}>
                    {maxWeight != null ? (
                      <>
                        <span className="mono" style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.04em', color: '#F5F5F4' }}>
                          {maxWeight % 1 === 0 ? maxWeight : maxWeight.toFixed(1)}
                        </span>
                        <span style={{ fontSize: 14, color: '#6B7B6B', fontWeight: 600 }}>kg</span>
                        {weightGrowth != null && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 2,
                            fontSize: 12, fontWeight: 800,
                            color: weightGrowth >= 0 ? '#A3E635' : '#EF4444',
                            padding: '3px 7px', borderRadius: 99,
                            background: weightGrowth >= 0 ? 'rgba(163,230,53,0.12)' : 'rgba(239,68,68,0.12)',
                            marginLeft: 4,
                          }}>
                            {weightGrowth >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                            {Math.abs(weightGrowth).toFixed(1)}%
                          </span>
                        )}
                      </>
                    ) : loadingProgression ? (
                      <div style={{ width: 80, height: 38, borderRadius: 8, background: '#1A2420' }} />
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Metric tabs */}
              <div style={{
                display: 'flex', padding: 4, background: '#1A2420',
                borderRadius: 14, border: '1px solid rgba(163,230,53,0.08)', marginBottom: 14,
              }}>
                {(['weight', 'sets', 'volume'] as const).map(m => (
                  <button key={m} onClick={() => setMetric(m)} style={{
                    flex: 1, border: 'none', appearance: 'none', padding: '6px 8px', borderRadius: 10,
                    background: m === metric ? 'linear-gradient(135deg, #A3E635, #65A30D)' : 'transparent',
                    color: m === metric ? '#0A0F0A' : '#A8B5A8',
                    fontWeight: 700, fontSize: 11, cursor: 'pointer',
                  }}>
                    {m === 'weight' ? 'Peso' : m === 'sets' ? 'Serie' : 'Volume'}
                  </button>
                ))}
              </div>

              {/* Chart area */}
              {loadingProgression ? (
                <SkeletonBlock h={200} radius={10} />
              ) : progressionData.length === 0 ? (
                <div style={{
                  height: 200, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: 10, color: '#6B7B6B',
                }}>
                  <div style={{ fontSize: 32 }}>📊</div>
                  <div style={{ fontSize: 13, fontWeight: 600, textAlign: 'center', padding: '0 20px' }}>
                    Nessun dato per questo periodo.<br />
                    <span style={{ color: '#A8B5A8' }}>Inizia a tracciare i tuoi allenamenti!</span>
                  </div>
                </div>
              ) : (
                <>
                  {metric === 'weight' && candleData.length > 0 && (
                    <CandleChart data={candleData} height={200} />
                  )}
                  {metric === 'volume' && volumeChartData.length > 1 && (
                    <AreaChart data={volumeChartData} height={200} showLabels />
                  )}
                  {metric === 'sets' && setsChartData.length > 1 && (
                    <AreaChart data={setsChartData} height={200} showLabels />
                  )}
                </>
              )}

              {/* PR summary strip */}
              {prCountInPeriod > 0 && (
                <div style={{
                  marginTop: 10, padding: '8px 12px', borderRadius: 10,
                  background: 'rgba(163,230,53,0.08)', border: '1px solid rgba(163,230,53,0.2)',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <Trophy size={14} color="#A3E635" />
                  <span style={{ fontSize: 11, color: '#A8B5A8', fontWeight: 600 }}>
                    {prCountInPeriod} PR in questo periodo
                    {weightGrowth != null && (
                      <>
                        {' ·'}
                        <span className="mono" style={{ color: '#A3E635', fontWeight: 800 }}>
                          {' '}{weightGrowth >= 0 ? '+' : ''}{weightGrowth.toFixed(1)}%
                        </span>
                      </>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── Heatmap ── */}
          <div style={{ marginTop: 24 }}>
            <SectionHead title="Frequenza" action={
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {[0.06, 0.15, 0.35, 0.6, 0.9].map((a, i) => (
                  <div key={i} style={{ width: 9, height: 9, borderRadius: 2, background: `rgba(163,230,53,${a})` }} />
                ))}
              </div>
            } />
            <div style={{ margin: '0 22px' }}>
              <div className="gt-card" style={{ padding: 14, overflowX: 'auto' }}>
                {loadingInit ? (
                  <SkeletonBlock h={100} radius={8} />
                ) : heatmapMatrix.length > 0 ? (
                  <HeatmapCalendar
                    data={heatmapMatrix}
                    dayLabels={['D', 'L', 'M', 'M', 'G', 'V', 'S']}
                  />
                ) : (
                  <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7B6B', fontSize: 13 }}>
                    Nessun allenamento registrato
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Body weight ── */}
          <div style={{ marginTop: 24 }}>
            <SectionHead title="Peso corporeo" />
            <div style={{ margin: '0 22px' }}>
              <div className="gt-card" style={{ padding: 14 }}>
                {loadingInit ? (
                  <SkeletonBlock h={180} radius={8} />
                ) : weightChartData.length === 0 ? (
                  <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7B6B', fontSize: 13 }}>
                    Nessuna misurazione registrata
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 11, color: '#6B7B6B', fontWeight: 700, textTransform: 'uppercase' }}>Peso corporeo</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
                          <span className="mono" style={{ fontSize: 24, fontWeight: 800, color: '#F5F5F4' }}>
                            {currentWeight?.toFixed(1) ?? '—'}
                          </span>
                          <span style={{ fontSize: 11, color: '#6B7B6B' }}>kg</span>
                          {weightDelta != null && (
                            <span className="mono" style={{
                              fontSize: 11, fontWeight: 700, marginLeft: 4,
                              color: weightDelta <= 0 ? '#A3E635' : '#EF4444',
                            }}>
                              {weightDelta > 0 ? '+' : ''}{weightDelta.toFixed(1)} kg
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <AreaChart data={weightChartData} height={150} showLabels />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── Aggregates ── */}
          <div style={{ marginTop: 24 }}>
            <SectionHead title="Aggregati" />
            <div style={{ margin: '0 22px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>

              {/* Weekly volume */}
              <div className="gt-card" style={{ padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7B6B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  Volume settimanale
                </div>
                {loadingInit ? (
                  <SkeletonBlock h={30} radius={6} />
                ) : (
                  <>
                    <div className="mono" style={{ fontSize: 24, fontWeight: 800, color: '#F5F5F4', letterSpacing: '-0.04em', lineHeight: 1 }}>
                      {dashStats ? (dashStats.weeklyVolume >= 1000
                        ? `${(dashStats.weeklyVolume / 1000).toFixed(1)}`
                        : `${dashStats.weeklyVolume}`)
                        : '—'}
                      <span style={{ fontSize: 11, color: '#6B7B6B', marginLeft: 4 }}>
                        {dashStats && dashStats.weeklyVolume >= 1000 ? 't' : 'kg'}
                      </span>
                    </div>
                    {dashStats && (
                      <div className="mono" style={{ marginTop: 4, fontSize: 10, color: dashStats.volumeGrowth >= 0 ? '#A3E635' : '#EF4444' }}>
                        {dashStats.volumeGrowth >= 0 ? '+' : ''}{(dashStats.volumeGrowth * 100).toFixed(0)}% vs settimana prec.
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Completed / Planned */}
              <div className="gt-card" style={{ padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7B6B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  Completati
                </div>
                {loadingInit ? (
                  <SkeletonBlock h={30} radius={6} />
                ) : (
                  <>
                    <div className="mono" style={{ fontSize: 24, fontWeight: 800, color: '#F5F5F4', letterSpacing: '-0.04em', lineHeight: 1 }}>
                      {dashStats ? `${dashStats.completedThisWeek}/${dashStats.plannedThisWeek}` : '—'}
                    </div>
                    {dashStats && (
                      <div style={{ marginTop: 8, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.06)' }}>
                        <div style={{
                          width: `${Math.round(dashStats.completionRate * 100)}%`,
                          height: '100%',
                          background: 'linear-gradient(135deg, #A3E635, #65A30D)',
                          borderRadius: 99,
                        }} />
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Streak */}
              <div className="gt-card" style={{ padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7B6B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  Streak attuale
                </div>
                {loadingInit ? (
                  <SkeletonBlock h={30} radius={6} />
                ) : (
                  <>
                    <div className="mono" style={{ fontSize: 24, fontWeight: 800, color: '#F5F5F4', letterSpacing: '-0.04em', lineHeight: 1 }}>
                      {dashStats?.streakDays ?? '—'}
                      <span style={{ fontSize: 11, color: '#6B7B6B', marginLeft: 4 }}>gg</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <Flame size={11} color="#FBBF24" />
                      <span className="mono" style={{ fontSize: 10, color: '#6B7B6B' }}>consecutivi</span>
                    </div>
                  </>
                )}
              </div>

              {/* PR this month */}
              <div className="gt-card" style={{ padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7B6B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  PR questo mese
                </div>
                {loadingInit ? (
                  <SkeletonBlock h={30} radius={6} />
                ) : (
                  <>
                    <div className="mono" style={{ fontSize: 24, fontWeight: 800, color: '#F5F5F4', letterSpacing: '-0.04em', lineHeight: 1 }}>
                      {dashStats?.prCount ?? '—'}
                    </div>
                    <div className="mono" style={{ marginTop: 4, fontSize: 10, color: '#A3E635' }}>
                      record personali
                    </div>
                  </>
                )}
              </div>

              {/* Performance score */}
              <div className="gt-card" style={{ padding: 14, gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7B6B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                  Performance score
                </div>
                {loadingInit ? (
                  <SkeletonBlock h={30} radius={6} />
                ) : dashStats ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="mono" style={{ fontSize: 36, fontWeight: 800, color: '#A3E635', letterSpacing: '-0.04em', lineHeight: 1 }}>
                      {dashStats.performanceScore}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <div style={{
                          width: `${dashStats.performanceScore}%`, height: '100%',
                          background: 'linear-gradient(90deg, #65A30D, #A3E635)',
                          borderRadius: 99,
                          transition: 'width 0.6s ease',
                        }} />
                      </div>
                      <div style={{ marginTop: 4, fontSize: 10, color: '#6B7B6B' }}>
                        su 100 punti
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mono" style={{ fontSize: 24, fontWeight: 800, color: '#6B7B6B' }}>—</div>
                )}
              </div>

            </div>
          </div>

          {/* ── Recent PRs ── */}
          <div style={{ marginTop: 24 }}>
            <SectionHead title="Record personali recenti" />
            <div style={{ margin: '0 22px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {loadingInit ? (
                Array.from({ length: 3 }).map((_, i) => <SkeletonBlock key={i} h={66} radius={14} />)
              ) : recentPRs.length === 0 ? (
                <div style={{
                  padding: '28px 20px', borderRadius: 14,
                  background: '#1A2420', border: '1px solid rgba(255,255,255,0.04)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                }}>
                  <div style={{ fontSize: 32 }}>🏆</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#6B7B6B', textAlign: 'center' }}>
                    Ancora nessun PR!<br />
                    <span style={{ color: '#A8B5A8' }}>Inizia ad allenarti per sbloccare i tuoi record</span>
                  </div>
                </div>
              ) : recentPRs.map(pr => (
                <div key={pr.id} className="gt-card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: 'linear-gradient(135deg, rgba(163,230,53,0.18), rgba(163,230,53,0.04))',
                    border: '1px solid rgba(163,230,53,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Trophy size={18} color="#A3E635" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 700, color: '#F5F5F4',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {pr.exerciseName}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 2, fontSize: 10, color: '#6B7B6B' }}>
                      <span className="mono">{formatDate(pr.completedAt)}</span>
                      <span>•</span>
                      <span className="mono">{pr.reps} rip</span>
                    </div>
                  </div>
                  <div className="mono" style={{ fontSize: 18, fontWeight: 800, color: '#A3E635', flexShrink: 0 }}>
                    {pr.weightKg % 1 === 0 ? pr.weightKg : pr.weightKg.toFixed(1)}
                    <span style={{ fontSize: 10, color: '#6B7B6B', marginLeft: 2 }}>kg</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

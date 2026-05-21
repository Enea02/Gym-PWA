'use client';
import { useState, useMemo } from 'react';
import { Calendar, Trophy, ArrowUp, ChevronDown, Flame } from 'lucide-react';
import { AreaChart } from '@/components/stats/AreaChart';
import { CandleChart } from '@/components/stats/CandleChart';
import { HeatmapCalendar } from '@/components/stats/HeatmapCalendar';

const BENCH_HISTORY = [
  { label: 'Gen', value: 80, vol: 2560, sets: 16, pr: false },
  { label: 'Gen', value: 82.5, vol: 2640, sets: 16, pr: false },
  { label: 'Feb', value: 82.5, vol: 2700, sets: 17, pr: false },
  { label: 'Feb', value: 85, vol: 2720, sets: 16, pr: true },
  { label: 'Feb', value: 85, vol: 2800, sets: 17, pr: false },
  { label: 'Mar', value: 87.5, vol: 2880, sets: 17, pr: true },
  { label: 'Mar', value: 87.5, vol: 2940, sets: 18, pr: false },
  { label: 'Mar', value: 90, vol: 3040, sets: 18, pr: true },
  { label: 'Apr', value: 90, vol: 3120, sets: 19, pr: false },
  { label: 'Apr', value: 92.5, vol: 3200, sets: 19, pr: true },
  { label: 'Mag', value: 92.5, vol: 3280, sets: 20, pr: false },
  { label: 'Mag', value: 95, vol: 3440, sets: 20, pr: true },
  { label: 'Mag', value: 95, vol: 3520, sets: 21, pr: false },
];

const BODYWEIGHT_HISTORY = [82.0, 81.6, 81.2, 80.9, 80.5, 80.2, 80.0, 79.8, 79.6, 79.5, 79.4, 79.7, 79.5, 79.4, 79.3, 79.4];

const HEATMAP = (() => {
  const out: number[][] = [];
  for (let d = 0; d < 7; d++) {
    const row: number[] = [];
    for (let w = 0; w < 16; w++) {
      let base = [3, 1, 4, 2, 4, 3, 0][d]!;
      const noise = ((w * 7 + d * 13) % 5) - 2;
      let v = Math.max(0, Math.min(4, base + (noise > 0 ? 1 : noise < -1 ? -1 : 0)));
      if (w > 12 && base > 0) v = Math.min(4, v + 1);
      if (w < 1 && d < 3) v = 0;
      row.push(v);
    }
    out.push(row);
  }
  return out;
})();

const RECENT_PRS = [
  { date: '17 Mag', exercise: 'Panca piana', value: 95, unit: 'kg', sets: 4 },
  { date: '12 Mag', exercise: 'Squat', value: 140, unit: 'kg', sets: 5 },
  { date: '08 Mag', exercise: 'Stacco da terra', value: 170, unit: 'kg', sets: 3 },
  { date: '02 Mag', exercise: 'Military press', value: 60, unit: 'kg', sets: 4 },
];

function SectionHead({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 22px', marginBottom: 10 }}>
      <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', color: '#A8B5A8', textTransform: 'uppercase' }}>{title}</span>
      {action}
    </div>
  );
}

export default function StatsPage() {
  const [period, setPeriod] = useState('1M');
  const [metric, setMetric] = useState<'weight' | 'sets' | 'volume'>('weight');

  const candleData = useMemo(() => BENCH_HISTORY.map((p, i) => {
    const prev = BENCH_HISTORY[i - 1]?.value ?? p.value - 2.5;
    return { low: Math.min(prev, p.value) - 1.5, high: Math.max(prev, p.value) + 2, open: prev, close: p.value, label: p.label, pr: p.pr };
  }), []);

  const weightChart = useMemo(() => BODYWEIGHT_HISTORY.map((v, i) => ({ value: v, label: i % 4 === 0 ? `S${i + 1}` : '' })), []);

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#0A0F0A', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -80, left: -40, right: -40, height: 300, background: 'radial-gradient(60% 60% at 50% 30%, rgba(163,230,53,0.15), transparent 70%)', pointerEvents: 'none' }} />

      <div className="gt-scroll" style={{ position: 'absolute', inset: 0, paddingTop: 60, paddingBottom: 130 }}>
        {/* Top */}
        <div style={{ padding: '14px 22px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, color: '#6B7B6B', fontWeight: 600 }}>6 mesi · 412 serie</div>
            <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', margin: '2px 0 0' }}>Statistiche</h1>
          </div>
          <button style={{ width: 40, height: 40, borderRadius: 12, background: '#1A2420', border: '1px solid rgba(255,255,255,0.06)', color: '#A8B5A8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={18} />
          </button>
        </div>

        {/* Period selector */}
        <div style={{ padding: '8px 22px 18px', display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {['7G', '1M', '3M', '6M', '1A', 'ALL'].map(p => (
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

        {/* Main chart card */}
        <div style={{ padding: '0 22px' }}>
          <div className="gt-card-hi" style={{ padding: 16, position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <button style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 10,
                  background: 'rgba(163,230,53,0.1)', border: '1px solid rgba(163,230,53,0.2)',
                  color: '#F5F5F4', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}>
                  🏋️ Panca piana <ChevronDown size={12} />
                </button>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 12 }}>
                  <span className="mono" style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.04em' }}>95</span>
                  <span style={{ fontSize: 14, color: '#6B7B6B', fontWeight: 600 }}>kg</span>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 12, fontWeight: 800, color: '#A3E635',
                    padding: '3px 7px', borderRadius: 99, background: 'rgba(163,230,53,0.12)', marginLeft: 4,
                  }}>
                    <ArrowUp size={12} />18.75%
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 14, marginTop: 6, fontSize: 11, color: '#6B7B6B' }}>
                  <span>Max: <span className="mono" style={{ color: '#F5F5F4', fontWeight: 700 }}>95 kg</span></span>
                  <span>Media: <span className="mono" style={{ color: '#F5F5F4', fontWeight: 700 }}>89.4 kg</span></span>
                </div>
              </div>
            </div>

            {/* Metric tabs */}
            <div style={{ display: 'flex', padding: 4, background: '#1A2420', borderRadius: 14, border: '1px solid rgba(163,230,53,0.08)', marginBottom: 14 }}>
              {(['weight', 'sets', 'volume'] as const).map(m => (
                <button key={m} onClick={() => setMetric(m)} style={{
                  flex: 1, border: 'none', appearance: 'none', padding: '6px 8px', borderRadius: 10,
                  background: m === metric ? 'linear-gradient(135deg, #A3E635, #65A30D)' : 'transparent',
                  color: m === metric ? '#0A0F0A' : '#A8B5A8', fontWeight: 700, fontSize: 11, cursor: 'pointer',
                }}>
                  {m === 'weight' ? 'Peso' : m === 'sets' ? 'Serie' : 'Volume'}
                </button>
              ))}
            </div>

            {metric === 'weight' && <CandleChart data={candleData} height={200} />}
            {metric === 'volume' && <AreaChart data={BENCH_HISTORY.map(p => ({ value: p.vol, label: p.label, pr: p.pr }))} height={200} showLabels />}
            {metric === 'sets' && <AreaChart data={BENCH_HISTORY.map(p => ({ value: p.sets, label: p.label, pr: p.pr }))} height={200} showLabels yMin={14} yMax={22} />}

            <div style={{ marginTop: 6, padding: '8px 12px', borderRadius: 10, background: 'rgba(163,230,53,0.08)', border: '1px solid rgba(163,230,53,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Trophy size={14} color="#A3E635" />
              <span style={{ fontSize: 11, color: '#A8B5A8', fontWeight: 600 }}>
                4 PR negli ultimi 30 giorni ·<span className="mono" style={{ color: '#A3E635', fontWeight: 800 }}> +15 kg</span>
              </span>
            </div>
          </div>
        </div>

        {/* Heatmap */}
        <div style={{ marginTop: 24 }}>
          <SectionHead title="Frequenza" action={
            <div style={{ fontSize: 11, color: '#6B7B6B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              {[0.06, 0.15, 0.35, 0.6, 0.9].map((a, i) => (
                <div key={i} style={{ width: 9, height: 9, borderRadius: 2, background: `rgba(163,230,53,${a})` }} />
              ))}
            </div>
          } />
          <div style={{ margin: '0 22px' }}>
            <div className="gt-card" style={{ padding: 14 }}>
              <HeatmapCalendar data={HEATMAP} dayLabels={['L', 'M', 'M', 'G', 'V', 'S', 'D']} />
            </div>
          </div>
        </div>

        {/* Body weight */}
        <div style={{ marginTop: 24 }}>
          <SectionHead title="Peso corporeo" />
          <div style={{ margin: '0 22px' }}>
            <div className="gt-card" style={{ padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#6B7B6B', fontWeight: 700, textTransform: 'uppercase' }}>Peso corporeo</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
                    <span className="mono" style={{ fontSize: 24, fontWeight: 800 }}>79.4</span>
                    <span style={{ fontSize: 11, color: '#6B7B6B' }}>kg</span>
                    <span className="mono" style={{ fontSize: 11, color: '#EF4444', fontWeight: 700, marginLeft: 4 }}>−2.6 kg</span>
                  </div>
                </div>
              </div>
              <AreaChart data={weightChart} height={150} />
            </div>
          </div>
        </div>

        {/* Aggregate stats */}
        <div style={{ marginTop: 24 }}>
          <SectionHead title="Aggregati" />
          <div style={{ margin: '0 22px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { v: '143', u: 't', l: 'Volume totale', sub: <div className="mono" style={{ marginTop: 4, fontSize: 10, color: '#6B7B6B' }}>142.680 kg</div> },
              { v: '19/22', l: 'Completati', sub: <div style={{ marginTop: 8, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.06)' }}><div style={{ width: '86%', height: '100%', background: 'linear-gradient(135deg, #A3E635, #65A30D)', borderRadius: 99 }} /></div> },
              { v: 'Panca', l: 'Miglior esercizio', sub: <div className="mono" style={{ marginTop: 4, fontSize: 16, fontWeight: 800, color: '#A3E635' }}>+18.75%</div> },
              { v: '4.2', l: 'Media/settimana', sub: <div className="mono" style={{ marginTop: 4, fontSize: 10, color: '#6B7B6B' }}>allenamenti</div> },
              { v: '412', l: 'Serie totali' },
              { v: '34', u: 'gg', l: 'Streak più lungo', sub: <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}><Flame size={11} color="#FBBF24" /><span className="mono" style={{ fontSize: 10, color: '#6B7B6B' }}>attuale: 28</span></div> },
            ].map((s, i) => (
              <div key={i} className="gt-card" style={{ padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7B6B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{s.l}</div>
                <div className="mono" style={{ fontSize: 24, fontWeight: 800, color: '#F5F5F4', letterSpacing: '-0.04em', lineHeight: 1 }}>
                  {s.v}{s.u && <span style={{ fontSize: 11, color: '#6B7B6B', marginLeft: 4 }}>{s.u}</span>}
                </div>
                {(s as any).sub}
              </div>
            ))}
          </div>
        </div>

        {/* Recent PRs */}
        <div style={{ marginTop: 24 }}>
          <SectionHead title="Record personali recenti" />
          <div style={{ margin: '0 22px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {RECENT_PRS.map((pr, i) => (
              <div key={i} className="gt-card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: 'linear-gradient(135deg, rgba(163,230,53,0.18), rgba(163,230,53,0.04))',
                  border: '1px solid rgba(163,230,53,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Trophy size={18} color="#A3E635" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pr.exercise}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 2, fontSize: 10, color: '#6B7B6B' }}>
                    <span className="mono">{pr.date}</span>
                    <span>•</span>
                    <span className="mono">{pr.sets} serie</span>
                  </div>
                </div>
                <div className="mono" style={{ fontSize: 18, fontWeight: 800, color: '#A3E635' }}>
                  {pr.value}<span style={{ fontSize: 10, color: '#6B7B6B', marginLeft: 2 }}>{pr.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

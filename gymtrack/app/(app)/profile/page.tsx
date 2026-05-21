import { auth, signOut } from '@/lib/auth/auth';
import { Settings, ChevronRight, LogOut, Shield } from 'lucide-react';
import Link from 'next/link';

const BODY_MEAS = [
  { date: '17 Mag', weight: 79.4, arm: 38.5, chest: 104 },
  { date: '10 Mag', weight: 79.6, arm: 38, chest: 104 },
  { date: '03 Mag', weight: 79.8, arm: 38, chest: 103.5 },
  { date: '26 Apr', weight: 80.1, arm: 37.5, chest: 103 },
];

function StatBox({ value, label }: { value: string | number; label: string }) {
  return (
    <div style={{ background: '#1A2420', borderRadius: 14, padding: '10px 12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="mono" style={{ fontSize: 22, fontWeight: 800 }}>{value}</div>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#6B7B6B', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{label}</div>
    </div>
  );
}

function ListRow({ label, value, icon }: { label: string; value?: string; icon?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '14px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', gap: 12 }}>
      {icon && <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>}
      <div style={{ flex: 1, fontSize: 14, color: '#F5F5F4', fontWeight: 600 }}>{label}</div>
      {value && <span className="mono" style={{ fontSize: 13, color: '#A8B5A8', fontWeight: 600 }}>{value}</span>}
      <ChevronRight size={14} color="#6B7B6B" />
    </div>
  );
}

export default async function ProfilePage() {
  const session = await auth();
  const user = session?.user;
  const isAdmin = user?.role === 'admin';
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'GT';

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#0A0F0A', overflow: 'hidden' }}>
      <div className="gt-scroll" style={{ position: 'absolute', inset: 0, paddingTop: 60, paddingBottom: 130 }}>
        {/* Hero */}
        <div style={{ padding: '14px 22px 22px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: -60, left: -40, right: -40, height: 220, background: 'radial-gradient(60% 50% at 50% 30%, rgba(163,230,53,0.18), transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em' }}>Profilo</div>
            <Link href="/profile/settings" style={{
              width: 40, height: 40, borderRadius: 12, background: '#1A2420',
              border: '1px solid rgba(255,255,255,0.06)', color: '#A8B5A8',
              display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none',
            }}>
              <Settings size={18} />
            </Link>
          </div>

          {/* Avatar */}
          <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
            <div style={{
              width: 78, height: 78, borderRadius: 28,
              background: 'linear-gradient(135deg, #A3E635 0%, #65A30D 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 800, color: '#0A0F0A', letterSpacing: '-0.02em',
              boxShadow: '0 12px 30px -6px rgba(163,230,53,0.5), inset 0 1px 0 rgba(255,255,255,0.4)',
              position: 'relative',
            }}>
              {initials}
              {isAdmin && (
                <div style={{
                  position: 'absolute', bottom: -4, right: -4,
                  width: 28, height: 28, borderRadius: 99,
                  background: '#070B07', border: '2px solid #A3E635',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 12px rgba(163,230,53,0.4)',
                }}>
                  <Shield size={14} color="#A3E635" />
                </div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>{user?.name || 'Utente'}</div>
              <div style={{ fontSize: 12, color: '#6B7B6B', marginTop: 2 }}>{user?.email}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <div className="gt-chip">⚡ Avanzato</div>
                {isAdmin && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 99,
                    background: 'rgba(0,255,136,0.15)', border: '1px solid rgba(0,255,136,0.35)',
                    color: '#00FF88', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>
                    <Shield size={10} color="#00FF88" /> Admin
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, position: 'relative' }}>
            <StatBox value="28" label="Streak" />
            <StatBox value="142" label="Workout" />
            <StatBox value="18" label="PR" />
          </div>
        </div>

        {/* Admin tab */}
        {isAdmin && (
          <div style={{ padding: '0 22px 14px' }}>
            <Link href="/profile/admin/users" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '14px', borderRadius: 14, textDecoration: 'none',
              background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.25)',
              color: '#00FF88', fontWeight: 700, fontSize: 14,
            }}>
              <Shield size={16} /> Gestione Utenti
            </Link>
          </div>
        )}

        {/* Personal data */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 22px', marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', color: '#A8B5A8', textTransform: 'uppercase' }}>DATI PERSONALI</span>
        </div>
        <div className="gt-card" style={{ margin: '0 22px 22px' }}>
          <ListRow label="Età" value="31 anni" />
          <ListRow label="Altezza" value="182 cm" />
          <ListRow label="Peso" value="79.4 kg" />
          <ListRow label="Obiettivo peso" value="82 kg" />
          <ListRow label="Sesso" value="Maschio" />
          <div style={{ display: 'flex', alignItems: 'center', padding: '14px 14px', gap: 12 }}>
            <div style={{ flex: 1, fontSize: 14, color: '#F5F5F4', fontWeight: 600 }}>Esperienza</div>
            <span className="mono" style={{ fontSize: 13, color: '#A8B5A8', fontWeight: 600 }}>5+ anni</span>
            <ChevronRight size={14} color="#6B7B6B" />
          </div>
        </div>

        {/* Goal selector */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 22px', marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', color: '#A8B5A8', textTransform: 'uppercase' }}>OBIETTIVO</span>
        </div>
        <div style={{ margin: '0 22px 22px' }}>
          <div className="gt-card-hi" style={{ padding: 4, display: 'flex', gap: 4 }}>
            {[
              { k: 'strength', emoji: '🏋️', label: 'Forza' },
              { k: 'mass', emoji: '💪', label: 'Massa' },
              { k: 'cut', emoji: '🔥', label: 'Definizione' },
              { k: 'endurance', emoji: '🏃', label: 'Resistenza' },
            ].map(g => {
              const isActive = g.k === 'strength';
              return (
                <div key={g.k} style={{
                  flex: 1, textAlign: 'center', padding: '14px 6px', borderRadius: 14,
                  background: isActive ? 'linear-gradient(135deg, #A3E635, #65A30D)' : 'transparent',
                  color: isActive ? '#0A0F0A' : '#A8B5A8', fontWeight: 700, fontSize: 11,
                  boxShadow: isActive ? '0 4px 14px -4px rgba(163,230,53,0.4)' : 'none',
                }}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{g.emoji}</div>
                  {g.label}
                </div>
              );
            })}
          </div>
        </div>

        {/* Body history */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 22px', marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', color: '#A8B5A8', textTransform: 'uppercase' }}>STORICO MISURE</span>
          <button style={{ padding: '4px 10px', borderRadius: 99, background: 'rgba(163,230,53,0.12)', border: '1px solid rgba(163,230,53,0.25)', color: '#A3E635', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>+ Aggiungi</button>
        </div>
        <div className="gt-card" style={{ margin: '0 22px 22px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.9fr 1fr', padding: '12px 14px 6px', fontSize: 9, fontWeight: 700, color: '#6B7B6B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <div>Data</div><div>Peso</div><div>Bicipite</div><div>Petto</div>
          </div>
          {BODY_MEAS.map((row, i) => (
            <div key={i} className="mono" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.9fr 1fr', padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.04)', alignItems: 'center', fontSize: 12 }}>
              <div style={{ fontWeight: 600, color: '#A8B5A8' }}>{row.date}</div>
              <div style={{ fontWeight: 700 }}>{row.weight} <span style={{ color: '#6B7B6B', fontSize: 10 }}>kg</span></div>
              <div style={{ fontWeight: 700 }}>{row.arm} <span style={{ color: '#6B7B6B', fontSize: 10 }}>cm</span></div>
              <div style={{ fontWeight: 700 }}>{row.chest} <span style={{ color: '#6B7B6B', fontSize: 10 }}>cm</span></div>
            </div>
          ))}
        </div>

        {/* Settings */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 22px', marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', color: '#A8B5A8', textTransform: 'uppercase' }}>IMPOSTAZIONI</span>
        </div>
        <div className="gt-card" style={{ margin: '0 22px 22px' }}>
          <ListRow label="Tema scuro" icon={<span style={{ fontSize: 16 }}>🌙</span>} value="ON" />
          <ListRow label="Notifiche" icon={<span style={{ fontSize: 16 }}>🔔</span>} value="ON" />
          <ListRow label="Unità di misura" value="kg" />
          <ListRow label="Suoni timer" value="ON" />
          <div style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🌐</div>
            <div style={{ flex: 1, fontSize: 14, color: '#F5F5F4', fontWeight: 600 }}>Lingua</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {['IT', 'EN'].map(l => (
                <button key={l} className="mono" style={{
                  padding: '4px 10px', borderRadius: 99, border: 'none', fontSize: 10, fontWeight: 800, cursor: 'pointer',
                  background: l === 'IT' ? 'linear-gradient(135deg, #A3E635, #65A30D)' : 'rgba(255,255,255,0.05)',
                  color: l === 'IT' ? '#0A0F0A' : '#A8B5A8',
                }}>{l}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Logout */}
        <div style={{ margin: '0 22px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="gt-card">
            <ListRow label="Backup & Sync" icon={<span style={{ fontSize: 14 }}>☁️</span>} />
            <div style={{ display: 'flex', alignItems: 'center', padding: '14px 14px', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={16} color="#A8B5A8" />
              </div>
              <div style={{ flex: 1, fontSize: 14, color: '#F5F5F4', fontWeight: 600 }}>Privacy</div>
              <ChevronRight size={14} color="#6B7B6B" />
            </div>
          </div>
          <form action={async () => { 'use server'; await signOut({ redirectTo: '/login' }); }}>
            <button type="submit" style={{
              width: '100%', padding: '16px 0', borderRadius: 16,
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#EF4444', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <LogOut size={16} color="#EF4444" /> Esci
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

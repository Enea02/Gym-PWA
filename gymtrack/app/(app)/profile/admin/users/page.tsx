'use client';
import { useState } from 'react';
import { Shield, Settings, ChevronDown, Search, PencilLine, Trash2, Plus } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import Link from 'next/link';

const USERS = [
  { id: 1, name: 'Marco Bianchi', email: 'marco.b@gymtrack.app', avatar: 'MB', lastSeen: '2h fa', active: true, workouts: 142, color: 'A3E635' },
  { id: 2, name: 'Sara Rossi', email: 'sara.r@gymtrack.app', avatar: 'SR', lastSeen: '1g fa', active: true, workouts: 87, color: '00FF88' },
  { id: 3, name: 'Luca Romano', email: 'luca.r@gymtrack.app', avatar: 'LR', lastSeen: '3h fa', active: true, workouts: 203, color: 'FBBF24' },
  { id: 4, name: 'Giulia Conti', email: 'giulia.c@gymtrack.app', avatar: 'GC', lastSeen: '15min', active: true, workouts: 56, color: '60A5FA' },
  { id: 5, name: 'Davide Greco', email: 'davide.g@gymtrack.app', avatar: 'DG', lastSeen: '4g fa', active: true, workouts: 31, color: 'EF4444' },
  { id: 6, name: 'Elena Marchetti', email: 'elena.m@gymtrack.app', avatar: 'EM', lastSeen: '23g', active: false, workouts: 12, color: 'A78BFA' },
];

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [confirmDel, setConfirmDel] = useState<typeof USERS[0] | null>(null);

  const visible = USERS.filter(u => {
    if (filter === 'active' && !u.active) return false;
    if (filter === 'inactive' && u.active) return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#0A0F0A', overflow: 'hidden' }}>
      <div className="gt-scroll" style={{ position: 'absolute', inset: 0, paddingTop: 44, paddingBottom: 130 }}>
        {/* Top */}
        <div style={{ padding: '14px 22px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 99, background: 'rgba(0,255,136,0.15)', border: '1px solid rgba(0,255,136,0.35)', color: '#00FF88', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              <Shield size={9} color="#00FF88" /> ADMIN
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.025em', margin: 0 }}>Gestione Utenti</h1>
          </div>
          <Link href="/profile" style={{ width: 40, height: 40, borderRadius: 12, background: '#1A2420', border: '1px solid rgba(255,255,255,0.06)', color: '#A8B5A8', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
            <Settings size={18} />
          </Link>
        </div>

        {/* Aggregate stats */}
        <div style={{ padding: '0 22px 14px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[{ v: 247, l: 'Totale' }, { v: 184, l: 'Attivi', sub: '74%' }, { v: '+23', l: 'Nuovi/mese' }].map((s, i) => (
            <div key={i} className="gt-card" style={{ padding: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7B6B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{s.l}</div>
              <div className="mono" style={{ fontSize: 24, fontWeight: 800, color: '#F5F5F4' }}>{s.v}</div>
              {s.sub && <div className="mono" style={{ marginTop: 2, fontSize: 10, color: '#A3E635', fontWeight: 700 }}>{s.sub}</div>}
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ padding: '0 22px 12px' }}>
          <div style={{ position: 'relative', background: '#1A2420', border: '1px solid rgba(163,230,53,0.14)', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', height: 46 }}>
            <Search size={16} color="#6B7B6B" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca utenti..."
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#F5F5F4', fontFamily: 'Manrope, sans-serif', fontSize: 14 }} />
          </div>
        </div>

        {/* Filters */}
        <div style={{ padding: '0 22px 14px', display: 'flex', gap: 6 }}>
          {[{ k: 'all', l: 'Tutti' }, { k: 'active', l: 'Attivi' }, { k: 'inactive', l: 'Inattivi' }].map(f => (
            <button key={f.k} onClick={() => setFilter(f.k)} style={{
              padding: '7px 14px', borderRadius: 99,
              background: f.k === filter ? 'linear-gradient(135deg, #A3E635, #65A30D)' : '#1A2420',
              border: f.k === filter ? 'none' : '1px solid rgba(255,255,255,0.06)',
              color: f.k === filter ? '#0A0F0A' : '#A8B5A8', fontWeight: 700, fontSize: 12, cursor: 'pointer',
            }}>{f.l}</button>
          ))}
          <div style={{ flex: 1 }} />
          <button style={{ padding: '7px 12px', borderRadius: 99, background: '#1A2420', border: '1px solid rgba(255,255,255,0.06)', color: '#A8B5A8', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            Attività <ChevronDown size={12} />
          </button>
        </div>

        {/* User cards */}
        <div style={{ padding: '0 22px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {visible.map(u => (
            <div key={u.id} className="gt-card" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                background: `linear-gradient(135deg, #${u.color}, #${u.color}80)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#0A0F0A', fontWeight: 800, fontSize: 14, position: 'relative',
              }}>
                {u.avatar}
                {u.active && (
                  <div style={{ position: 'absolute', bottom: -2, right: -2, width: 12, height: 12, borderRadius: 99, background: '#22C55E', border: '2px solid #0A0F0A' }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                <div style={{ fontSize: 11, color: '#6B7B6B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                <div style={{ display: 'flex', gap: 10, marginTop: 4, fontSize: 10, color: '#6B7B6B' }}>
                  <span><span className="mono" style={{ color: '#A8B5A8', fontWeight: 700 }}>{u.workouts}</span> workout</span>
                  <span>·</span>
                  <span className="mono">{u.lastSeen}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <button style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(163,230,53,0.1)', border: 'none', color: '#A3E635', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PencilLine size={14} color="#A3E635" />
                </button>
                <button onClick={() => setConfirmDel(u)} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: 'none', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={14} color="#EF4444" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAB */}
      <button style={{
        position: 'fixed', bottom: 110, right: 22, zIndex: 50,
        width: 56, height: 56, borderRadius: 28,
        background: 'linear-gradient(135deg, #A3E635, #65A30D)',
        border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 12px 30px -4px rgba(163,230,53,0.6)',
      }}>
        <Plus size={24} color="#0A0F0A" />
      </button>

      {/* Confirm delete modal */}
      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Trash2 size={26} color="#EF4444" />
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Elimina utente?</div>
          <div style={{ fontSize: 13, color: '#A8B5A8', lineHeight: 1.4 }}>Questa azione è permanente e non può essere annullata.</div>
          {confirmDel && (
            <div style={{ margin: '14px 0', padding: 12, borderRadius: 14, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: `linear-gradient(135deg, #${confirmDel.color}, #${confirmDel.color}80)`, color: '#0A0F0A', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{confirmDel.avatar}</div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{confirmDel.name}</div>
                <div style={{ fontSize: 11, color: '#6B7B6B' }}>{confirmDel.email}</div>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <button onClick={() => setConfirmDel(null)} className="gt-btn-secondary" style={{ flex: 1, height: 50, borderRadius: 14, fontSize: 13 }}>Annulla</button>
            <button onClick={() => setConfirmDel(null)} style={{ flex: 1, height: 50, borderRadius: 14, fontSize: 13, fontWeight: 800, background: '#EF4444', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 6px 16px -4px rgba(239,68,68,0.5)' }}>Elimina</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

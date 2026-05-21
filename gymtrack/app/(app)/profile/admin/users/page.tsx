'use client';
import { useState, useEffect, useCallback } from 'react';
import { Shield, Settings, Search, PencilLine, Trash2, Plus, X, ChevronDown } from 'lucide-react';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: string;
  lastLoginAt: string | null;
}

function getInitials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(id: string) {
  const colors = ['A3E635', '00FF88', 'FBBF24', '60A5FA', 'EF4444', 'A78BFA', '34D399', 'FB7185'];
  return colors[id.charCodeAt(0) % colors.length]!;
}

function fmtDate(iso: string | null) {
  if (!iso) return 'Mai';
  return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: '2-digit' });
}

function SkeletonUserCard() {
  return (
    <div className="gt-card" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div className="gt-skeleton" style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div className="gt-skeleton" style={{ height: 14, width: '60%' }} />
        <div className="gt-skeleton" style={{ height: 11, width: '80%' }} />
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'admin' | 'user'>('all');

  // Edit modal
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'user'>('user');

  // Delete modal
  const [confirmDel, setConfirmDel] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Add user modal
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user' as 'admin' | 'user' });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) setUsers(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = users.filter(u => {
    if (filter === 'admin' && u.role !== 'admin') return false;
    if (filter === 'user' && u.role !== 'user') return false;
    if (search) {
      const q = search.toLowerCase();
      if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  async function handleDelete() {
    if (!confirmDel) return;
    setDeleting(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/users/${confirmDel.id}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== confirmDel.id));
        setConfirmDel(null);
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? 'Errore durante eliminazione');
      }
    } catch { setError('Errore di rete'); }
    finally { setDeleting(false); }
  }

  async function handleEdit() {
    if (!editUser) return;
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/admin/users/${editUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, role: editRole }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated } : u));
        setEditUser(null);
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? 'Errore aggiornamento');
      }
    } catch { setError('Errore di rete'); }
    finally { setSaving(false); }
  }

  async function handleAdd() {
    if (!newUser.name || !newUser.email || !newUser.password) {
      setError('Compila tutti i campi obbligatori'); return;
    }
    if (newUser.password.length < 8) { setError('Password minimo 8 caratteri'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      if (res.ok) {
        const created = await res.json();
        setUsers(prev => [created, ...prev]);
        setShowAdd(false);
        setNewUser({ name: '', email: '', password: '', role: 'user' });
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? 'Errore creazione utente');
      }
    } catch { setError('Errore di rete'); }
    finally { setSaving(false); }
  }

  const adminCount = users.filter(u => u.role === 'admin').length;
  const newThisMonth = users.filter(u => {
    if (!u.createdAt) return false;
    return (Date.now() - new Date(u.createdAt).getTime()) < 30 * 24 * 60 * 60 * 1000;
  }).length;

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', padding: '11px 14px',
    fontSize: 14, color: '#F5F5F4', background: '#1A2420',
    border: '1px solid rgba(163,230,53,0.18)', borderRadius: 12,
    outline: 'none', fontFamily: 'Manrope, sans-serif',
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#0A0F0A', overflow: 'hidden' }}>
      <div className="gt-scroll" style={{ position: 'absolute', inset: 0, paddingTop: 44, paddingBottom: 130, overflowX: 'hidden' }}>

        {/* Header */}
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

        {/* Stats */}
        <div style={{ padding: '0 22px 14px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { v: loading ? '…' : users.length, l: 'Totale' },
            { v: loading ? '…' : adminCount, l: 'Admin' },
            { v: loading ? '…' : `+${newThisMonth}`, l: 'Nuovi/mese' },
          ].map((s, i) => (
            <div key={i} className="gt-card" style={{ padding: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7B6B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{s.l}</div>
              <div className="mono" style={{ fontSize: 22, fontWeight: 800, color: '#F5F5F4' }}>{s.v}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ padding: '0 22px 12px' }}>
          <div style={{ background: '#1A2420', border: '1px solid rgba(163,230,53,0.14)', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', height: 46 }}>
            <Search size={16} color="#6B7B6B" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca per nome o email…"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#F5F5F4', fontSize: 14, fontFamily: 'Manrope, sans-serif' }} />
          </div>
        </div>

        {/* Filters */}
        <div style={{ padding: '0 22px 14px', display: 'flex', gap: 6 }}>
          {[{ k: 'all', l: 'Tutti' }, { k: 'admin', l: 'Admin' }, { k: 'user', l: 'Utenti' }].map(f => (
            <button key={f.k} onClick={() => setFilter(f.k as any)} style={{
              padding: '7px 14px', borderRadius: 99, border: f.k === filter ? 'none' : '1px solid rgba(255,255,255,0.06)',
              background: f.k === filter ? 'linear-gradient(135deg,#A3E635,#65A30D)' : '#1A2420',
              color: f.k === filter ? '#0A0F0A' : '#A8B5A8', fontWeight: 700, fontSize: 12, cursor: 'pointer',
            }}>{f.l}</button>
          ))}
          <div style={{ flex: 1 }} />
          <button style={{ padding: '7px 12px', borderRadius: 99, background: '#1A2420', border: '1px solid rgba(255,255,255,0.06)', color: '#A8B5A8', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            Attività <ChevronDown size={12} />
          </button>
        </div>

        {/* User list */}
        <div style={{ padding: '0 22px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loading ? (
            [0, 1, 2, 3].map(i => <SkeletonUserCard key={i} />)
          ) : visible.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 22px', color: '#6B7B6B', fontSize: 14 }}>
              {search ? 'Nessun utente trovato' : 'Nessun utente registrato'}
            </div>
          ) : visible.map(u => {
            const color = getAvatarColor(u.id);
            return (
              <div key={u.id} className="gt-card" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                  background: `linear-gradient(135deg, #${color}, #${color}80)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#0A0F0A', fontWeight: 800, fontSize: 14, position: 'relative',
                }}>
                  {getInitials(u.name)}
                  <div style={{
                    position: 'absolute', bottom: -2, right: -2, width: 12, height: 12, borderRadius: 99,
                    background: u.role === 'admin' ? '#00FF88' : '#22C55E',
                    border: '2px solid #0A0F0A',
                  }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</span>
                    {u.role === 'admin' && (
                      <span style={{ fontSize: 9, fontWeight: 800, color: '#00FF88', background: 'rgba(0,255,136,0.12)', padding: '2px 6px', borderRadius: 99, border: '1px solid rgba(0,255,136,0.25)', textTransform: 'uppercase', flexShrink: 0 }}>Admin</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#6B7B6B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{u.email}</div>
                  <div className="mono" style={{ fontSize: 10, color: '#4A584A' }}>
                    Registrato {fmtDate(u.createdAt)} · Ultimo accesso {fmtDate(u.lastLoginAt)}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <button onClick={() => { setEditUser(u); setEditName(u.name); setEditRole(u.role); setError(''); }} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(163,230,53,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PencilLine size={14} color="#A3E635" />
                  </button>
                  <button onClick={() => { setConfirmDel(u); setError(''); }} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 size={14} color="#EF4444" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FAB */}
      <button onClick={() => { setShowAdd(true); setError(''); setNewUser({ name: '', email: '', password: '', role: 'user' }); }} style={{
        position: 'fixed', bottom: 110, right: 22, zIndex: 50,
        width: 56, height: 56, borderRadius: 28,
        background: 'linear-gradient(135deg, #A3E635, #65A30D)', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 12px 30px -4px rgba(163,230,53,0.6)',
      }}>
        <Plus size={24} color="#0A0F0A" />
      </button>

      {/* ── Edit modal ── */}
      {editUser && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setEditUser(null); }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }} onClick={() => setEditUser(null)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 520, background: '#1F2A24', border: '1px solid rgba(163,230,53,0.2)', borderRadius: '24px 24px 0 0', padding: '20px 22px 40px' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '0 auto 18px' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>Modifica utente</div>
              <button onClick={() => setEditUser(null)} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: 'none', color: '#A8B5A8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7B6B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Nome</div>
                <input value={editName} onChange={e => setEditName(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7B6B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Ruolo</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['user', 'admin'] as const).map(r => (
                    <button key={r} onClick={() => setEditRole(r)} style={{
                      flex: 1, height: 44, borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
                      background: editRole === r ? 'linear-gradient(135deg, #A3E635, #65A30D)' : 'rgba(255,255,255,0.05)',
                      color: editRole === r ? '#0A0F0A' : '#A8B5A8',
                    }}>{r === 'admin' ? '🛡️ Admin' : '👤 Utente'}</button>
                  ))}
                </div>
              </div>
              {error && <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444', fontSize: 12 }}>{error}</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button onClick={() => setEditUser(null)} className="gt-btn-secondary" style={{ flex: 1, height: 50, borderRadius: 14, fontSize: 14 }}>Annulla</button>
                <button onClick={handleEdit} disabled={saving} className="gt-btn-primary" style={{ flex: 2, height: 50, borderRadius: 14, fontSize: 14, opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Salvataggio…' : 'Salva modifiche'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete modal ── */}
      {confirmDel && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }} onClick={() => setConfirmDel(null)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 520, background: '#1F2A24', border: '1px solid rgba(163,230,53,0.2)', borderRadius: '24px 24px 0 0', padding: '20px 22px 40px', textAlign: 'center' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '0 auto 18px' }} />
            <div style={{ width: 60, height: 60, borderRadius: 18, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Trash2 size={26} color="#EF4444" />
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Elimina utente?</div>
            <div style={{ fontSize: 13, color: '#A8B5A8', lineHeight: 1.4, marginBottom: 14 }}>
              Questa azione è <strong>permanente</strong> e non può essere annullata.
            </div>
            <div style={{ padding: 12, borderRadius: 14, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, textAlign: 'left' }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: `linear-gradient(135deg, #${getAvatarColor(confirmDel.id)}, #${getAvatarColor(confirmDel.id)}80)`, color: '#0A0F0A', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{getInitials(confirmDel.name)}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{confirmDel.name}</div>
                <div style={{ fontSize: 11, color: '#6B7B6B' }}>{confirmDel.email}</div>
              </div>
            </div>
            {error && <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444', fontSize: 12, marginBottom: 10 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setConfirmDel(null)} className="gt-btn-secondary" style={{ flex: 1, height: 50, borderRadius: 14, fontSize: 13 }}>Annulla</button>
              <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, height: 50, borderRadius: 14, fontSize: 13, fontWeight: 800, background: '#EF4444', color: '#fff', border: 'none', cursor: 'pointer', opacity: deleting ? 0.7 : 1, boxShadow: '0 6px 16px -4px rgba(239,68,68,0.5)' }}>
                {deleting ? 'Eliminando…' : 'Elimina'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add user modal ── */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }} onClick={() => setShowAdd(false)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 520, background: '#1F2A24', border: '1px solid rgba(163,230,53,0.2)', borderRadius: '24px 24px 0 0', padding: '20px 22px 40px' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '0 auto 18px' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>Aggiungi utente</div>
              <button onClick={() => setShowAdd(false)} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: 'none', color: '#A8B5A8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Nome completo *', field: 'name' as const, type: 'text', placeholder: 'Mario Rossi' },
                { label: 'Email *', field: 'email' as const, type: 'email', placeholder: 'mario@esempio.com' },
                { label: 'Password * (min. 8 caratteri)', field: 'password' as const, type: 'password', placeholder: '••••••••' },
              ].map(f => (
                <div key={f.field}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7B6B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{f.label}</div>
                  <input type={f.type} placeholder={f.placeholder} value={newUser[f.field]}
                    onChange={e => setNewUser(s => ({ ...s, [f.field]: e.target.value }))}
                    style={inputStyle} />
                </div>
              ))}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7B6B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Ruolo</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['user', 'admin'] as const).map(r => (
                    <button key={r} onClick={() => setNewUser(s => ({ ...s, role: r }))} style={{
                      flex: 1, height: 44, borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
                      background: newUser.role === r ? 'linear-gradient(135deg, #A3E635, #65A30D)' : 'rgba(255,255,255,0.05)',
                      color: newUser.role === r ? '#0A0F0A' : '#A8B5A8',
                    }}>{r === 'admin' ? '🛡️ Admin' : '👤 Utente'}</button>
                  ))}
                </div>
              </div>
              {error && <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444', fontSize: 12 }}>{error}</div>}
              <button onClick={handleAdd} disabled={saving} className="gt-btn-primary" style={{ width: '100%', height: 54, borderRadius: 16, fontSize: 15, marginTop: 4, opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Creazione…' : 'Crea utente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

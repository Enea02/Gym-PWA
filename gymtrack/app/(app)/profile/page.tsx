'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronRight, LogOut, Settings, Shield } from 'lucide-react';
import Link from 'next/link';
import { Toggle } from '@/components/ui/Toggle';
import { logoutAction } from './actions';
import { useSettings } from '@/components/providers/SettingsProvider';

// ── Types ──────────────────────────────────────────────────────────────────
interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  age: number | null;
  heightCm: number | null;
  currentWeightKg: number | null;
  targetWeightKg: number | null;
  sex: string | null;
  experienceLevel: string | null;
  fitnessGoal: string | null;
  preferredUnit: string;
  theme: string;
  createdAt: string;
  updatedAt: string;
}

interface Measurement {
  id: string;
  measuredAt: string;
  weightKg: number | null;
  bicepCm: number | null;
  chestCm: number | null;
  waistCm: number | null;
  hipsCm: number | null;
  thighCm: number | null;
  bodyFatPercent: number | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
}

function sexLabel(v: string | null) {
  if (v === 'male') return 'Maschio';
  if (v === 'female') return 'Femmina';
  if (v === 'other') return 'Altro';
  return '—';
}

function expLabel(v: string | null) {
  if (v === 'beginner') return 'Principiante';
  if (v === 'intermediate') return 'Intermedio';
  if (v === 'advanced') return 'Avanzato';
  return '—';
}

// ── Sub-components ─────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '14px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', gap: 12 }}>
      <div className="gt-skeleton" style={{ flex: 1, height: 16 }} />
      <div className="gt-skeleton" style={{ width: 60, height: 14 }} />
    </div>
  );
}

function StatBox({ value, label }: { value: string | number; label: string }) {
  return (
    <div style={{ background: '#1A2420', borderRadius: 14, padding: '10px 12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="mono" style={{ fontSize: 22, fontWeight: 800 }}>{value}</div>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#6B7B6B', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{label}</div>
    </div>
  );
}

// ── Inline editable row ────────────────────────────────────────────────────
interface EditRowProps {
  label: string;
  fieldKey: string;
  displayValue: string;
  editingField: string | null;
  inputValue: string;
  inputType?: string;
  onStartEdit: (field: string, currentRaw: string) => void;
  onInputChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  last?: boolean;
}

function EditRow({
  label, fieldKey, displayValue, editingField, inputValue,
  inputType = 'text', onStartEdit, onInputChange, onSave, onCancel, last,
}: EditRowProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isEditing = editingField === fieldKey;

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSave();
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', padding: '14px 14px',
        borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.04)',
        gap: 12, minHeight: 52,
      }}
    >
      <div style={{ flex: '0 0 auto', fontSize: 14, color: '#F5F5F4', fontWeight: 600, minWidth: 120 }}>{label}</div>
      {isEditing ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            ref={inputRef}
            type={inputType}
            value={inputValue}
            onChange={e => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1, background: 'rgba(163,230,53,0.08)', border: '1px solid rgba(163,230,53,0.35)',
              borderRadius: 10, padding: '6px 10px', color: '#F5F5F4', fontSize: 14,
              fontFamily: 'inherit', outline: 'none', minWidth: 0,
            }}
          />
          <button
            onClick={onSave}
            style={{
              padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #A3E635, #65A30D)', color: '#0A0F0A',
              fontWeight: 700, fontSize: 12,
            }}
          >OK</button>
          <button
            onClick={onCancel}
            style={{
              padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer', background: 'transparent', color: '#A8B5A8', fontSize: 12, fontWeight: 600,
            }}
          >✕</button>
        </div>
      ) : (
        <div
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, cursor: 'pointer' }}
          onClick={() => onStartEdit(fieldKey, displayValue)}
        >
          <span className="mono" style={{ fontSize: 13, color: '#A8B5A8', fontWeight: 600 }}>{displayValue || '—'}</span>
          <ChevronRight size={14} color="#6B7B6B" />
        </div>
      )}
    </div>
  );
}

// ── Select editable row ────────────────────────────────────────────────────
interface SelectRowProps {
  label: string;
  fieldKey: string;
  displayValue: string;
  editingField: string | null;
  options: { value: string; label: string }[];
  onStartEdit: (field: string, currentRaw: string) => void;
  onSelectSave: (field: string, value: string) => void;
  onCancel: () => void;
  last?: boolean;
}

function SelectRow({
  label, fieldKey, displayValue, editingField, options, onStartEdit, onSelectSave, onCancel, last,
}: SelectRowProps) {
  const isEditing = editingField === fieldKey;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '14px 14px',
      borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.04)',
      gap: 12, minHeight: 52,
    }}>
      <div style={{ flex: '0 0 auto', fontSize: 14, color: '#F5F5F4', fontWeight: 600, minWidth: 120 }}>{label}</div>
      {isEditing ? (
        <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => onSelectSave(fieldKey, opt.value)}
              style={{
                padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(163,230,53,0.3)',
                cursor: 'pointer', background: 'rgba(163,230,53,0.08)', color: '#A3E635',
                fontWeight: 700, fontSize: 12,
              }}
            >{opt.label}</button>
          ))}
          <button
            onClick={onCancel}
            style={{
              padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer', background: 'transparent', color: '#A8B5A8', fontSize: 12, fontWeight: 600,
            }}
          >✕</button>
        </div>
      ) : (
        <div
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, cursor: 'pointer' }}
          onClick={() => onStartEdit(fieldKey, '')}
        >
          <span className="mono" style={{ fontSize: 13, color: '#A8B5A8', fontWeight: 600 }}>{displayValue || '—'}</span>
          <ChevronRight size={14} color="#6B7B6B" />
        </div>
      )}
    </div>
  );
}

// ── Add measurement form ───────────────────────────────────────────────────
interface AddMeasurementFormProps {
  onClose: () => void;
  onAdded: (m: Measurement) => void;
}

function AddMeasurementForm({ onClose, onAdded }: AddMeasurementFormProps) {
  const [weightKg, setWeightKg] = useState('');
  const [bicepCm, setBicepCm] = useState('');
  const [chestCm, setChestCm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!weightKg && !bicepCm && !chestCm) {
      setError('Inserisci almeno un valore');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { measuredAt: new Date().toISOString() };
      if (weightKg) body.weightKg = parseFloat(weightKg);
      if (bicepCm) body.bicepCm = parseFloat(bicepCm);
      if (chestCm) body.chestCm = parseFloat(chestCm);

      const res = await fetch('/api/stats/body-weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Errore nel salvataggio');
      const added: Measurement = await res.json();
      onAdded(added);
      onClose();
    } catch {
      setError('Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '100%', maxWidth: 480, background: '#1A2420', borderRadius: '24px 24px 0 0',
        padding: '24px 22px 40px', border: '1px solid rgba(163,230,53,0.15)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 16, fontWeight: 800 }}>Nuova Misurazione</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6B7B6B', cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>

        {[
          { label: 'Peso (kg)', value: weightKg, setter: setWeightKg, placeholder: 'es. 80.5' },
          { label: 'Bicipite (cm)', value: bicepCm, setter: setBicepCm, placeholder: 'es. 38' },
          { label: 'Petto (cm)', value: chestCm, setter: setChestCm, placeholder: 'es. 104' },
        ].map(({ label, value, setter, placeholder }) => (
          <div key={label} style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#6B7B6B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>{label}</label>
            <input
              type="number"
              value={value}
              onChange={e => setter(e.target.value)}
              placeholder={placeholder}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12, padding: '12px 14px', color: '#F5F5F4', fontSize: 15,
                fontFamily: 'inherit', outline: 'none',
              }}
            />
          </div>
        ))}

        {error && <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 12 }}>{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="gt-btn-primary"
          style={{ width: '100%', padding: '15px 0', fontSize: 15, opacity: saving ? 0.7 : 1 }}
        >
          {saving ? 'Salvataggio...' : 'Salva Misurazione'}
        </button>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { unit, theme, setUnit, setTheme } = useSettings();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [showAddMeasurement, setShowAddMeasurement] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load on mount
  useEffect(() => {
    Promise.all([
      fetch('/api/users/me').then(r => r.json()),
      fetch('/api/stats/body-weight?days=365').then(r => r.json()),
    ]).then(([user, meas]) => {
      setProfile(user);
      const sorted = [...(Array.isArray(meas) ? meas : [])].sort(
        (a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime()
      );
      setMeasurements(sorted);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // PATCH helper
  const patchProfile = async (data: Partial<UserProfile>) => {
    setSaving(true);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) return;
      const updated: UserProfile = await res.json();
      setProfile(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // Inline edit helpers
  const startEdit = (field: string, currentRaw: string) => {
    setEditingField(field);
    setInputValue(currentRaw);
  };

  const cancelEdit = () => {
    setEditingField(null);
    setInputValue('');
  };

  const saveEdit = async () => {
    if (!editingField || !profile) return;
    const numericFields = ['age', 'heightCm', 'currentWeightKg', 'targetWeightKg'];
    const val = numericFields.includes(editingField)
      ? (inputValue === '' ? null : parseFloat(inputValue))
      : inputValue || null;
    await patchProfile({ [editingField]: val } as Partial<UserProfile>);
    setEditingField(null);
    setInputValue('');
  };

  const saveSelectField = async (field: string, value: string) => {
    await patchProfile({ [field]: value } as Partial<UserProfile>);
    setEditingField(null);
  };

  const saveGoal = async (goal: string) => {
    await patchProfile({ fitnessGoal: goal } as Partial<UserProfile>);
  };

  // Derived display values
  const initials = profile?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'GT';
  const isAdmin = profile?.role === 'admin';

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#0A0F0A', overflow: 'hidden' }}>
      <div className="gt-scroll" style={{ position: 'absolute', inset: 0, paddingTop: 44, paddingBottom: 130, overflowX: 'hidden' }}>

        {/* Hero */}
        <div style={{ padding: '14px 22px 22px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: -60, left: -40, right: -40, height: 220, background: 'radial-gradient(60% 50% at 50% 30%, rgba(163,230,53,0.18), transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em' }}>Profilo</div>
            <a
              href="#settings-section"
              style={{
                width: 40, height: 40, borderRadius: 12, background: '#1A2420',
                border: '1px solid rgba(255,255,255,0.06)', color: '#A8B5A8',
                display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none',
              }}
            >
              <Settings size={18} />
            </a>
          </div>

          {/* Avatar */}
          <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
            <div style={{
              width: 78, height: 78, borderRadius: 28, flexShrink: 0,
              background: 'linear-gradient(135deg, #A3E635 0%, #65A30D 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 800, color: '#0A0F0A', letterSpacing: '-0.02em',
              boxShadow: '0 12px 30px -6px rgba(163,230,53,0.5), inset 0 1px 0 rgba(255,255,255,0.4)',
              position: 'relative',
            }}>
              {loading ? '?' : initials}
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
              {loading ? (
                <>
                  <div className="gt-skeleton" style={{ width: 140, height: 20, marginBottom: 8 }} />
                  <div className="gt-skeleton" style={{ width: 180, height: 14 }} />
                </>
              ) : (
                <>
                  <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>{profile?.name || 'Utente'}</div>
                  <div style={{ fontSize: 12, color: '#6B7B6B', marginTop: 2 }}>{profile?.email}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    {profile?.experienceLevel && (
                      <div className="gt-chip">⚡ {expLabel(profile.experienceLevel)}</div>
                    )}
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
                </>
              )}
            </div>
          </div>

          {/* Quick stats */}
          <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, position: 'relative' }}>
            <StatBox value={profile?.currentWeightKg ? `${profile.currentWeightKg}` : '—'} label="Peso kg" />
            <StatBox value={profile?.heightCm ? `${profile.heightCm}` : '—'} label="Altezza cm" />
            <StatBox value={profile?.targetWeightKg ? `${profile.targetWeightKg}` : '—'} label="Obiettivo" />
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

        {/* ── DATI PERSONALI ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 22px', marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', color: '#A8B5A8', textTransform: 'uppercase' }}>DATI PERSONALI</span>
          {saving && <span style={{ fontSize: 11, color: '#A3E635' }}>Salvataggio...</span>}
        </div>
        <div className="gt-card" style={{ margin: '0 22px 22px' }}>
          {loading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : (
            <>
              <EditRow
                label="Nome"
                fieldKey="name"
                displayValue={profile?.name || ''}
                editingField={editingField}
                inputValue={inputValue}
                inputType="text"
                onStartEdit={startEdit}
                onInputChange={setInputValue}
                onSave={saveEdit}
                onCancel={cancelEdit}
              />
              <EditRow
                label="Età"
                fieldKey="age"
                displayValue={profile?.age != null ? `${profile.age} anni` : ''}
                editingField={editingField}
                inputValue={inputValue}
                inputType="number"
                onStartEdit={(f) => startEdit(f, profile?.age != null ? String(profile.age) : '')}
                onInputChange={setInputValue}
                onSave={saveEdit}
                onCancel={cancelEdit}
              />
              <EditRow
                label="Altezza"
                fieldKey="heightCm"
                displayValue={profile?.heightCm != null ? `${profile.heightCm} cm` : ''}
                editingField={editingField}
                inputValue={inputValue}
                inputType="number"
                onStartEdit={(f) => startEdit(f, profile?.heightCm != null ? String(profile.heightCm) : '')}
                onInputChange={setInputValue}
                onSave={saveEdit}
                onCancel={cancelEdit}
              />
              <EditRow
                label="Peso attuale"
                fieldKey="currentWeightKg"
                displayValue={profile?.currentWeightKg != null ? `${profile.currentWeightKg} kg` : ''}
                editingField={editingField}
                inputValue={inputValue}
                inputType="number"
                onStartEdit={(f) => startEdit(f, profile?.currentWeightKg != null ? String(profile.currentWeightKg) : '')}
                onInputChange={setInputValue}
                onSave={saveEdit}
                onCancel={cancelEdit}
              />
              <EditRow
                label="Peso obiettivo"
                fieldKey="targetWeightKg"
                displayValue={profile?.targetWeightKg != null ? `${profile.targetWeightKg} kg` : ''}
                editingField={editingField}
                inputValue={inputValue}
                inputType="number"
                onStartEdit={(f) => startEdit(f, profile?.targetWeightKg != null ? String(profile.targetWeightKg) : '')}
                onInputChange={setInputValue}
                onSave={saveEdit}
                onCancel={cancelEdit}
              />
              <SelectRow
                label="Sesso"
                fieldKey="sex"
                displayValue={sexLabel(profile?.sex ?? null)}
                editingField={editingField}
                options={[
                  { value: 'male', label: 'Maschio' },
                  { value: 'female', label: 'Femmina' },
                  { value: 'other', label: 'Altro' },
                ]}
                onStartEdit={startEdit}
                onSelectSave={saveSelectField}
                onCancel={cancelEdit}
              />
              <SelectRow
                label="Esperienza"
                fieldKey="experienceLevel"
                displayValue={expLabel(profile?.experienceLevel ?? null)}
                editingField={editingField}
                options={[
                  { value: 'beginner', label: 'Principiante' },
                  { value: 'intermediate', label: 'Intermedio' },
                  { value: 'advanced', label: 'Avanzato' },
                ]}
                onStartEdit={startEdit}
                onSelectSave={saveSelectField}
                onCancel={cancelEdit}
                last
              />
            </>
          )}
        </div>

        {/* ── OBIETTIVO ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 22px', marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', color: '#A8B5A8', textTransform: 'uppercase' }}>OBIETTIVO</span>
        </div>
        <div style={{ margin: '0 22px 22px' }}>
          <div className="gt-card-hi" style={{ padding: 4, display: 'flex', gap: 4 }}>
            {[
              { k: 'strength', emoji: '🏋️', label: 'Forza' },
              { k: 'mass', emoji: '💪', label: 'Massa' },
              { k: 'definition', emoji: '🔥', label: 'Definizione' },
              { k: 'endurance', emoji: '🏃', label: 'Resistenza' },
            ].map(g => {
              const isActive = profile?.fitnessGoal === g.k;
              return (
                <button
                  key={g.k}
                  onClick={() => saveGoal(g.k)}
                  style={{
                    flex: 1, textAlign: 'center', padding: '14px 6px', borderRadius: 14, border: 'none',
                    background: isActive ? 'linear-gradient(135deg, #A3E635, #65A30D)' : 'transparent',
                    color: isActive ? '#0A0F0A' : '#A8B5A8', fontWeight: 700, fontSize: 11, cursor: 'pointer',
                    boxShadow: isActive ? '0 4px 14px -4px rgba(163,230,53,0.4)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{g.emoji}</div>
                  {g.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── STORICO MISURE ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 22px', marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', color: '#A8B5A8', textTransform: 'uppercase' }}>STORICO MISURE</span>
          <button
            onClick={() => setShowAddMeasurement(true)}
            style={{
              padding: '4px 10px', borderRadius: 99, background: 'rgba(163,230,53,0.12)',
              border: '1px solid rgba(163,230,53,0.25)', color: '#A3E635', fontSize: 11, fontWeight: 700, cursor: 'pointer',
            }}
          >+ Aggiungi</button>
        </div>
        <div className="gt-card" style={{ margin: '0 22px 22px' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.9fr 1fr',
            padding: '12px 14px 6px', fontSize: 9, fontWeight: 700, color: '#6B7B6B',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            <div>Data</div><div>Peso</div><div>Bicipite</div><div>Petto</div>
          </div>
          {loading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : measurements.length === 0 ? (
            <div style={{ padding: '18px 14px', color: '#6B7B6B', fontSize: 13, textAlign: 'center' }}>
              Nessuna misurazione. Aggiungine una!
            </div>
          ) : (
            measurements.slice(0, 10).map((row) => (
              <div key={row.id} className="mono" style={{
                display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.9fr 1fr',
                padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.04)',
                alignItems: 'center', fontSize: 12,
              }}>
                <div style={{ fontWeight: 600, color: '#A8B5A8' }}>{fmtDate(row.measuredAt)}</div>
                <div style={{ fontWeight: 700 }}>
                  {row.weightKg != null ? <>{row.weightKg} <span style={{ color: '#6B7B6B', fontSize: 10 }}>kg</span></> : '—'}
                </div>
                <div style={{ fontWeight: 700 }}>
                  {row.bicepCm != null ? <>{row.bicepCm} <span style={{ color: '#6B7B6B', fontSize: 10 }}>cm</span></> : '—'}
                </div>
                <div style={{ fontWeight: 700 }}>
                  {row.chestCm != null ? <>{row.chestCm} <span style={{ color: '#6B7B6B', fontSize: 10 }}>cm</span></> : '—'}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── IMPOSTAZIONI ── */}
        <div id="settings-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 22px', marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', color: '#A8B5A8', textTransform: 'uppercase' }}>IMPOSTAZIONI</span>
        </div>
        <div className="gt-card" style={{ margin: '0 22px 22px' }}>
          {/* Unità di misura */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '14px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', gap: 12 }}>
            <div style={{ flex: 1, fontSize: 14, color: '#F5F5F4', fontWeight: 600 }}>Unità di misura</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['kg', 'lbs'] as const).map(u => (
                <button
                  key={u}
                  className="mono"
                  onClick={() => { setUnit(u); patchProfile({ preferredUnit: u }); }}
                  style={{
                    padding: '4px 12px', borderRadius: 99, border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer',
                    background: unit === u ? 'linear-gradient(135deg, #A3E635, #65A30D)' : 'rgba(255,255,255,0.05)',
                    color: unit === u ? '#0A0F0A' : '#A8B5A8',
                    transition: 'all 0.2s',
                  }}
                >{u}</button>
              ))}
            </div>
          </div>

          {/* Tema */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '14px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🌙</div>
            <div style={{ flex: 1, fontSize: 14, color: '#F5F5F4', fontWeight: 600 }}>Tema scuro</div>
            <Toggle
              on={theme === 'dark'}
              onChange={v => { const t = v ? 'dark' : 'light'; setTheme(t); patchProfile({ theme: t }); }}
            />
          </div>

          {/* Notifiche (local state only — no DB field) */}
          <SettingsToggleRow label="Notifiche" emoji="🔔" defaultOn />

          {/* Suoni timer (local state only) */}
          <SettingsToggleRow label="Suoni timer" emoji="🔊" defaultOn last />
        </div>

        {/* Logout */}
        <div style={{ margin: '0 22px', display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 8 }}>
          <form action={logoutAction}>
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

      {/* Add measurement modal */}
      {showAddMeasurement && (
        <AddMeasurementForm
          onClose={() => setShowAddMeasurement(false)}
          onAdded={(m) => setMeasurements(prev => [m, ...prev])}
        />
      )}
    </div>
  );
}

// ── Local-only toggle row (no DB field) ───────────────────────────────────
function SettingsToggleRow({ label, emoji, defaultOn, last }: { label: string; emoji: string; defaultOn?: boolean; last?: boolean }) {
  const [on, setOn] = useState(defaultOn ?? false);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '14px 14px',
      borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.04)', gap: 12,
    }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{emoji}</div>
      <div style={{ flex: 1, fontSize: 14, color: '#F5F5F4', fontWeight: 600 }}>{label}</div>
      <Toggle on={on} onChange={setOn} />
    </div>
  );
}

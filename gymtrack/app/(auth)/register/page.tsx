'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Registrazione fallita');
        return;
      }
      await signIn('credentials', { email, password, redirect: false });
      router.push('/');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 14px', fontSize: 14,
    fontFamily: 'Manrope, sans-serif', color: '#F5F5F4',
    background: '#1A2420', border: '1px solid rgba(163,230,53,0.14)',
    borderRadius: 16, outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, color: '#6B7B6B',
    textTransform: 'uppercase', letterSpacing: '0.08em',
    display: 'block', marginBottom: 8,
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0A0F0A',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 22px', position: 'relative',
    }}>
      <div style={{
        position: 'absolute', top: -120, left: -40, right: -40, height: 360,
        background: 'radial-gradient(60% 70% at 50% 30%, rgba(163,230,53,0.18), transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{ width: '100%', maxWidth: 400, position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
            Crea account
          </h1>
          <p style={{ marginTop: 6, fontSize: 13, color: '#A8B5A8' }}>
            Inizia a tracciare i tuoi progressi
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Nome</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Il tuo nome" required style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" required style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimo 8 caratteri" required minLength={8} style={inputStyle} />
          </div>
          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444', fontSize: 13 }}>
              {error}
            </div>
          )}
          <button type="submit" disabled={loading} className="gt-btn-primary" style={{
            width: '100%', height: 54, borderRadius: 16, fontSize: 15, marginTop: 6,
            opacity: loading ? 0.7 : 1,
          }}>
            {loading ? 'Creazione...' : 'Crea account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#6B7B6B' }}>
          Hai già un account?{' '}
          <Link href="/login" style={{ color: '#A3E635', fontWeight: 700, textDecoration: 'none' }}>
            Accedi
          </Link>
        </p>
      </div>
    </div>
  );
}

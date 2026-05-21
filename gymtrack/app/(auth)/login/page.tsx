'use client';
import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const urlError = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(urlError ? 'Email o password non corretti' : '');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Use redirect: true (default) so NextAuth sets the cookie server-side
    // before the browser is redirected. This is the reliable path.
    // On failure, NextAuth redirects to /login?error=CredentialsSignin.
    await signIn('credentials', {
      email,
      password,
      callbackUrl,
    });

    // If signIn threw or returned without redirecting (shouldn't happen normally)
    setLoading(false);
    setError('Email o password non corretti');
  }

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
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #A3E635 0%, #65A30D 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 20px 50px -8px rgba(163,230,53,0.5)',
            animation: 'gt-glow-pulse 2.4s ease-in-out infinite',
          }}>
            <svg width="38" height="38" viewBox="0 0 24 24" fill="#0A0F0A">
              <rect x="2" y="9" width="3" height="6" rx="1"/>
              <rect x="5" y="7" width="3" height="10" rx="1"/>
              <rect x="16" y="7" width="3" height="10" rx="1"/>
              <rect x="19" y="9" width="3" height="6" rx="1"/>
              <rect x="8" y="11" width="8" height="2" rx="1"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
            Gym<span style={{ color: '#A3E635' }}>Track</span>
          </h1>
          <p className="mono" style={{ marginTop: 6, fontSize: 11, color: '#6B7B6B', letterSpacing: 0.2 }}>
            TRACK YOUR PROGRESS
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: '#6B7B6B', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
              Email
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com" required autoComplete="email"
              inputMode="email"
              style={{
                width: '100%', padding: '13px 14px', fontSize: 16,
                fontFamily: 'Manrope, sans-serif', color: '#F5F5F4',
                background: '#1A2420', border: '1px solid rgba(163,230,53,0.14)',
                borderRadius: 16, outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: '#6B7B6B', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
              Password
            </label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required autoComplete="current-password"
              style={{
                width: '100%', padding: '13px 14px', fontSize: 16,
                fontFamily: 'Manrope, sans-serif', color: '#F5F5F4',
                background: '#1A2420', border: '1px solid rgba(163,230,53,0.14)',
                borderRadius: 16, outline: 'none', boxSizing: 'border-box',
              }}
            />
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
            {loading ? 'Accesso in corso...' : 'Accedi'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#6B7B6B' }}>
          Non hai un account?{' '}
          <Link href="/register" style={{ color: '#A3E635', fontWeight: 700, textDecoration: 'none' }}>
            Registrati
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0A0F0A' }} />}>
      <LoginForm />
    </Suspense>
  );
}

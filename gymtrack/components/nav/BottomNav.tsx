'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Dumbbell, BarChart3, User } from 'lucide-react';

const tabs = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/workout', icon: Dumbbell, label: 'Workout' },
  { href: '/stats', icon: BarChart3, label: 'Stats' },
  { href: '/profile', icon: User, label: 'Profilo' },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <div style={{ position: 'fixed', bottom: 20, left: 18, right: 18, zIndex: 100, pointerEvents: 'none' }}>
      {/* lime under-glow */}
      <div style={{
        position: 'absolute', inset: '8px 30px -20px 30px',
        background: 'radial-gradient(60% 100% at 50% 100%, rgba(163,230,53,0.55), transparent 70%)',
        filter: 'blur(20px)', pointerEvents: 'none',
      }} />
      {/* glass pill */}
      <div style={{
        position: 'relative', height: 72, borderRadius: 28,
        background: 'rgba(20, 28, 22, 0.62)',
        backdropFilter: 'blur(22px) saturate(160%)',
        WebkitBackdropFilter: 'blur(22px) saturate(160%)',
        border: '1px solid rgba(163,230,53,0.22)',
        boxShadow: '0 10px 40px -8px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 30px rgba(163,230,53,0.12)',
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        padding: 8, overflow: 'hidden', pointerEvents: 'auto',
      }}>
        {/* top sheen */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(163,230,53,0.5), transparent)',
        }} />
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link key={href} href={href} style={{
              position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: active ? '#0A0F0A' : '#A8B5A8', textDecoration: 'none',
            }}>
              {/* active pill */}
              <div style={{
                position: 'absolute', inset: 2, borderRadius: 22,
                background: active ? 'linear-gradient(135deg, #A3E635 0%, #65A30D 100%)' : 'transparent',
                boxShadow: active ? '0 8px 20px -4px rgba(163,230,53,0.55), inset 0 1px 0 rgba(255,255,255,0.35)' : 'none',
                transform: active ? 'translateY(-2px)' : 'translateY(0)',
                transition: 'transform 0.25s cubic-bezier(0.6, 1.5, 0.4, 1), box-shadow 0.25s, background 0.25s',
              }} />
              <div style={{
                position: 'relative', zIndex: 1,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                transform: active ? 'translateY(-2px)' : 'translateY(0)',
                transition: 'transform 0.25s cubic-bezier(0.6, 1.5, 0.4, 1)',
              }}>
                <Icon size={22} />
                <span style={{
                  fontSize: 10, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase',
                  maxHeight: active ? 14 : 0, opacity: active ? 1 : 0,
                  overflow: 'hidden', transition: 'max-height 0.25s, opacity 0.25s',
                }}>{label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

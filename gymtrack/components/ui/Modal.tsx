'use client';

interface Props { open: boolean; onClose: () => void; children: React.ReactNode; }

export function Modal({ open, onClose, children }: Props) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      animation: 'gt-slide-up 0.25s',
    }}>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
      }} />
      <div style={{
        position: 'relative', width: 'calc(100% - 24px)', maxWidth: 600,
        background: '#1F2A24',
        border: '1px solid rgba(163,230,53,0.2)',
        borderRadius: 28, padding: 22, marginBottom: 110,
        boxShadow: '0 -20px 60px rgba(0,0,0,0.5)',
      }}>
        {children}
      </div>
    </div>
  );
}

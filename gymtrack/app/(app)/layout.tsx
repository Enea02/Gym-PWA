import { BottomNav } from '@/components/nav/BottomNav';
import { Providers } from '@/components/providers';
import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <Providers>
      <div style={{ minHeight: '100vh', background: '#0A0F0A', position: 'relative' }}>
        {children}
        <BottomNav />
      </div>
    </Providers>
  );
}

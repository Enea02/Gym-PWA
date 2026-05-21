import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { Providers } from '@/components/providers';
import { BottomNav } from '@/components/nav/BottomNav';
import { HomeContent } from '@/app/(app)/home';

export default async function RootPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <Providers>
      <div style={{ minHeight: '100vh', background: '#0A0F0A', position: 'relative' }}>
        <HomeContent userName={session.user.name?.split(' ')[0] || 'Marco'} />
        <BottomNav />
      </div>
    </Providers>
  );
}

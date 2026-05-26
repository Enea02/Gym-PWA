import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { Providers } from '@/components/providers';
import { BottomNav } from '@/components/nav/BottomNav';
import { HomeContent } from '@/app/(app)/home';
import { SettingsProvider } from '@/components/providers/SettingsProvider';
import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getDashboardData } from '@/lib/server/dashboard';
import { getUserPlans } from '@/lib/server/plans';
import { qk } from '@/lib/query-keys';

export default async function RootPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const userId = session.user.id;
  const unit = session.user.preferredUnit ?? 'kg';
  const theme = session.user.theme ?? 'dark';

  // Prefetch on the server so the client hydrates with data already present —
  // no loading skeleton flash on first paint.
  const queryClient = new QueryClient();
  await Promise.all([
    queryClient.prefetchQuery({ queryKey: qk.dashboard, queryFn: () => getDashboardData(userId) }),
    queryClient.prefetchQuery({ queryKey: qk.plans, queryFn: () => getUserPlans(userId) }),
  ]);

  return (
    <Providers>
      <SettingsProvider initialUnit={unit} initialTheme={theme}>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <div style={{ minHeight: '100vh', background: 'var(--app-bg, #0A0F0A)', position: 'relative' }}>
            <HomeContent userName={session.user.name?.split(' ')[0] || 'Marco'} />
            <BottomNav />
          </div>
        </HydrationBoundary>
      </SettingsProvider>
    </Providers>
  );
}

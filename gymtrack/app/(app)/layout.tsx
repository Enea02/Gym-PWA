import { BottomNav } from '@/components/nav/BottomNav';
import { Providers } from '@/components/providers';
import { SettingsProvider } from '@/components/providers/SettingsProvider';
import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/login');

  const initialUnit = session.user.preferredUnit ?? 'kg';
  const initialTheme = session.user.theme ?? 'dark';

  return (
    <Providers>
      <SettingsProvider initialUnit={initialUnit} initialTheme={initialTheme}>
        <div style={{ minHeight: '100vh', background: 'var(--app-bg, #0A0F0A)', position: 'relative' }}>
          {children}
          <BottomNav />
        </div>
      </SettingsProvider>
    </Providers>
  );
}

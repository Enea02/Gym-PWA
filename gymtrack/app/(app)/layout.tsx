import { BottomNav } from '@/components/nav/BottomNav';
import { Providers } from '@/components/providers';
import { SettingsProvider } from '@/components/providers/SettingsProvider';
import { auth } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/login');

  let initialUnit: 'kg' | 'lbs' = 'kg';
  let initialTheme: 'dark' | 'light' = 'dark';
  try {
    const [user] = await db
      .select({ preferredUnit: users.preferredUnit, theme: users.theme })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);
    if (user) {
      initialUnit = (user.preferredUnit as 'kg' | 'lbs') ?? 'kg';
      initialTheme = (user.theme as 'dark' | 'light') ?? 'dark';
    }
  } catch {}

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

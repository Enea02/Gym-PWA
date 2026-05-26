import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const parsed = loginSchema.safeParse(credentials);
          if (!parsed.success) return null;

          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, parsed.data.email))
            .limit(1);

          if (!user) return null;

          const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
          if (!valid) return null;

          await db
            .update(users)
            .set({ lastLoginAt: new Date() })
            .where(eq(users.id, user.id));

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            preferredUnit: (user.preferredUnit as 'kg' | 'lbs') ?? 'kg',
            theme: (user.theme as 'dark' | 'light') ?? 'dark',
          };
        } catch (err) {
          console.error('[auth] authorize error:', err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: 'admin' | 'user' }).role ?? 'user';
        token.preferredUnit = (user as { preferredUnit?: 'kg' | 'lbs' }).preferredUnit ?? 'kg';
        token.theme = (user as { theme?: 'dark' | 'light' }).theme ?? 'dark';
      }
      // Allow client to push updated preferences via session.update()
      if (trigger === 'update' && session) {
        if (session.preferredUnit) token.preferredUnit = session.preferredUnit;
        if (session.theme) token.theme = session.theme;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'admin' | 'user';
        session.user.preferredUnit = (token.preferredUnit as 'kg' | 'lbs') ?? 'kg';
        session.user.theme = (token.theme as 'dark' | 'light') ?? 'dark';
      }
      return session;
    },
  },
});

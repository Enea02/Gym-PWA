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
  // DrizzleAdapter removed: using JWT strategy so adapter not required for sessions.
  // Add back if you need database sessions or OAuth providers.
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
          if (!parsed.success) {
            console.log('[auth] Validation failed:', parsed.error.issues);
            return null;
          }

          console.log('[auth] Looking up user:', parsed.data.email);
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, parsed.data.email))
            .limit(1);

          console.log('[auth] User found:', !!user);
          if (!user) return null;

          const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
          console.log('[auth] Password valid:', valid);
          if (!valid) return null;

          await db
            .update(users)
            .set({ lastLoginAt: new Date() })
            .where(eq(users.id, user.id));

          console.log('[auth] Login success for:', user.email, 'role:', user.role);
          return { id: user.id, email: user.email, name: user.name, role: user.role };
        } catch (err) {
          console.error('[auth] authorize error:', err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { id?: string; role?: string }).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'admin' | 'user';
      }
      return session;
    },
  },
});

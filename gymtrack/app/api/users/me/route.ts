import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/permissions';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { CACHE } from '@/lib/http/cache';

const patchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  age: z.number().int().min(10).max(100).optional().nullable(),
  heightCm: z.number().min(100).max(250).optional().nullable(),
  currentWeightKg: z.number().min(20).max(500).optional().nullable(),
  targetWeightKg: z.number().min(20).max(500).optional().nullable(),
  sex: z.enum(['male', 'female', 'other']).optional().nullable(),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional().nullable(),
  fitnessGoal: z.enum(['mass', 'strength', 'definition', 'endurance']).optional().nullable(),
  preferredUnit: z.enum(['kg', 'lbs']).optional(),
  theme: z.string().optional(),
}).strict();

export async function GET() {
  try {
    const session = await requireAuth();
    const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const { passwordHash: _ph, ...safe } = user;
    return NextResponse.json(safe, { headers: { 'Cache-Control': CACHE.medium } });
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') throw error;
    console.error('[GET /api/users/me]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const [updated] = await db
      .update(users)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(users.id, session.user.id))
      .returning();
    const { passwordHash: _ph, ...safe } = updated;
    return NextResponse.json(safe);
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') throw error;
    console.error('[PATCH /api/users/me]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

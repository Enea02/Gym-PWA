import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/permissions';
import { db } from '@/lib/db';
import { workoutSessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createSessionSchema } from '@/lib/validations';

export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const sessions = await db.query.workoutSessions.findMany({
      where: eq(workoutSessions.userId, userId),
      with: {
        plan: true,
        setLogs: {
          with: { template: true },
          orderBy: (sl, { asc }) => [asc(sl.setNumber)],
        },
      },
      orderBy: (ws, { desc }) => [desc(ws.scheduledFor)],
      limit: 50,
    });

    return NextResponse.json(sessions);
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') throw error;
    console.error('[GET /api/workouts/sessions]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const body = await req.json();
    const parsed = createSessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { workoutPlanId, scheduledFor, isManualEntry } = parsed.data;

    const [newSession] = await db
      .insert(workoutSessions)
      .values({
        userId,
        workoutPlanId: workoutPlanId ?? null,
        scheduledFor: new Date(scheduledFor),
        isManualEntry,
        status: 'planned',
      })
      .returning();

    return NextResponse.json(newSession, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') throw error;
    console.error('[POST /api/workouts/sessions]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

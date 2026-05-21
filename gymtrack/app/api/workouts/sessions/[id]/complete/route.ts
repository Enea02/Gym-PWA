import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/permissions';
import { db } from '@/lib/db';
import { workoutSessions, setLogs } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const { id: sessionId } = await context.params;

    // Verify session belongs to user
    const workoutSession = await db.query.workoutSessions.findFirst({
      where: and(
        eq(workoutSessions.id, sessionId),
        eq(workoutSessions.userId, userId)
      ),
    });

    if (!workoutSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (workoutSession.status === 'completed') {
      return NextResponse.json(
        { error: 'Session is already completed' },
        { status: 400 }
      );
    }

    // Calculate total volume: sum(weightKg * reps) for all sets
    const allSets = await db
      .select({ weightKg: setLogs.weightKg, reps: setLogs.reps })
      .from(setLogs)
      .where(eq(setLogs.sessionId, sessionId));

    const totalVolumeKg = allSets.reduce(
      (acc, s) => acc + s.weightKg * s.reps,
      0
    );

    const [completed] = await db
      .update(workoutSessions)
      .set({
        status: 'completed',
        completedAt: new Date(),
        totalVolumeKg: Math.round(totalVolumeKg * 100) / 100,
      })
      .where(and(eq(workoutSessions.id, sessionId), eq(workoutSessions.userId, userId)))
      .returning();

    return NextResponse.json(completed);
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') throw error;
    console.error('[POST /api/workouts/sessions/[id]/complete]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

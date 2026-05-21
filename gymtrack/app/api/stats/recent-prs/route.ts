import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/permissions';
import { db } from '@/lib/db';
import { setLogs, workoutSessions, exerciseTemplates } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await requireAuth();
    const prs = await db
      .select({
        id: setLogs.id,
        exerciseName: exerciseTemplates.name,
        weightKg: setLogs.weightKg,
        reps: setLogs.reps,
        completedAt: setLogs.completedAt,
      })
      .from(setLogs)
      .innerJoin(workoutSessions, eq(setLogs.sessionId, workoutSessions.id))
      .innerJoin(exerciseTemplates, eq(setLogs.exerciseTemplateId, exerciseTemplates.id))
      .where(
        and(
          eq(workoutSessions.userId, session.user.id),
          eq(setLogs.isPersonalRecord, true),
        )
      )
      .orderBy(desc(setLogs.completedAt))
      .limit(10);
    return NextResponse.json({ prs });
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') throw error;
    console.error('[GET /api/stats/recent-prs]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

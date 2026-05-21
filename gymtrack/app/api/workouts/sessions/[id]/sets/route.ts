import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/permissions';
import { db } from '@/lib/db';
import { setLogs, workoutSessions } from '@/lib/db/schema';
import { eq, and, max } from 'drizzle-orm';
import { setLogSchema } from '@/lib/validations';

async function checkPersonalRecord(
  userId: string,
  exerciseId: string,
  weightKg: number
): Promise<boolean> {
  const result = await db
    .select({ maxWeight: max(setLogs.weightKg) })
    .from(setLogs)
    .innerJoin(workoutSessions, eq(setLogs.sessionId, workoutSessions.id))
    .where(
      and(
        eq(workoutSessions.userId, userId),
        eq(setLogs.exerciseTemplateId, exerciseId)
      )
    );

  const currentMax = result[0]?.maxWeight ?? 0;
  return weightKg > currentMax;
}

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
        { error: 'Cannot log sets to a completed session' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = setLogSchema.safeParse({ ...body, sessionId });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { exerciseTemplateId, plannedExerciseId, setNumber, reps, weightKg, restSecondsActual } =
      parsed.data;

    // Check for PR before inserting
    const isPR = await checkPersonalRecord(userId, exerciseTemplateId, weightKg);

    const [setLog] = await db
      .insert(setLogs)
      .values({
        sessionId,
        exerciseTemplateId,
        plannedExerciseId: plannedExerciseId ?? null,
        setNumber,
        reps,
        weightKg,
        restSecondsActual: restSecondsActual ?? null,
        isPersonalRecord: isPR,
        completedAt: new Date(),
      })
      .returning();

    // Update session status to in_progress if it was planned
    if (workoutSession.status === 'planned') {
      await db
        .update(workoutSessions)
        .set({ status: 'in_progress', startedAt: new Date() })
        .where(eq(workoutSessions.id, sessionId));
    }

    return NextResponse.json({ setLog, isPR }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') throw error;
    console.error('[POST /api/workouts/sessions/[id]/sets]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/permissions';
import { db } from '@/lib/db';
import { setLogs, workoutSessions, exerciseTemplates } from '@/lib/db/schema';
import { eq, and, gte } from 'drizzle-orm';

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const { searchParams } = new URL(req.url);
    const exerciseId = searchParams.get('exerciseId');
    const period = searchParams.get('period') ?? '90'; // days

    if (!exerciseId) {
      return NextResponse.json(
        { error: 'exerciseId query parameter is required' },
        { status: 400 }
      );
    }

    const periodDays = parseInt(period, 10);
    if (isNaN(periodDays) || periodDays <= 0) {
      return NextResponse.json(
        { error: 'period must be a positive integer (days)' },
        { status: 400 }
      );
    }

    const since = addDays(new Date(), -periodDays);

    // Verify the exercise exists
    const exercise = await db.query.exerciseTemplates.findFirst({
      where: eq(exerciseTemplates.id, exerciseId),
    });

    if (!exercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }

    // Get all sets for this exercise by this user in the period
    const sets = await db
      .select({
        id: setLogs.id,
        setNumber: setLogs.setNumber,
        reps: setLogs.reps,
        weightKg: setLogs.weightKg,
        isPersonalRecord: setLogs.isPersonalRecord,
        completedAt: setLogs.completedAt,
        sessionId: setLogs.sessionId,
      })
      .from(setLogs)
      .innerJoin(workoutSessions, eq(setLogs.sessionId, workoutSessions.id))
      .where(
        and(
          eq(workoutSessions.userId, userId),
          eq(setLogs.exerciseTemplateId, exerciseId),
          gte(setLogs.completedAt, since)
        )
      )
      .orderBy(setLogs.completedAt);

    // Group by date (day), take max weight per day
    const byDate = new Map<
      string,
      { date: string; maxWeightKg: number; totalVolume: number; setCount: number; isPR: boolean }
    >();

    for (const s of sets) {
      const dateKey = s.completedAt.toISOString().split('T')[0];
      const existing = byDate.get(dateKey);
      const volume = s.weightKg * s.reps;

      if (!existing) {
        byDate.set(dateKey, {
          date: dateKey,
          maxWeightKg: s.weightKg,
          totalVolume: volume,
          setCount: 1,
          isPR: s.isPersonalRecord,
        });
      } else {
        byDate.set(dateKey, {
          ...existing,
          maxWeightKg: Math.max(existing.maxWeightKg, s.weightKg),
          totalVolume: existing.totalVolume + volume,
          setCount: existing.setCount + 1,
          isPR: existing.isPR || s.isPersonalRecord,
        });
      }
    }

    const progression = Array.from(byDate.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    return NextResponse.json({
      exercise: { id: exercise.id, name: exercise.name, muscleGroup: exercise.muscleGroup },
      period: periodDays,
      progression,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') throw error;
    console.error('[GET /api/stats/exercise-progression]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/permissions';
import { db } from '@/lib/db';
import { workoutSessions, setLogs } from '@/lib/db/schema';
import { eq, and, gte, count } from 'drizzle-orm';

function getStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function computePerformanceScore(
  completionRate: number,
  streakDays: number,
  prCount: number,
  volumeGrowth: number
): number {
  const score = Math.round(
    completionRate * 40 +
      Math.min(streakDays / 14, 1) * 20 +
      Math.min(prCount, 5) * 2 +
      Math.min(volumeGrowth * 30, 20)
  );
  return Math.max(0, Math.min(100, score));
}

export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const now = new Date();
    const sevenDaysAgo = addDays(now, -7);
    const thirtyDaysAgo = addDays(now, -30);
    const fourteenDaysAgo = addDays(now, -14);

    // --- Completion rate last 7 days ---
    const allSessionsLast7Days = await db
      .select({ status: workoutSessions.status })
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.userId, userId),
          gte(workoutSessions.scheduledFor, sevenDaysAgo)
        )
      );

    const plannedThisWeek = allSessionsLast7Days.length;
    const completedThisWeek = allSessionsLast7Days.filter(
      (s) => s.status === 'completed'
    ).length;
    const completionRate = completedThisWeek / Math.max(plannedThisWeek, 1);

    // --- Weekly volume ---
    const completedSessionsThisWeek = await db
      .select({ id: workoutSessions.id })
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.userId, userId),
          eq(workoutSessions.status, 'completed'),
          gte(workoutSessions.scheduledFor, sevenDaysAgo)
        )
      );

    let weeklyVolume = 0;
    if (completedSessionsThisWeek.length > 0) {
      const sessionIds = completedSessionsThisWeek.map((s) => s.id);
      // Sum volume from all sets in those sessions
      for (const sId of sessionIds) {
        const sets = await db
          .select({ weightKg: setLogs.weightKg, reps: setLogs.reps })
          .from(setLogs)
          .where(eq(setLogs.sessionId, sId));
        weeklyVolume += sets.reduce((acc, s) => acc + s.weightKg * s.reps, 0);
      }
    }

    // --- Previous week volume for growth calculation ---
    const fourteenDaysAgoDate = fourteenDaysAgo;
    const prevWeekSessions = await db
      .select({ id: workoutSessions.id })
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.userId, userId),
          eq(workoutSessions.status, 'completed'),
          gte(workoutSessions.scheduledFor, fourteenDaysAgoDate)
        )
      );

    // Filter to only those before 7 days ago
    let prevWeekVolume = 0;
    const prevOnlyIds = prevWeekSessions
      .map((s) => s.id)
      .filter((id) => !completedSessionsThisWeek.map((s) => s.id).includes(id));

    for (const sId of prevOnlyIds) {
      const sets = await db
        .select({ weightKg: setLogs.weightKg, reps: setLogs.reps })
        .from(setLogs)
        .where(eq(setLogs.sessionId, sId));
      prevWeekVolume += sets.reduce((acc, s) => acc + s.weightKg * s.reps, 0);
    }

    const volumeGrowth =
      prevWeekVolume > 0
        ? (weeklyVolume - prevWeekVolume) / prevWeekVolume
        : weeklyVolume > 0
        ? 1
        : 0;

    // --- PR count last 30 days ---
    const prSets = await db
      .select({ count: count() })
      .from(setLogs)
      .innerJoin(workoutSessions, eq(setLogs.sessionId, workoutSessions.id))
      .where(
        and(
          eq(workoutSessions.userId, userId),
          eq(setLogs.isPersonalRecord, true),
          gte(setLogs.completedAt, thirtyDaysAgo)
        )
      );
    const prCount = prSets[0]?.count ?? 0;

    // --- Streak days ---
    // Find consecutive days with completed sessions, going backwards from today
    const completedSessions = await db
      .select({ scheduledFor: workoutSessions.scheduledFor })
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.userId, userId),
          eq(workoutSessions.status, 'completed')
        )
      )
      .orderBy(workoutSessions.scheduledFor);

    const completedDays = new Set(
      completedSessions.map((s) =>
        getStartOfDay(s.scheduledFor).toISOString()
      )
    );

    let streakDays = 0;
    let checkDate = getStartOfDay(now);

    while (completedDays.has(checkDate.toISOString())) {
      streakDays++;
      checkDate = addDays(checkDate, -1);
    }

    const performanceScore = computePerformanceScore(
      completionRate,
      streakDays,
      prCount,
      volumeGrowth
    );

    return NextResponse.json({
      completionRate: Math.round(completionRate * 100) / 100,
      completedThisWeek,
      plannedThisWeek,
      streakDays,
      weeklyVolume: Math.round(weeklyVolume),
      prCount,
      volumeGrowth: Math.round(volumeGrowth * 100) / 100,
      performanceScore,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') throw error;
    console.error('[GET /api/stats/dashboard]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

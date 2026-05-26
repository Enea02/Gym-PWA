// Server-side dashboard data fetcher. Shared between the API route and SSR
// prefetch (so the home page can hydrate React Query without an extra fetch).
import { db } from '@/lib/db';
import { workoutSessions, setLogs, bodyMeasurements } from '@/lib/db/schema';
import { and, eq, gte, desc, sql } from 'drizzle-orm';

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
  volumeGrowth: number,
): number {
  const score = Math.round(
    completionRate * 40 +
      Math.min(streakDays / 14, 1) * 20 +
      Math.min(prCount, 5) * 2 +
      Math.min(volumeGrowth * 30, 20)
  );
  return Math.max(0, Math.min(100, score));
}

export interface DashboardData {
  completionRate: number;
  completedThisWeek: number;
  plannedThisWeek: number;
  streakDays: number;
  weeklyVolume: number;
  prCount: number;
  prCountMonth: number;
  volumeGrowth: number;
  volumeGrowthPct: number;
  performanceScore: number;
  performanceTrend: number[];
  currentWeightKg: number | null;
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const now = new Date();
  const today = getStartOfDay(now);
  const sevenDaysAgo = addDays(now, -7);
  const fourteenDaysAgo = addDays(now, -14);
  const thirtyDaysAgo = addDays(now, -30);
  const streakWindow = addDays(today, -120);

  const last7DaysSessions = await db
    .select({ status: workoutSessions.status })
    .from(workoutSessions)
    .where(and(
      eq(workoutSessions.userId, userId),
      gte(workoutSessions.scheduledFor, sevenDaysAgo),
    ));

  const plannedThisWeek = last7DaysSessions.length;
  const completedThisWeek = last7DaysSessions.filter(s => s.status === 'completed').length;
  const completionRate = completedThisWeek / Math.max(plannedThisWeek, 1);

  const sessionVolumes = await db
    .select({
      sessionId: workoutSessions.id,
      scheduledFor: workoutSessions.scheduledFor,
      totalVolumeKg: workoutSessions.totalVolumeKg,
      computedVolume: sql<number>`coalesce(sum(${setLogs.weightKg} * ${setLogs.reps}), 0)`,
    })
    .from(workoutSessions)
    .leftJoin(setLogs, eq(setLogs.sessionId, workoutSessions.id))
    .where(and(
      eq(workoutSessions.userId, userId),
      eq(workoutSessions.status, 'completed'),
      gte(workoutSessions.scheduledFor, fourteenDaysAgo),
    ))
    .groupBy(workoutSessions.id);

  let weeklyVolume = 0;
  let prevWeekVolume = 0;
  for (const s of sessionVolumes) {
    const v = s.totalVolumeKg ?? Number(s.computedVolume) ?? 0;
    if (s.scheduledFor >= sevenDaysAgo) weeklyVolume += v;
    else prevWeekVolume += v;
  }
  const volumeGrowth = prevWeekVolume > 0
    ? (weeklyVolume - prevWeekVolume) / prevWeekVolume
    : weeklyVolume > 0 ? 1 : 0;

  const prRows = await db
    .select({ c: sql<number>`count(*)` })
    .from(setLogs)
    .innerJoin(workoutSessions, eq(setLogs.sessionId, workoutSessions.id))
    .where(and(
      eq(workoutSessions.userId, userId),
      eq(setLogs.isPersonalRecord, true),
      gte(setLogs.completedAt, thirtyDaysAgo),
    ));
  const prCount = Number(prRows[0]?.c ?? 0);

  const completedSessions = await db
    .select({ scheduledFor: workoutSessions.scheduledFor })
    .from(workoutSessions)
    .where(and(
      eq(workoutSessions.userId, userId),
      eq(workoutSessions.status, 'completed'),
      gte(workoutSessions.scheduledFor, streakWindow),
    ));
  const completedDays = new Set(
    completedSessions.map(s => getStartOfDay(s.scheduledFor).toISOString())
  );

  let streakDays = 0;
  let checkDate = today;
  while (completedDays.has(checkDate.toISOString())) {
    streakDays++;
    checkDate = addDays(checkDate, -1);
  }

  const lastMeasurement = await db
    .select({ weightKg: bodyMeasurements.weightKg })
    .from(bodyMeasurements)
    .where(and(
      eq(bodyMeasurements.userId, userId),
      sql`${bodyMeasurements.weightKg} IS NOT NULL`,
    ))
    .orderBy(desc(bodyMeasurements.measuredAt))
    .limit(1);
  const currentWeightKg = lastMeasurement[0]?.weightKg ?? null;

  const performanceScore = computePerformanceScore(
    completionRate,
    streakDays,
    prCount,
    volumeGrowth,
  );

  const performanceTrend: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayEnd = addDays(today, -i);
    let count = 0;
    for (let j = 0; j < 7; j++) {
      const d = addDays(dayEnd, -j);
      if (completedDays.has(d.toISOString())) count++;
    }
    performanceTrend.push(Math.min(100, Math.round((count / 7) * 100)));
  }

  return {
    completionRate: Math.round(completionRate * 100) / 100,
    completedThisWeek,
    plannedThisWeek,
    streakDays,
    weeklyVolume: Math.round(weeklyVolume),
    prCount,
    prCountMonth: prCount,
    volumeGrowth: Math.round(volumeGrowth * 100) / 100,
    volumeGrowthPct: Math.round(volumeGrowth * 100),
    performanceScore,
    performanceTrend,
    currentWeightKg,
  };
}

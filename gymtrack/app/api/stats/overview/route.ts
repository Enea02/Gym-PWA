// Single aggregated endpoint used by SSR prefetch and the stats page to avoid
// 5 separate roundtrips. Returns the same shape as the individual endpoints
// so React Query can use it to seed multiple cache keys at once.
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/permissions';
import { db } from '@/lib/db';
import {
  exerciseTemplates,
  workoutSessions,
  setLogs,
  bodyMeasurements,
} from '@/lib/db/schema';
import { eq, or, and, gte, desc } from 'drizzle-orm';
import { CACHE } from '@/lib/http/cache';

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

export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;
    const url = new URL(req.url);
    const weeks = Math.max(1, Math.min(52, parseInt(url.searchParams.get('weeks') ?? '16', 10) || 16));
    const bodyDays = Math.max(1, parseInt(url.searchParams.get('bodyDays') ?? '365', 10) || 365);

    const now = new Date();
    const today = getStartOfDay(now);
    const since = addDays(now, -bodyDays);

    // Heatmap window: full weeks from most recent Sunday
    const dayOfWeek = today.getDay();
    const startSunday = addDays(today, -dayOfWeek);
    const heatmapSince = addDays(startSunday, -(weeks - 1) * 7);

    const [templates, sessions, measurements, prs] = await Promise.all([
      db
        .select()
        .from(exerciseTemplates)
        .where(or(eq(exerciseTemplates.isSystem, true), eq(exerciseTemplates.userId, userId)))
        .orderBy(exerciseTemplates.name),
      db
        .select({
          scheduledFor: workoutSessions.scheduledFor,
          status: workoutSessions.status,
          totalVolumeKg: workoutSessions.totalVolumeKg,
        })
        .from(workoutSessions)
        .where(and(
          eq(workoutSessions.userId, userId),
          gte(workoutSessions.scheduledFor, heatmapSince),
        )),
      db
        .select()
        .from(bodyMeasurements)
        .where(and(
          eq(bodyMeasurements.userId, userId),
          gte(bodyMeasurements.measuredAt, since),
        ))
        .orderBy(bodyMeasurements.measuredAt),
      db
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
        .where(and(
          eq(workoutSessions.userId, userId),
          eq(setLogs.isPersonalRecord, true),
        ))
        .orderBy(desc(setLogs.completedAt))
        .limit(10),
    ]);

    // Build heatmap grid (same logic as /api/stats/heatmap)
    const dateMap = new Map<string, { count: number; volume: number }>();
    for (const s of sessions) {
      const dateKey = getStartOfDay(s.scheduledFor).toISOString().split('T')[0]!;
      const existing = dateMap.get(dateKey);
      const v = s.totalVolumeKg ?? 0;
      if (!existing) dateMap.set(dateKey, { count: 1, volume: v });
      else dateMap.set(dateKey, { count: existing.count + 1, volume: existing.volume + v });
    }

    const todayStr = today.toISOString().split('T')[0]!;
    const cells: { date: string; count: number; volume: number }[] = [];
    let maxVolume = 0;
    for (let w = 0; w < weeks; w++) {
      for (let d = 0; d < 7; d++) {
        const cellDate = addDays(heatmapSince, w * 7 + d);
        const dateStr = cellDate.toISOString().split('T')[0]!;
        const data = dateMap.get(dateStr);
        const volume = data?.volume ?? 0;
        if (volume > maxVolume) maxVolume = volume;
        cells.push({ date: dateStr, count: data?.count ?? 0, volume });
      }
    }
    const grid = cells.map(c => {
      let intensity = 0;
      if (c.count > 0) {
        if (maxVolume > 0) {
          const ratio = c.volume / maxVolume;
          intensity = ratio < 0.25 ? 1 : ratio < 0.5 ? 2 : ratio < 0.75 ? 3 : 4;
        } else intensity = 1;
      }
      return { ...c, intensity, isToday: c.date === todayStr };
    });

    return NextResponse.json({
      exercises: templates,
      heatmap: { weeks, since: heatmapSince.toISOString().split('T')[0], through: todayStr, grid },
      bodyWeight: measurements,
      recentPRs: { prs },
    }, { headers: { 'Cache-Control': CACHE.short } });
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') throw error;
    console.error('[GET /api/stats/overview]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/permissions';
import { db } from '@/lib/db';
import { workoutSessions } from '@/lib/db/schema';
import { eq, and, gte } from 'drizzle-orm';

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

    const { searchParams } = new URL(req.url);
    const weeksParam = searchParams.get('weeks') ?? '26'; // default 26 weeks (half year)
    const weeks = Math.max(1, Math.min(52, parseInt(weeksParam, 10) || 26));

    const now = new Date();
    const today = getStartOfDay(now);

    // Start from the most recent Sunday (or today if Sunday)
    const dayOfWeek = today.getDay(); // 0 = Sunday
    const startSunday = addDays(today, -dayOfWeek);
    // Go back `weeks` weeks from the start Sunday
    const since = addDays(startSunday, -(weeks - 1) * 7);

    // Fetch all completed sessions in the date range
    const sessions = await db
      .select({
        scheduledFor: workoutSessions.scheduledFor,
        status: workoutSessions.status,
        totalVolumeKg: workoutSessions.totalVolumeKg,
      })
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.userId, userId),
          gte(workoutSessions.scheduledFor, since)
        )
      );

    // Build a map of date -> { count, volume }
    const dateMap = new Map<string, { count: number; volume: number; status: string }>();

    for (const s of sessions) {
      const dateKey = getStartOfDay(s.scheduledFor).toISOString().split('T')[0];
      const existing = dateMap.get(dateKey);
      if (!existing) {
        dateMap.set(dateKey, {
          count: 1,
          volume: s.totalVolumeKg ?? 0,
          status: s.status,
        });
      } else {
        dateMap.set(dateKey, {
          count: existing.count + 1,
          volume: existing.volume + (s.totalVolumeKg ?? 0),
          status: s.status === 'completed' ? 'completed' : existing.status,
        });
      }
    }

    // Build 7×N grid (7 rows = days of week, N cols = weeks)
    // Each cell: { date, count, volume, intensity (0-4) }
    const grid: Array<{
      date: string;
      count: number;
      volume: number;
      intensity: number;
      isToday: boolean;
    }> = [];

    const todayStr = today.toISOString().split('T')[0];
    let maxVolume = 0;

    // First pass: collect all cells
    const cells: Array<{ date: string; count: number; volume: number }> = [];
    for (let w = 0; w < weeks; w++) {
      for (let d = 0; d < 7; d++) {
        const cellDate = addDays(since, w * 7 + d);
        const dateStr = cellDate.toISOString().split('T')[0];
        const data = dateMap.get(dateStr);
        const volume = data?.volume ?? 0;
        maxVolume = Math.max(maxVolume, volume);
        cells.push({ date: dateStr, count: data?.count ?? 0, volume });
      }
    }

    // Second pass: assign intensity
    for (const cell of cells) {
      let intensity = 0;
      if (cell.count > 0) {
        if (maxVolume > 0) {
          const ratio = cell.volume / maxVolume;
          intensity = ratio < 0.25 ? 1 : ratio < 0.5 ? 2 : ratio < 0.75 ? 3 : 4;
        } else {
          intensity = 1;
        }
      }
      grid.push({
        ...cell,
        intensity,
        isToday: cell.date === todayStr,
      });
    }

    return NextResponse.json({
      weeks,
      since: since.toISOString().split('T')[0],
      through: todayStr,
      grid,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') throw error;
    console.error('[GET /api/stats/heatmap]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

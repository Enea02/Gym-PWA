import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/permissions';
import { db } from '@/lib/db';
import { bodyMeasurements } from '@/lib/db/schema';
import { eq, and, gte } from 'drizzle-orm';
import { z } from 'zod';

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

const addMeasurementSchema = z.object({
  weightKg: z.number().min(20).max(500).optional(),
  bodyFatPercent: z.number().min(0).max(100).optional(),
  chestCm: z.number().min(0).optional(),
  waistCm: z.number().min(0).optional(),
  hipsCm: z.number().min(0).optional(),
  bicepCm: z.number().min(0).optional(),
  thighCm: z.number().min(0).optional(),
  notes: z.string().max(500).optional(),
  measuredAt: z.string().datetime().optional(),
});

export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const { searchParams } = new URL(req.url);
    const daysParam = searchParams.get('days') ?? '90';
    const days = Math.max(1, parseInt(daysParam, 10) || 90);

    const since = addDays(new Date(), -days);

    const measurements = await db
      .select()
      .from(bodyMeasurements)
      .where(
        and(
          eq(bodyMeasurements.userId, userId),
          gte(bodyMeasurements.measuredAt, since)
        )
      )
      .orderBy(bodyMeasurements.measuredAt);

    return NextResponse.json(measurements);
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') throw error;
    console.error('[GET /api/stats/body-weight]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const body = await req.json();
    const parsed = addMeasurementSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { measuredAt, ...rest } = parsed.data;

    const [measurement] = await db
      .insert(bodyMeasurements)
      .values({
        userId,
        measuredAt: measuredAt ? new Date(measuredAt) : new Date(),
        ...rest,
      })
      .returning();

    return NextResponse.json(measurement, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') throw error;
    console.error('[POST /api/stats/body-weight]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

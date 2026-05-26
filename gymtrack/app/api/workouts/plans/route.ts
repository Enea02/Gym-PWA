import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/permissions';
import { db } from '@/lib/db';
import { workoutPlans, plannedExercises } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createWorkoutPlanSchema } from '@/lib/validations';
import { CACHE } from '@/lib/http/cache';

export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const plans = await db.query.workoutPlans.findMany({
      where: eq(workoutPlans.userId, userId),
      with: {
        exercises: {
          with: {
            template: true,
          },
          orderBy: (pe, { asc }) => [asc(pe.orderIndex)],
        },
      },
      orderBy: (wp, { asc }) => [asc(wp.dayOfWeek)],
    });

    return NextResponse.json(plans, { headers: { 'Cache-Control': CACHE.long } });
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') throw error;
    console.error('[GET /api/workouts/plans]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const body = await req.json();
    const parsed = createWorkoutPlanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, dayOfWeek, exercises } = parsed.data;

    const [plan] = await db
      .insert(workoutPlans)
      .values({ userId, name, dayOfWeek })
      .returning();

    if (exercises && exercises.length > 0) {
      await db.insert(plannedExercises).values(
        exercises.map((ex) => ({
          workoutPlanId: plan.id,
          exerciseTemplateId: ex.exerciseTemplateId,
          orderIndex: ex.orderIndex,
          plannedSets: ex.plannedSets,
          plannedReps: ex.plannedReps,
          plannedWeightKg: ex.plannedWeightKg,
          defaultRestSeconds: ex.defaultRestSeconds,
          restOverrides: ex.restOverrides ?? {},
          notes: ex.notes ?? null,
        }))
      );
    }

    const fullPlan = await db.query.workoutPlans.findFirst({
      where: eq(workoutPlans.id, plan.id),
      with: {
        exercises: {
          with: { template: true },
          orderBy: (pe, { asc }) => [asc(pe.orderIndex)],
        },
      },
    });

    return NextResponse.json(fullPlan, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') throw error;
    console.error('[POST /api/workouts/plans]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

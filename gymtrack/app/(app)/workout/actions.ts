'use server';

import { db } from '@/lib/db';
import {
  setLogs,
  workoutSessions,
  workoutPlans,
  plannedExercises,
} from '@/lib/db/schema';
import { eq, and, max } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth/permissions';
import { updateTag } from 'next/cache';
import {
  setLogSchema,
  createSessionSchema,
  createWorkoutPlanSchema,
  updatePlannedExerciseSchema,
  type SetLogInput,
  type CreateSessionInput,
  type CreateWorkoutPlanInput,
  type UpdatePlannedExerciseInput,
} from '@/lib/validations';

// ─── Internal helpers ────────────────────────────────────────────────────────

async function checkPersonalRecord(
  userId: string,
  exerciseId: string,
  weightKg: number,
  reps: number
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

  return weightKg > (result[0]?.maxWeight ?? 0);
}

// ─── Server Actions ───────────────────────────────────────────────────────────

/**
 * Log a single set during a live session.
 * Checks for personal record and returns { setLog, isPR }.
 */
export async function logSet(input: SetLogInput) {
  const session = await requireAuth();
  const userId = session.user.id;

  const parsed = setLogSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(`Invalid set log input: ${JSON.stringify(parsed.error.flatten())}`);
  }

  const {
    sessionId,
    exerciseTemplateId,
    plannedExerciseId,
    setNumber,
    reps,
    weightKg,
    restSecondsActual,
  } = parsed.data;

  // Verify the session belongs to the authenticated user
  const workoutSession = await db.query.workoutSessions.findFirst({
    where: and(
      eq(workoutSessions.id, sessionId),
      eq(workoutSessions.userId, userId)
    ),
  });

  if (!workoutSession) {
    throw new Error('Session not found or access denied');
  }

  if (workoutSession.status === 'completed') {
    throw new Error('Cannot log sets to a completed session');
  }

  const isPR = await checkPersonalRecord(userId, exerciseTemplateId, weightKg, reps);

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

  // Transition session to in_progress if it was planned
  if (workoutSession.status === 'planned') {
    await db
      .update(workoutSessions)
      .set({ status: 'in_progress', startedAt: new Date() })
      .where(eq(workoutSessions.id, sessionId));
  }

  updateTag('workout-data');

  return { setLog, isPR };
}

/**
 * Create a new workout session (status: 'planned').
 */
export async function createSession(input: CreateSessionInput) {
  const session = await requireAuth();
  const userId = session.user.id;

  const parsed = createSessionSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(`Invalid session input: ${JSON.stringify(parsed.error.flatten())}`);
  }

  const { workoutPlanId, scheduledFor, isManualEntry } = parsed.data;

  const [newSession] = await db
    .insert(workoutSessions)
    .values({
      userId,
      workoutPlanId: workoutPlanId ?? null,
      scheduledFor: new Date(scheduledFor),
      isManualEntry,
      status: 'planned',
    })
    .returning();

  updateTag('workout-data');

  return newSession;
}

/**
 * Start a live session — creates a session with status 'in_progress'.
 */
export async function startLiveSession(workoutPlanId: string | null, date: Date) {
  const session = await requireAuth();
  const userId = session.user.id;

  // If a planId is provided, verify it belongs to the user
  if (workoutPlanId) {
    const plan = await db.query.workoutPlans.findFirst({
      where: and(
        eq(workoutPlans.id, workoutPlanId),
        eq(workoutPlans.userId, userId)
      ),
    });

    if (!plan) {
      throw new Error('Workout plan not found or access denied');
    }
  }

  const [liveSession] = await db
    .insert(workoutSessions)
    .values({
      userId,
      workoutPlanId: workoutPlanId ?? null,
      scheduledFor: date,
      isManualEntry: !workoutPlanId,
      status: 'in_progress',
      startedAt: new Date(),
    })
    .returning();

  updateTag('workout-data');

  return liveSession;
}

/**
 * Mark a session as completed and calculate totalVolumeKg.
 */
export async function completeSession(sessionId: string) {
  const session = await requireAuth();
  const userId = session.user.id;

  const workoutSession = await db.query.workoutSessions.findFirst({
    where: and(
      eq(workoutSessions.id, sessionId),
      eq(workoutSessions.userId, userId)
    ),
  });

  if (!workoutSession) {
    throw new Error('Session not found or access denied');
  }

  if (workoutSession.status === 'completed') {
    throw new Error('Session is already completed');
  }

  // Calculate total volume
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
    .where(
      and(
        eq(workoutSessions.id, sessionId),
        eq(workoutSessions.userId, userId)
      )
    )
    .returning();

  updateTag('workout-data');

  return completed;
}

/**
 * Create a workout plan with its planned exercises.
 */
export async function createWorkoutPlan(input: CreateWorkoutPlanInput) {
  const session = await requireAuth();
  const userId = session.user.id;

  const parsed = createWorkoutPlanSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(`Invalid workout plan input: ${JSON.stringify(parsed.error.flatten())}`);
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

  updateTag('workout-data');

  return fullPlan;
}

/**
 * Update sets/reps/weight/rest on a planned exercise.
 */
export async function updatePlannedExercise(input: UpdatePlannedExerciseInput) {
  const session = await requireAuth();
  const userId = session.user.id;

  const parsed = updatePlannedExerciseSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(
      `Invalid planned exercise input: ${JSON.stringify(parsed.error.flatten())}`
    );
  }

  const { id, ...updates } = parsed.data;

  // Verify ownership through the plan
  const existing = await db.query.plannedExercises.findFirst({
    where: eq(plannedExercises.id, id),
    with: { plan: true },
  });

  if (!existing || existing.plan.userId !== userId) {
    throw new Error('Planned exercise not found or access denied');
  }

  const [updated] = await db
    .update(plannedExercises)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(plannedExercises.id, id))
    .returning();

  updateTag('workout-data');

  return updated;
}

import { z } from 'zod';

export const setLogSchema = z.object({
  sessionId: z.string().uuid(),
  exerciseTemplateId: z.string().uuid(),
  plannedExerciseId: z.string().uuid().nullable().optional(),
  setNumber: z.number().int().min(1).max(20),
  reps: z.number().int().min(1).max(100),
  weightKg: z.number().min(0).max(500),
  restSecondsActual: z.number().int().min(0).nullable().optional(),
});

export const workoutPlanSchema = z.object({
  name: z.string().min(1).max(100),
  dayOfWeek: z.number().int().min(0).max(6),
});

export const plannedExerciseSchema = z.object({
  workoutPlanId: z.string().uuid(),
  exerciseTemplateId: z.string().uuid(),
  orderIndex: z.number().int().min(0),
  plannedSets: z.number().int().min(1).max(20),
  plannedReps: z.number().int().min(1).max(100),
  plannedWeightKg: z.number().min(0).max(500),
  defaultRestSeconds: z.number().int().min(0).max(600).default(90),
  restOverrides: z.record(z.string(), z.number()).optional().default({}),
  notes: z.string().max(500).nullable().optional(),
});

export const createSessionSchema = z.object({
  workoutPlanId: z.string().uuid().nullable().optional(),
  scheduledFor: z.string().datetime(),
  isManualEntry: z.boolean().default(false),
});

export const exerciseTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  muscleGroup: z.enum(['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio']),
  notes: z.string().max(500).nullable().optional(),
});

export const createWorkoutPlanSchema = workoutPlanSchema.extend({
  exercises: z.array(
    z.object({
      exerciseTemplateId: z.string().uuid(),
      orderIndex: z.number().int().min(0),
      plannedSets: z.number().int().min(1).max(20),
      plannedReps: z.number().int().min(1).max(100),
      plannedWeightKg: z.number().min(0).max(500),
      defaultRestSeconds: z.number().int().min(0).max(600).default(90),
      restOverrides: z.record(z.string(), z.number()).optional().default({}),
      notes: z.string().max(500).nullable().optional(),
    })
  ).optional().default([]),
});

export const updatePlannedExerciseSchema = z.object({
  id: z.string().uuid(),
  plannedSets: z.number().int().min(1).max(20).optional(),
  plannedReps: z.number().int().min(1).max(100).optional(),
  plannedWeightKg: z.number().min(0).max(500).optional(),
  defaultRestSeconds: z.number().int().min(0).max(600).optional(),
  restOverrides: z.record(z.string(), z.number()).optional(),
  notes: z.string().max(500).nullable().optional(),
  orderIndex: z.number().int().min(0).optional(),
});

export type SetLogInput = z.infer<typeof setLogSchema>;
export type WorkoutPlanInput = z.infer<typeof workoutPlanSchema>;
export type PlannedExerciseInput = z.infer<typeof plannedExerciseSchema>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type ExerciseTemplateInput = z.infer<typeof exerciseTemplateSchema>;
export type CreateWorkoutPlanInput = z.infer<typeof createWorkoutPlanSchema>;
export type UpdatePlannedExerciseInput = z.infer<typeof updatePlannedExerciseSchema>;

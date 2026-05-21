import {
  pgTable, uuid, text, integer, real, timestamp, boolean,
  pgEnum, index, jsonb
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', ['admin', 'user']);
export const muscleGroupEnum = pgEnum('muscle_group', ['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio']);
export const sessionStatusEnum = pgEnum('session_status', ['planned', 'in_progress', 'completed', 'skipped']);
export const fitnessGoalEnum = pgEnum('fitness_goal', ['mass', 'strength', 'definition', 'endurance']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: userRoleEnum('role').notNull().default('user'),
  age: integer('age'),
  heightCm: real('height_cm'),
  currentWeightKg: real('current_weight_kg'),
  targetWeightKg: real('target_weight_kg'),
  sex: text('sex'),
  experienceLevel: text('experience_level'),
  fitnessGoal: fitnessGoalEnum('fitness_goal'),
  preferredUnit: text('preferred_unit').notNull().default('kg'),
  theme: text('theme').notNull().default('dark'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  lastLoginAt: timestamp('last_login_at'),
}, (table) => [
  index('users_email_idx').on(table.email),
  index('users_role_idx').on(table.role),
]);

export const exerciseTemplates = pgTable('exercise_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  muscleGroup: muscleGroupEnum('muscle_group').notNull(),
  notes: text('notes'),
  isSystem: boolean('is_system').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('exercise_templates_user_idx').on(table.userId),
  index('exercise_templates_name_idx').on(table.name),
]);

export const workoutPlans = pgTable('workout_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  dayOfWeek: integer('day_of_week').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('workout_plans_user_day_idx').on(table.userId, table.dayOfWeek),
]);

export const plannedExercises = pgTable('planned_exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  workoutPlanId: uuid('workout_plan_id').notNull().references(() => workoutPlans.id, { onDelete: 'cascade' }),
  exerciseTemplateId: uuid('exercise_template_id').notNull().references(() => exerciseTemplates.id),
  orderIndex: integer('order_index').notNull(),
  plannedSets: integer('planned_sets').notNull(),
  plannedReps: integer('planned_reps').notNull(),
  plannedWeightKg: real('planned_weight_kg').notNull(),
  defaultRestSeconds: integer('default_rest_seconds').notNull().default(90),
  restOverrides: jsonb('rest_overrides').$type<Record<string, number>>().default({}),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('planned_exercises_plan_idx').on(table.workoutPlanId),
]);

export const workoutSessions = pgTable('workout_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  workoutPlanId: uuid('workout_plan_id').references(() => workoutPlans.id, { onDelete: 'set null' }),
  status: sessionStatusEnum('status').notNull().default('planned'),
  isManualEntry: boolean('is_manual_entry').notNull().default(false),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  scheduledFor: timestamp('scheduled_for').notNull(),
  totalVolumeKg: real('total_volume_kg'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('sessions_user_date_idx').on(table.userId, table.scheduledFor),
  index('sessions_status_idx').on(table.status),
]);

export const setLogs = pgTable('set_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => workoutSessions.id, { onDelete: 'cascade' }),
  exerciseTemplateId: uuid('exercise_template_id').notNull().references(() => exerciseTemplates.id),
  plannedExerciseId: uuid('planned_exercise_id').references(() => plannedExercises.id, { onDelete: 'set null' }),
  setNumber: integer('set_number').notNull(),
  reps: integer('reps').notNull(),
  weightKg: real('weight_kg').notNull(),
  restSecondsActual: integer('rest_seconds_actual'),
  isPersonalRecord: boolean('is_personal_record').notNull().default(false),
  completedAt: timestamp('completed_at').notNull().defaultNow(),
}, (table) => [
  index('set_logs_session_idx').on(table.sessionId),
  index('set_logs_exercise_idx').on(table.exerciseTemplateId),
]);

export const bodyMeasurements = pgTable('body_measurements', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  measuredAt: timestamp('measured_at').notNull().defaultNow(),
  weightKg: real('weight_kg'),
  bodyFatPercent: real('body_fat_percent'),
  chestCm: real('chest_cm'),
  waistCm: real('waist_cm'),
  hipsCm: real('hips_cm'),
  bicepCm: real('bicep_cm'),
  thighCm: real('thigh_cm'),
  notes: text('notes'),
}, (table) => [
  index('measurements_user_date_idx').on(table.userId, table.measuredAt),
]);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  workoutPlans: many(workoutPlans),
  sessions: many(workoutSessions),
  measurements: many(bodyMeasurements),
  customExercises: many(exerciseTemplates),
}));

export const workoutPlansRelations = relations(workoutPlans, ({ one, many }) => ({
  user: one(users, { fields: [workoutPlans.userId], references: [users.id] }),
  exercises: many(plannedExercises),
}));

export const plannedExercisesRelations = relations(plannedExercises, ({ one }) => ({
  plan: one(workoutPlans, { fields: [plannedExercises.workoutPlanId], references: [workoutPlans.id] }),
  template: one(exerciseTemplates, { fields: [plannedExercises.exerciseTemplateId], references: [exerciseTemplates.id] }),
}));

export const sessionsRelations = relations(workoutSessions, ({ one, many }) => ({
  user: one(users, { fields: [workoutSessions.userId], references: [users.id] }),
  plan: one(workoutPlans, { fields: [workoutSessions.workoutPlanId], references: [workoutPlans.id] }),
  setLogs: many(setLogs),
}));

export const setLogsRelations = relations(setLogs, ({ one }) => ({
  session: one(workoutSessions, { fields: [setLogs.sessionId], references: [workoutSessions.id] }),
  template: one(exerciseTemplates, { fields: [setLogs.exerciseTemplateId], references: [exerciseTemplates.id] }),
}));

export const exerciseTemplatesRelations = relations(exerciseTemplates, ({ one }) => ({
  user: one(users, { fields: [exerciseTemplates.userId], references: [users.id] }),
}));

export const bodyMeasurementsRelations = relations(bodyMeasurements, ({ one }) => ({
  user: one(users, { fields: [bodyMeasurements.userId], references: [users.id] }),
}));

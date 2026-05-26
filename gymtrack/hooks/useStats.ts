'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/query-keys';

// Re-export so existing imports from this module keep working.
export { qk };

// ── Fetch helper ─────────────────────────────────────────────────────────────
async function getJSON<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}

async function sendJSON<T>(url: string, method: 'POST' | 'PATCH' | 'PUT' | 'DELETE', body?: unknown): Promise<T> {
  const r = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err?.error ?? `${r.status} ${url}`);
  }
  return r.json();
}

// ── Stats queries ────────────────────────────────────────────────────────────
export interface DashStats {
  performanceScore: number;
  completedThisWeek: number;
  plannedThisWeek: number;
  streakDays: number;
  prCount: number;
  prCountMonth: number;
  weeklyVolume: number;
  volumeGrowth: number;
  volumeGrowthPct: number;
  performanceTrend: number[];
  currentWeightKg: number | null;
  completionRate: number;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: qk.dashboard,
    queryFn: () => getJSON<DashStats>('/api/stats/dashboard'),
  });
}

export function useHeatmap(weeks = 16) {
  return useQuery({
    queryKey: qk.heatmap(weeks),
    queryFn: () => getJSON<{ weeks: number; grid: { date: string; count: number; volume: number; intensity: number; isToday: boolean }[] }>(`/api/stats/heatmap?weeks=${weeks}`),
    staleTime: 10 * 60 * 1000,
  });
}

export interface Measurement {
  id: string;
  measuredAt: string;
  weightKg: number | null;
  bodyFatPercent?: number | null;
  chestCm?: number | null;
  waistCm?: number | null;
  hipsCm?: number | null;
  bicepCm?: number | null;
  thighCm?: number | null;
}

export function useBodyWeight(days = 365) {
  return useQuery({
    queryKey: qk.bodyWeight(days),
    queryFn: async () => {
      const data = await getJSON<Measurement[] | { measurements: Measurement[] }>(`/api/stats/body-weight?days=${days}`);
      return Array.isArray(data) ? data : (data.measurements ?? []);
    },
  });
}

export interface PR {
  id: string;
  exerciseName: string;
  weightKg: number;
  reps: number;
  completedAt: string;
}

export function useRecentPRs() {
  return useQuery({
    queryKey: qk.recentPRs,
    queryFn: async () => {
      const data = await getJSON<{ prs: PR[] }>('/api/stats/recent-prs');
      return data.prs ?? [];
    },
  });
}

export interface ProgressionPoint {
  date: string;
  maxWeightKg: number;
  totalVolume: number;
  setCount: number;
  isPR: boolean;
}

export function useExerciseProgression(exerciseId: string | null, period: number) {
  return useQuery({
    queryKey: qk.exerciseProgression(exerciseId, period),
    queryFn: async () => {
      const data = await getJSON<{ progression: ProgressionPoint[] }>(
        `/api/stats/exercise-progression?exerciseId=${exerciseId}&period=${period}`
      );
      return data.progression ?? [];
    },
    enabled: !!exerciseId,
  });
}

// ── Exercises ─────────────────────────────────────────────────────────────────
export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  isSystem: boolean;
}

export function useExercises() {
  return useQuery({
    queryKey: qk.exercises,
    queryFn: () => getJSON<Exercise[]>('/api/exercises/templates'),
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; muscleGroup: string; notes?: string }) =>
      sendJSON<Exercise>('/api/exercises/templates', 'POST', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.exercises });
    },
  });
}

// ── Plans ─────────────────────────────────────────────────────────────────────
export interface PlannedExercise {
  id: string;
  orderIndex: number;
  plannedSets: number;
  plannedReps: number;
  plannedWeightKg: number | null;
  defaultRestSeconds: number | null;
  exerciseTemplateId?: string;
  template: { name: string; muscleGroup?: string | null };
}

export interface WorkoutPlan {
  id: string;
  name: string;
  dayOfWeek: number;
  exercises: PlannedExercise[];
}

export function usePlans() {
  return useQuery({
    queryKey: qk.plans,
    queryFn: async () => {
      const data = await getJSON<WorkoutPlan[]>('/api/workouts/plans');
      return Array.isArray(data) ? data : [];
    },
  });
}

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      name: string;
      dayOfWeek: number;
      exercises: Array<{
        exerciseTemplateId: string;
        orderIndex: number;
        plannedSets: number;
        plannedReps: number;
        plannedWeightKg: number | null;
        defaultRestSeconds: number;
      }>;
    }) => sendJSON<WorkoutPlan>('/api/workouts/plans', 'POST', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.plans });
    },
  });
}

export function useUpdatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { exercises: unknown[] } }) =>
      sendJSON<WorkoutPlan>(`/api/workouts/plans/${id}`, 'PATCH', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.plans });
    },
  });
}

// ── User profile ──────────────────────────────────────────────────────────────
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  age: number | null;
  heightCm: number | null;
  currentWeightKg: number | null;
  targetWeightKg: number | null;
  sex: string | null;
  experienceLevel: string | null;
  fitnessGoal: string | null;
  preferredUnit: string;
  theme: string;
  createdAt: string;
  updatedAt: string;
}

export function useMe() {
  return useQuery({
    queryKey: qk.me,
    queryFn: () => getJSON<UserProfile>('/api/users/me'),
  });
}

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<UserProfile>) =>
      sendJSON<UserProfile>('/api/users/me', 'PATCH', patch),
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: qk.me });
      const prev = qc.getQueryData<UserProfile>(qk.me);
      if (prev) qc.setQueryData<UserProfile>(qk.me, { ...prev, ...patch });
      return { prev };
    },
    onError: (_err, _patch, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.me, ctx.prev);
    },
    onSuccess: (data) => {
      qc.setQueryData(qk.me, data);
    },
  });
}

// ── Body measurements ─────────────────────────────────────────────────────────
export function useAddMeasurement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Measurement> & { measuredAt?: string }) =>
      sendJSON<Measurement>('/api/stats/body-weight', 'POST', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stats', 'body-weight'] });
      qc.invalidateQueries({ queryKey: qk.dashboard });
    },
  });
}

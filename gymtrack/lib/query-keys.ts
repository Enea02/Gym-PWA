// Plain (non-"use client") module so server components can import these tuple
// constants without going through the client boundary, which would turn them
// into opaque client references and break TanStack Query's Array.isArray check.

export const qk = {
  dashboard: ['stats', 'dashboard'] as const,
  heatmap: (weeks: number) => ['stats', 'heatmap', weeks] as const,
  bodyWeight: (days: number) => ['stats', 'body-weight', days] as const,
  recentPRs: ['stats', 'recent-prs'] as const,
  exerciseProgression: (id: string | null, period: number) =>
    ['stats', 'exercise-progression', id, period] as const,
  exercises: ['exercises', 'templates'] as const,
  plans: ['workouts', 'plans'] as const,
  me: ['users', 'me'] as const,
};

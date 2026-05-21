'use client';
import { useQuery } from '@tanstack/react-query';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => fetch('/api/stats/dashboard').then((r) => r.json()),
    staleTime: 5 * 60 * 1000,
  });
}

export function useExerciseProgression(exerciseId: string, period: string) {
  return useQuery({
    queryKey: ['exercise-progression', exerciseId, period],
    queryFn: () =>
      fetch(
        `/api/stats/exercise-progression?exerciseId=${exerciseId}&period=${period}`
      ).then((r) => r.json()),
    staleTime: 5 * 60 * 1000,
    enabled: !!exerciseId,
  });
}

export function useHeatmap() {
  return useQuery({
    queryKey: ['heatmap'],
    queryFn: () => fetch('/api/stats/heatmap').then((r) => r.json()),
    staleTime: 10 * 60 * 1000,
  });
}

export function useBodyWeight() {
  return useQuery({
    queryKey: ['body-weight'],
    queryFn: () => fetch('/api/stats/body-weight').then((r) => r.json()),
    staleTime: 5 * 60 * 1000,
  });
}

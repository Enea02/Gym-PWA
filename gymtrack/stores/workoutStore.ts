'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CompletedSet {
  exerciseId: string;
  setNumber: number;
  reps: number;
  weight: number;
  isPR: boolean;
}

interface LiveSessionState {
  sessionId: string | null;
  workoutPlanId: string | null;
  currentExerciseIndex: number;
  currentSet: number;
  completedSets: CompletedSet[];
  startedAt: string | null;
  totalVolume: number;
  // Actions
  startSession: (sessionId: string, workoutPlanId?: string) => void;
  addCompletedSet: (set: CompletedSet) => void;
  nextExercise: () => void;
  nextSet: () => void;
  addVolume: (kg: number) => void;
  clearSession: () => void;
}

export const useWorkoutStore = create<LiveSessionState>()(
  persist(
    (set) => ({
      sessionId: null,
      workoutPlanId: null,
      currentExerciseIndex: 0,
      currentSet: 1,
      completedSets: [],
      startedAt: null,
      totalVolume: 0,
      startSession: (sessionId, workoutPlanId) =>
        set({
          sessionId,
          workoutPlanId: workoutPlanId ?? null,
          startedAt: new Date().toISOString(),
          currentExerciseIndex: 0,
          currentSet: 1,
          completedSets: [],
          totalVolume: 0,
        }),
      addCompletedSet: (s) =>
        set((state) => ({ completedSets: [...state.completedSets, s] })),
      nextExercise: () =>
        set((state) => ({
          currentExerciseIndex: state.currentExerciseIndex + 1,
          currentSet: 1,
        })),
      nextSet: () =>
        set((state) => ({ currentSet: state.currentSet + 1 })),
      addVolume: (kg) =>
        set((state) => ({ totalVolume: state.totalVolume + kg })),
      clearSession: () =>
        set({
          sessionId: null,
          workoutPlanId: null,
          currentExerciseIndex: 0,
          currentSet: 1,
          completedSets: [],
          startedAt: null,
          totalVolume: 0,
        }),
    }),
    { name: 'gymtrack-live-session' }
  )
);

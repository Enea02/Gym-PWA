'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Unit = 'kg' | 'lbs';
type Theme = 'dark' | 'light';

interface SettingsCtx {
  unit: Unit;
  theme: Theme;
  setUnit: (u: Unit) => void;
  setTheme: (t: Theme) => void;
  formatWeight: (kg: number) => string;  // "92.5 kg" oppure "203.9 lbs"
  weightLabel: string;                   // "kg" oppure "lbs"
}

const SettingsContext = createContext<SettingsCtx>({
  unit: 'kg',
  theme: 'dark',
  setUnit: () => {},
  setTheme: () => {},
  formatWeight: (kg) => `${kg} kg`,
  weightLabel: 'kg',
});

export function useSettings() { return useContext(SettingsContext); }

export function SettingsProvider({ children, initialUnit = 'kg', initialTheme = 'dark' }: {
  children: ReactNode;
  initialUnit?: Unit;
  initialTheme?: Theme;
}) {
  const [unit, setUnitState] = useState<Unit>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('gt_unit') as Unit) ?? initialUnit;
    }
    return initialUnit;
  });
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('gt_theme') as Theme) ?? initialTheme;
    }
    return initialTheme;
  });

  // Apply theme to <html> on mount and when it changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  function setUnit(u: Unit) {
    setUnitState(u);
    localStorage.setItem('gt_unit', u);
    // Persist to DB (fire and forget)
    fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferredUnit: u }),
    }).catch(() => {});
  }

  function setTheme(t: Theme) {
    setThemeState(t);
    localStorage.setItem('gt_theme', t);
    document.documentElement.setAttribute('data-theme', t);
    fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: t }),
    }).catch(() => {});
  }

  function formatWeight(kg: number): string {
    if (unit === 'lbs') {
      return `${(kg * 2.20462).toFixed(1)} lbs`;
    }
    // Show decimals only if needed
    return `${Number.isInteger(kg) ? kg : kg.toFixed(1)} kg`;
  }

  return (
    <SettingsContext.Provider value={{ unit, theme, setUnit, setTheme, formatWeight, weightLabel: unit === 'lbs' ? 'lbs' : 'kg' }}>
      {children}
    </SettingsContext.Provider>
  );
}

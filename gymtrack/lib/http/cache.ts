// HTTP cache header presets per route. All values are "private" because the API
// is per-user: it must never end up in a shared CDN/proxy cache.
//
// max-age          → browser fresh window
// stale-while-revalidate → serve stale immediately, refresh in background
export const CACHE = {
  // ~Statico (esercizi sistema)
  static: 'private, max-age=600, stale-while-revalidate=3600',
  // Piani settimanali, esercizi templates
  long: 'private, max-age=120, stale-while-revalidate=600',
  // Dashboard, dati che cambiano spesso
  short: 'private, max-age=30, stale-while-revalidate=120',
  // Per dati personali stabili (users/me, body-weight, heatmap)
  medium: 'private, max-age=60, stale-while-revalidate=600',
  // Niente cache (mutazioni o dati sensibili)
  none: 'no-store',
} as const;

export type CachePreset = keyof typeof CACHE;

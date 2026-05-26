# GymTrack — Piano di ottimizzazione performance

> Analisi a fondo della soluzione e roadmap concreta per rendere l'app fluida.
> Focus principale: **caching multi-livello** (React Query, HTTP, Service Worker, DB)
> e rimozione dei colli di bottiglia attuali.

> ⚠️ Nota Next.js 16: prima di scrivere codice, verificare l'API in
> `node_modules/next/dist/docs/` — alcune API sono diverse rispetto a Next 15.
> Gli snippet qui sotto sono indicativi.

---

## 1. Riassunto esecutivo

L'app è lenta principalmente per **quattro ragioni cumulative**:

1. **Nessuna cache lato client.** `TanStack Query` è installato e il provider è già montato in [components/providers.tsx](components/providers.tsx), ma **non viene MAI usato**: tutte le pagine (`home`, `stats`, `workout`, `profile`) usano `fetch + useEffect + useState`. Ogni navigazione = refetch totale. Gli hook in [hooks/useStats.ts](hooks/useStats.ts) esistono ma non sono importati da nessuno.
2. **N+1 query SQL nella dashboard.** L'endpoint più chiamato dell'app ([app/api/stats/dashboard/route.ts](app/api/stats/dashboard/route.ts)) fa **2 cicli con una query DB per ogni sessione**. Su un utente con 10 sessioni completate / settimana sono **20+ HTTP roundtrip serverless verso Neon**. Tempo tipico: 800ms-2s.
3. **Nessuna cache HTTP.** Nessuna route API imposta header `Cache-Control` / `s-maxage` / `stale-while-revalidate`. Ogni richiesta colpisce sempre il DB.
4. **Service Worker non attivo.** `@serwist/next` è in `package.json` ma [next.config.ts](next.config.ts) è **vuoto** — nessun bundle PWA, nessuna cache offline degli asset statici, nessun precache delle route.

A questo si aggiunge: bundle gonfiato da deps non usate, layout `(app)` che colpisce il DB ad ogni navigazione, recharts inutilizzato, e nessun streaming/Suspense.

**Risultato atteso applicando il piano: tempo di apertura percepito ~3-5x più rapido**, navigazione tra tab **istantanea** dopo il primo caricamento, app funzionante anche offline.

---

## 2. Top 10 problemi per impatto

| # | Problema | Impatto | Sforzo | File |
|---|----------|---------|--------|------|
| 1 | TanStack Query non usato, no cache client | 🔴🔴🔴 | M | tutti i `page.tsx` client |
| 2 | N+1 query nella dashboard | 🔴🔴🔴 | S | [api/stats/dashboard](app/api/stats/dashboard/route.ts) |
| 3 | Streak query carica TUTTE le sessioni completate | 🔴🔴 | S | stesso file |
| 4 | Stats page = 5 fetch paralleli ad ogni montaggio | 🔴🔴 | M | [stats/page.tsx](app/(app)/stats/page.tsx) |
| 5 | Nessun header HTTP `Cache-Control` su API | 🔴🔴 | S | tutte le route |
| 6 | Service Worker / PWA non configurato | 🔴🔴 | M | [next.config.ts](next.config.ts) |
| 7 | Layout `(app)` fa query DB ad ogni navigazione | 🔴 | S | [app/(app)/layout.tsx](app/(app)/layout.tsx) |
| 8 | `recharts` (~150KB) e altre deps inutilizzate | 🔴 | S | [package.json](package.json) |
| 9 | Dashboard non usa `workoutSessions.totalVolumeKg` già materializzato | 🔴 | S | api/stats/dashboard |
| 10 | Nessun `loading.tsx` / Suspense streaming | 🟡 | S | tutte le route `(app)` |

Legenda: 🔴🔴🔴 critico • 🔴🔴 alto • 🔴 medio • 🟡 quick win

---

## 3. CACHING — il livello più importante

Strategia a 4 livelli, dall'alto in basso. Ogni livello assorbe traffico dal sottostante.

```
┌─ Browser (Service Worker)  →  asset statici, route shells, dati offline
├─ Memory  (React Query)     →  stato condiviso tra componenti, dedup richieste
├─ HTTP    (Cache-Control)   →  CDN / browser cache GET
└─ DB      (totali pre-calc) →  evita ricalcoli ad ogni GET
```

### 3.1 React Query — il vero "fix" che mancava

**Problema concreto.** [home.tsx:92-101](app/(app)/home.tsx#L92-L101) e [stats/page.tsx:279-308](app/(app)/stats/page.tsx#L279-L308) usano `fetch` raw. Navigando home → stats → home il browser **rifà tutti i fetch**, anche se gli stessi dati sono stati appena caricati 2 secondi prima.

`/api/stats/dashboard` viene fetchato **2 volte indipendentemente** all'avvio (una in home, una in stats), senza dedup.

**Azione.**
1. Trasformare tutti i `useEffect + fetch + useState` in `useQuery` (usare/estendere gli hook già scritti in [hooks/useStats.ts](hooks/useStats.ts)).
2. Aggiungere mutazioni con `useMutation` + `queryClient.invalidateQueries()` quando si salvano set, piani, misure.
3. Configurare il `QueryClient` in [components/providers.tsx](components/providers.tsx) con strategie sensate per dati di fitness (cambiano poco, è sicuro tenerli in cache più a lungo).

Esempio di configurazione da applicare al provider:

```ts
// components/providers.tsx — sostituire la creazione del QueryClient
const [queryClient] = useState(() => new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,           // 1 min: dati "freschi", no refetch on mount
      gcTime: 30 * 60 * 1000,         // 30 min in memoria
      refetchOnWindowFocus: false,    // mobile-first: non rifare al ritorno foreground
      refetchOnReconnect: 'always',
      retry: 1,
    },
    mutations: { retry: 0 },
  },
}));
```

Esempio di refactor di una pagina (home):

```tsx
// app/(app)/home.tsx
import { useQuery } from '@tanstack/react-query';
const { data: stats } = useQuery({
  queryKey: ['stats', 'dashboard'],
  queryFn: () => fetch('/api/stats/dashboard').then(r => r.json()),
});
const { data: plans = [] } = useQuery({
  queryKey: ['workouts', 'plans'],
  queryFn: () => fetch('/api/workouts/plans').then(r => r.json()),
});
```

Vantaggio immediato: **navigazione home ↔ stats istantanea** dopo il primo caricamento, perché entrambi condividono `['stats', 'dashboard']`.

### 3.2 Prefetch e hydration server-side

Per togliere lo "skeleton iniziale" sulla home (la pagina più visitata) sfruttare il fatto che [app/page.tsx](app/page.tsx) è già un Server Component:

1. Sul server: caricare i dati con la stessa funzione del route handler (non passare per `fetch('/api/...')`, leggere direttamente dal DB).
2. Passare i dati a `<HydrationBoundary>` di TanStack Query (vedi `@tanstack/react-query` docs per il Next.js App Router).
3. Il client riceve già la cache popolata — niente skeleton.

### 3.3 HTTP cache headers sulle API GET

Tutte le route GET attuali (dashboard, heatmap, body-weight, recent-prs, exercise-progression, exercises/templates, workouts/plans) **rispondono senza alcun header di cache**.

Per i dati lenti a cambiare (esercizi sistema, piani settimanali, heatmap) applicare:

```ts
return NextResponse.json(payload, {
  headers: {
    // Risposta personale, non condivisibile su CDN pubblica
    'Cache-Control': 'private, max-age=30, stale-while-revalidate=300',
  },
});
```

Tabella consigliata:

| Endpoint | max-age | s-w-r | Note |
|---|---|---|---|
| `/api/exercises/templates` | 600 | 3600 | quasi statico |
| `/api/workouts/plans` | 60 | 600 | cambia su edit utente |
| `/api/stats/heatmap` | 60 | 600 | dati storici |
| `/api/stats/recent-prs` | 30 | 300 | aggiornato al completamento sessione |
| `/api/stats/dashboard` | 30 | 120 | volutamente breve |
| `/api/users/me` | 60 | 600 | invalida su PATCH |
| `/api/stats/body-weight` | 60 | 600 | |
| `/api/stats/exercise-progression` | 120 | 600 | |

Le mutazioni (POST/PATCH/DELETE) **devono** chiamare `queryClient.invalidateQueries({ queryKey: [...] })` per evitare di mostrare dati stantii.

### 3.4 Service Worker / PWA offline

`@serwist/next` è già in deps ma `next.config.ts` è vuoto. Configurazione tipica:

```ts
// next.config.ts
import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  reloadOnOnline: true,
});

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
  compress: true,
  productionBrowserSourceMaps: false,
};

export default withSerwist(nextConfig);
```

Poi creare `app/sw.ts` con la default strategy di Serwist (`defaultCache`) che fornisce:
- precache di JS/CSS chunk Next
- runtime cache `network-first` per le API
- cache delle pagine visitate (offline-capable)

Verificare la firma esatta richiesta da Next 16 in `node_modules/next/dist/docs/`.

---

## 4. Database / API — eliminare i bottleneck più gravi

### 4.1 Dashboard N+1 (PRIORITÀ MASSIMA)

[app/api/stats/dashboard/route.ts:73-111](app/api/stats/dashboard/route.ts#L73-L111) contiene **due loop con una query SQL per iterazione**. Su 10 sessioni completate sono 20 roundtrip a Neon. Su utenti attivi può facilmente arrivare a 100+ chiamate.

**Soluzione**: una sola query aggregata.

```ts
import { sql } from 'drizzle-orm';

// Calcolo volume corrente + volume settimana precedente in 1 query
const volumes = await db
  .select({
    bucket: sql<string>`case
      when ${workoutSessions.scheduledFor} >= ${sevenDaysAgo} then 'curr'
      else 'prev'
    end`.as('bucket'),
    total: sql<number>`coalesce(sum(${setLogs.weightKg} * ${setLogs.reps}), 0)`,
  })
  .from(workoutSessions)
  .leftJoin(setLogs, eq(setLogs.sessionId, workoutSessions.id))
  .where(and(
    eq(workoutSessions.userId, userId),
    eq(workoutSessions.status, 'completed'),
    gte(workoutSessions.scheduledFor, fourteenDaysAgo),
  ))
  .groupBy(sql`bucket`);
```

Da 20+ query → **1 query**. Tempo atteso: 800ms → ~80ms.

### 4.2 Riusare `workoutSessions.totalVolumeKg`

Lo schema in [lib/db/schema.ts:86](lib/db/schema.ts#L86) ha già la colonna `totalVolumeKg`. L'endpoint heatmap la usa, ma la dashboard ricalcola dai `set_logs`. Se popoliamo `totalVolumeKg` al momento del `complete` (vedi `/api/workouts/sessions/[id]/complete`), la dashboard può sommare direttamente la colonna materializzata — niente JOIN con `set_logs` per il volume.

### 4.3 Streak — non scaricare tutta la storia

[dashboard/route.ts:136-159](app/api/stats/dashboard/route.ts#L136-L159) fa `select scheduledFor from workoutSessions where status='completed'` **senza limite di data**. Aggiungere `gte(scheduledFor, addDays(now, -120))` (streak realisticamente massimo ~120 giorni).

### 4.4 `/api/stats` — singolo endpoint aggregato

La [stats/page.tsx:279-308](app/(app)/stats/page.tsx#L279-L308) all'apertura fa **5 fetch in parallelo**. Sull'edge serverless ognuno paga cold start + JWT decode + connessione Neon.

Creare un endpoint aggregato `GET /api/stats/overview` che restituisce in un solo payload: `exercises`, `heatmap`, `bodyWeight`, `recentPRs`, `dashboard`. Cinque fetch → uno solo.

### 4.5 Layout `(app)` — togliere la query DB

[app/(app)/layout.tsx:14-26](app/(app)/layout.tsx#L14-L26) fa `select preferredUnit, theme from users` **ad ogni navigazione**. Questi sono dati personali stabili: spostarli nel JWT token.

In [lib/auth/auth.ts](lib/auth/auth.ts), `jwt` callback:
```ts
if (user) {
  // ... esistente
  token.preferredUnit = user.preferredUnit;
  token.theme = user.theme;
}
```
Poi nel layout leggere `session.user.preferredUnit` invece di interrogare il DB. Risparmiato 1 roundtrip Neon su **ogni** route renderizzata.

Quando l'utente cambia unit/theme (`/api/users/me` PATCH) basta forzare `session.update()` lato client per rinfrescare il JWT.

### 4.6 Pulizia generale route handlers

- Rimuovere i `console.log` di debug da [lib/auth/auth.ts:29-52](lib/auth/auth.ts#L29-L52) (rallentano + leak email).
- Aggiungere `export const dynamic = 'force-dynamic'` solo dove serve davvero; altrove lasciare Next decidere.
- Indice DB extra utile: `set_logs (session_id, completed_at)` e `workout_sessions (user_id, status, scheduled_for)` — se non già presenti via `index()` Drizzle.

---

## 5. Bundle / runtime client

### 5.1 Dipendenze da rimuovere

```
recharts        ~150 KB gz  → non importato da nessun file
@base-ui/react   ~40 KB gz  → usato solo da components/ui/button.tsx (e Button non è
                              importato da nessuna pagina — verificare e rimuovere
                              sia button.tsx che la dipendenza)
@auth/drizzle-adapter        → installato ma rimosso intenzionalmente dall'auth
                              (vedi CLAUDE.md memory)
```

Comando:
```bash
npm uninstall recharts @base-ui/react @auth/drizzle-adapter
```

Atteso risparmio JS scaricato: **~190 KB gz** sul primo carico.

### 5.2 `optimizePackageImports`

`lucide-react` espone centinaia di icone. Anche con tree-shaking, abilitare:

```ts
// next.config.ts
experimental: {
  optimizePackageImports: ['lucide-react', 'date-fns'],
},
```

Riduce sensibilmente i chunk delle pagine che importano molte icone (workout/page importa 7+).

### 5.3 Streaming + Suspense (loading.tsx)

Aggiungere `app/(app)/home/loading.tsx`, `stats/loading.tsx`, `workout/loading.tsx`, `profile/loading.tsx` con lo skeleton corrispondente. Next 16 mostra il skeleton **immediatamente** mentre il server prepara la risposta — la pagina sembra più reattiva senza modificare la logica.

### 5.4 Renderizzare home server-side

[app/(app)/home.tsx](app/(app)/home.tsx) è un client component che si "auto-fetcha" via `useEffect`. Risultato: skeleton 200-500ms anche con cache calda.

Variante migliore (Next 16 App Router):
- Estrarre `HomeContent` in una versione server (`HomeServer`) che riceve dati come props
- Fare i `db.select(...)` direttamente nella [app/page.tsx](app/page.tsx) Server Component
- Passare `initialStats` / `initialPlans` come props al client component, che li usa come `initialData` di React Query

Stesso pattern per stats page.

### 5.5 Charts come dynamic import

`AreaChart`, `CandleChart`, `HeatmapCalendar`, `Sparkline`, `RatingCircle`, `Confetti` non sono critici al primo paint. Caricarli on-demand:

```tsx
const HeatmapCalendar = dynamic(
  () => import('@/components/stats/HeatmapCalendar').then(m => m.HeatmapCalendar),
  { ssr: false, loading: () => <SkeletonBlock h={100} /> }
);
```

### 5.6 `setInterval` in live tracking

[workout/live/[sessionId]/page.tsx:60-63](app/(app)/workout/live/[sessionId]/page.tsx#L60-L63) ri-renderizza tutto il componente **ogni secondo** per aggiornare il cronometro. Estrarre il timer in un componente isolato `<SessionClock />` che incapsula `useState(elapsed)` — il resto della pagina non re-rendera.

### 5.7 `useMemo` ripetitivi su `bodyWeightData`

In [stats/page.tsx:384-404](app/(app)/stats/page.tsx#L384-L404), `weightChartData`, `currentWeight`, `weightDelta` fanno tutti `bodyWeightData.filter(m => m.weightKg != null)` separatamente. Creare un singolo `useMemo` che restituisce `{ sorted, current, delta }` da consumare insieme.

---

## 6. Network / infrastruttura

### 6.1 Drizzle + Neon HTTP

Il driver [lib/db/index.ts](lib/db/index.ts) usa `neon-http`: ogni query è una HTTP request. Per route che fanno più query consecutive (es. dashboard ottimizzata) considerare:

- `neonConfig.fetchConnectionCache = true` (riusa connessioni HTTP/2)
- O, per route con molte query, passare a `@neondatabase/serverless` WebSocket pool + Drizzle `neon-serverless`.

### 6.2 Edge runtime per le GET di sola lettura

Per `/api/exercises/templates` e altre read-only "quasi statiche" si può aggiungere `export const runtime = 'edge'` — cold start ~10x più rapido. Verificare compatibilità neon-http (è supportato).

### 6.3 Compressione

Verificare che Vercel/Next abbia `Brotli` attivo (di default sì). `next.config.ts` con `compress: true` come fallback per `next start` self-hosted.

### 6.4 Manifest fonts / icone

[app/manifest.ts](app/manifest.ts) referenzia `/icons/icon-192.png` e `/icons/icon-512.png` — la memoria del progetto segnala che potrebbero mancare. Se mancano, la PWA non installa e ogni richiesta fallisce con 404 (rumore in DevTools).

---

## 7. Piano d'azione consigliato (sequenziale)

### Fase 1 — Quick wins (mezza giornata, impatto enorme)

1. ✅ Rimuovere `recharts`, `@base-ui/react`, `@auth/drizzle-adapter`.
2. ✅ Abilitare `optimizePackageImports` in [next.config.ts](next.config.ts).
3. ✅ Spostare `preferredUnit` e `theme` nel JWT → eliminare la query DB da [app/(app)/layout.tsx](app/(app)/layout.tsx).
4. ✅ Aggiungere `Cache-Control: private, max-age=…, stale-while-revalidate=…` su tutte le route GET di `/api/stats/*` e `/api/workouts/plans`.
5. ✅ Rimuovere `console.log` da [lib/auth/auth.ts](lib/auth/auth.ts).

### Fase 2 — Caching client (1 giornata)

1. ✅ Aggiornare la config di [components/providers.tsx](components/providers.tsx) (vedi §3.1).
2. ✅ Refactor di `home.tsx`, `stats/page.tsx`, `workout/page.tsx`, `profile/page.tsx` per usare `useQuery` invece di `useEffect + fetch + useState`.
3. ✅ Sostituire i `fetch` di mutazione (POST/PATCH/DELETE) con `useMutation` + `invalidateQueries` mirate.

### Fase 3 — Backend hot path (1 giornata)

1. ✅ Riscrivere `/api/stats/dashboard` con la query aggregata (§4.1).
2. ✅ Limitare la query streak a 120 giorni (§4.3).
3. ✅ Popolare `totalVolumeKg` al completamento sessione (§4.2).
4. ✅ Creare `/api/stats/overview` aggregato per stats page (§4.4).

### Fase 4 — PWA + streaming (1 giornata)

1. ✅ Configurare `withSerwistInit` in [next.config.ts](next.config.ts) e creare `app/sw.ts` (§3.4).
2. ✅ Aggiungere `loading.tsx` su tutte le route `(app)` (§5.3).
3. ✅ Verificare/creare `public/icons/icon-192.png` e `icon-512.png`.
4. ✅ Server-side prefetch per home (§3.2 e §5.4).

### Fase 5 — Polish (mezza giornata)

1. ✅ Dynamic import dei chart (§5.5).
2. ✅ Estrarre `<SessionClock />` (§5.6).
3. ✅ Consolidare i `useMemo` su `bodyWeightData` (§5.7).
4. ✅ Misurare Lighthouse / Web Vitals pre e post per validare.

---

## 8. Come misurare i risultati

Prima di iniziare, fotografare la baseline:

```bash
# Bundle size attuale
cd gymtrack && npx next build
# Guardare la tabella "Route (app)" — annotare First Load JS

# Da DevTools (Performance tab, mobile throttling 4x slowdown + Slow 3G):
#  - Apertura home con cache vuota   → FCP, LCP, TTI
#  - Apertura home con cache calda   → tempo a "interactive"
#  - Navigazione home → stats        → tempo allo skeleton sparito
#  - Apertura stats con DB grande    → tempo all'ultimo grafico
```

Target post-piano (su mobile midrange con Slow 4G):
- First Load JS della home: **< 150 KB** (oggi presumibilmente 350+ KB con recharts).
- LCP home cache calda: **< 800 ms** (oggi >2s con skeleton + 2 fetch).
- Navigazione tab in-app: **< 200 ms percepiti** (oggi >1s).
- Dashboard API p95: **< 150 ms** (oggi >1s a causa del N+1).
- Apertura app offline dopo install: **funzionante** (oggi: errore).

---

## 9. File toccati dal piano (mappa rapida)

```
next.config.ts                                         §3.4 §5.2
package.json                                           §5.1
components/providers.tsx                               §3.1
hooks/useStats.ts                                      §3.1 (estendere)
app/page.tsx                                           §3.2 §5.4
app/layout.tsx                                         (no change)
app/(app)/layout.tsx                                   §4.5
app/(app)/home.tsx                                     §3.1 §5.4 §5.5
app/(app)/stats/page.tsx                               §3.1 §4.4 §5.5 §5.7
app/(app)/workout/page.tsx                             §3.1
app/(app)/workout/live/[sessionId]/page.tsx           §5.6
app/(app)/profile/page.tsx                             §3.1
app/(app)/{home,stats,workout,profile}/loading.tsx     §5.3 (nuovi)
app/sw.ts                                              §3.4 (nuovo)
app/api/stats/dashboard/route.ts                       §4.1 §4.3 §3.3
app/api/stats/heatmap/route.ts                         §3.3
app/api/stats/overview/route.ts                        §4.4 (nuovo)
app/api/stats/*/route.ts                               §3.3
app/api/workouts/plans/route.ts                        §3.3
app/api/workouts/sessions/[id]/complete/route.ts      §4.2
app/api/users/me/route.ts                              §3.3
lib/auth/auth.ts                                       §4.5 §4.6
lib/db/index.ts                                        §6.1 (opzionale)
public/icons/icon-{192,512}.png                        §6.4
```

---

*Documento generato il 2026-05-25 sulla base dell'analisi statica della codebase.
Le stime di tempo sono indicative per uno sviluppatore che ha familiarità con il progetto.*

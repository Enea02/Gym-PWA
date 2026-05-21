# DESIGN_PROMPT.md — Prompt per `claude code design`

Questo file contiene il comando da eseguire per implementare il frontend della PWA GymTrack a partire dal design generato.

---

## Comando da eseguire

```
claude code design Fetch this design file, read its readme, and implement the relevant aspects of the design. https://api.anthropic.com/v1/design/h/E-HiVX_Dfv--fPxR6m-29A?open_file=GymTrack.html
Implement: GymTrack.html
```

---

## Contesto Implementativo (da fornire a Claude Code dopo il comando design)

Una volta che il design è stato fetchato, procedi con l'implementazione seguendo queste linee guida tecniche, coerenti con `MASTER.md`:

### Stack target

- **Framework:** Next.js 15 (App Router) con TypeScript
- **Styling:** Tailwind CSS 3 + shadcn/ui (Radix primitives)
- **Database:** Neon Postgres via Drizzle ORM
- **Auth:** NextAuth v5 (Credentials Provider) con ruoli `admin` / `user`
- **State:** Zustand (sessione live) + TanStack Query (cache server)
- **Charts:** Recharts
- **PWA:** Serwist per service worker + manifest nativo Next.js
- **Deploy:** Vercel + integrazione Neon

### Struttura da rispettare

Replica la directory tree definita in `MASTER.md` sezione 3:
- `app/(auth)` per login/register
- `app/(app)` per area autenticata con BottomNav nel layout
- `app/(app)/workout/live/[sessionId]` per live tracking
- `app/(app)/workout/manual/[date]` per registrazione manuale
- `app/(app)/profile/admin/users` per gestione utenti (solo admin)

### Componenti chiave da implementare

1. **`BottomNav.tsx`** — Floating pill con glassmorphism, gradient lime sul tab attivo, glow soft, micro-animazione spring al tap (vedi sezione 8.3 di MASTER.md)
2. **`PerformanceRating.tsx`** — Cerchio SVG animato con stroke gradient lime, numero 0-100 grande al centro, etichetta motivazionale sotto
3. **`ExerciseCard.tsx`** — Card per esercizio pianificato con serie/reps/peso, indicatore timer recovery, badge progressione "+1 serie"
4. **`RestTimer.tsx`** — Countdown circolare SVG, pulsanti modifica live (+15s, +30s, skip), notifica audio + vibrazione al termine
5. **`LiveTracker.tsx`** — Vista esercizio corrente con stepper peso/reps, tracker serie completate (pallini), pulsante "aggiungi serie extra"
6. **`ManualEntry.tsx`** — Vista a lista compatta per inserimento retroattivo, tabella serie/peso/reps editabile, selettore data
7. **`ExerciseChart.tsx`** — Recharts area chart con gradiente lime, dropdown esercizio, toggle metrica (peso/volume/serie)
8. **`HeatmapCalendar.tsx`** — Griglia stile GitHub contributions con intensità verde proporzionale al volume
9. **`AdminUsersList.tsx`** — Lista utenti con search, filtri, conferma modale per eliminazione

### Design tokens da usare

Tailwind config deve includere queste estensioni:

```javascript
// tailwind.config.ts (estratto)
theme: {
  extend: {
    colors: {
      lime: {
        // usa già la palette tailwind, sono i valori chiave
        // 400: #A3E635 (primary)
        // 600: #65A30D
      },
      brand: {
        bg: '#0A0F0A',
        surface: '#111811',
        elevated: '#1A2420',
        accent: '#00FF88',
      },
      text: {
        primary: '#F5F5F4',
        secondary: '#A8B5A8',
      }
    },
    boxShadow: {
      'lime-glow': '0 0 40px rgba(163, 230, 53, 0.15)',
      'lime-glow-strong': '0 0 20px rgba(163, 230, 53, 0.5)',
    },
    backgroundImage: {
      'lime-gradient': 'linear-gradient(135deg, #A3E635 0%, #65A30D 100%)',
    }
  }
}
```

### Regole di implementazione

1. **Tutti i componenti che usano state browser devono avere `'use client'`** — il resto resta Server Component
2. **Niente fetch lato client per il render iniziale**: i dati delle pagine vengono fetchati nei Server Components e passati come props
3. **TanStack Query solo per mutation + refetch su interazione utente** (es. aggiungere set durante live tracking)
4. **Zod schema per ogni form** condivisi tra client (validazione UI) e server actions (validazione runtime)
5. **Accessibilità**: usa primitives Radix via shadcn, mai elementi `<div>` cliccabili
6. **Mobile first**: ogni componente progettato per 390px, responsive via breakpoint `md:` e `lg:`
7. **Touch target minimo 44x44px**: stepper, bottoni serie, FAB
8. **No layout shift**: usa skeleton screen durante loading

### Differenziazione admin vs user

- Nel layout `app/(app)/profile/layout.tsx`, leggi `session.user.role` via `auth()`
- Se admin: mostra tab "Gestione Utenti" + badge "Admin" prominente
- Se user: mostra solo profilo personale
- Route `/profile/admin/users` protetta da middleware (vedi `MASTER.md` sezione 6.3)

### Stati da non dimenticare

Per ogni vista implementa esplicitamente:
- **Loading state** (skeleton con shimmer lime)
- **Empty state** (es. "Nessun allenamento programmato per oggi" + CTA)
- **Error state** (toast + fallback UI)
- **Success state** (toast verde + eventuali confetti per PR)

### Micro-interazioni richieste

- Tap bottom nav: spring bounce + ripple lime
- Completamento serie: pallino si riempie con animazione, leggero pulse
- Sblocco PR: confetti animation + toast badge "🏆 Personal Record!"
- Aumento serie programmate: morph del numero con scale up
- Apertura modal: slide-up da bottom con backdrop blur

---

## Note operative

- Esegui il comando `claude code design` dalla root del progetto già inizializzato (vedi MASTER.md sezione 4.2)
- Dopo l'implementazione del design, segui le fasi descritte in `MASTER.md` sezione 11 per integrare logica di business, DB, auth
- Il design generato è la **base estetica e di layout** — la logica (state, fetch, mutation) deve essere costruita seguendo i pattern di `MASTER.md`

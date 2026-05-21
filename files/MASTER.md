# GymTrack — Documentazione Tecnica Master

> **Versione:** 1.0
> **Data:** Maggio 2026
> **Stack:** Next.js 15 (App Router) · TypeScript · Neon Postgres · NextAuth v5 · Tailwind CSS · PWA
> **Target:** Sviluppatore full-stack che implementerà la PWA end-to-end

---

## Indice

1. [Overview del Prodotto](#1-overview-del-prodotto)
2. [Stack Tecnologico](#2-stack-tecnologico)
3. [Architettura Generale](#3-architettura-generale)
4. [Setup Progetto](#4-setup-progetto)
5. [Database (Neon Postgres)](#5-database-neon-postgres)
6. [Autenticazione e Autorizzazione](#6-autenticazione-e-autorizzazione)
7. [API Routes e Server Actions](#7-api-routes-e-server-actions)
8. [Frontend e PWA](#8-frontend-e-pwa)
9. [Logica di Business Chiave](#9-logica-di-business-chiave)
10. [Deploy su Vercel](#10-deploy-su-vercel)
11. [Fasi di Implementazione](#11-fasi-di-implementazione)
12. [Checklist Pre-Produzione](#12-checklist-pre-produzione)

---

## 1. Overview del Prodotto

**GymTrack** è una Progressive Web App per il tracking degli allenamenti in palestra. Permette di pianificare workout giorno per giorno, registrare serie/ripetizioni/pesi (sia in tempo reale con timer di recupero, sia a posteriori in modalità manuale), e visualizzare statistiche dettagliate sull'andamento dei carichi e della frequenza.

### Funzionalità Core

- **Home/Dashboard**: rating di performance, streak, riepilogo settimanale
- **Workout Planner**: pianificazione esercizi per ogni giorno della settimana
- **Live Tracking**: tracking in tempo reale con timer di recupero personalizzabili
- **Registrazione Manuale**: inserimento allenamenti a posteriori
- **Statistiche**: grafici stile finanziario su pesi, volumi, frequenza, peso corporeo
- **Gestione Utenti**: due ruoli (admin e user), admin gestisce lista utenti

### Filosofia di Progressione

Il sistema di progressive overload **non è basato sull'aumento automatico delle ripetizioni** ma sull'**aumento progressivo del numero di serie**. Le ripetizioni e il peso restano stabili (modificabili manualmente), mentre l'app suggerisce di aggiungere serie quando l'utente completa con successo gli allenamenti pianificati.

---

## 2. Stack Tecnologico

| Categoria | Tecnologia | Versione | Motivazione |
|-----------|-----------|----------|-------------|
| Framework | Next.js | 15.x (App Router) | SSR + Server Actions + PWA-ready |
| Linguaggio | TypeScript | 5.x | Type safety end-to-end |
| Database | Neon Postgres | Serverless | Branching, scaling automatico, zero ops |
| ORM | Drizzle ORM | latest | Type-safe, leggero, ottimo per Neon |
| Auth | NextAuth.js (Auth.js) | v5 | Standard de facto, supporto ruoli |
| Styling | Tailwind CSS | 3.x | Mobile-first, utility-first |
| UI Components | shadcn/ui + Radix | latest | Componenti accessibili, customizzabili |
| Charts | Recharts | latest | Grafici reattivi, stile finanziario |
| State Mgmt | Zustand + TanStack Query | latest | State locale + cache server |
| Forms | React Hook Form + Zod | latest | Validazione type-safe |
| PWA | next-pwa o Serwist | latest | Service worker, manifest, offline |
| Date | date-fns | latest | Manipolazione date timezone-safe |
| Deploy | Vercel | - | Integrazione nativa con Next.js + Neon |

### Perché Drizzle e non Prisma

- **Edge-compatible**: gira su Vercel Edge Runtime senza problemi
- **Type-safety nativa**: schema in TypeScript, no generazione codice
- **Performance migliore** su Neon (connessioni serverless ottimizzate via `@neondatabase/serverless`)
- **Migrations** semplici via `drizzle-kit`

---

## 3. Architettura Generale

### Struttura Directory

```
gymtrack/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── (app)/
│   │   ├── layout.tsx              # Layout con BottomNav
│   │   ├── page.tsx                # Home / Dashboard
│   │   ├── workout/
│   │   │   ├── page.tsx            # Vista settimanale
│   │   │   ├── [date]/
│   │   │   │   └── page.tsx        # Dettaglio giorno
│   │   │   ├── live/
│   │   │   │   └── [sessionId]/
│   │   │   │       └── page.tsx    # Live tracking
│   │   │   └── manual/
│   │   │       └── [date]/
│   │   │           └── page.tsx    # Registrazione manuale
│   │   ├── stats/
│   │   │   └── page.tsx
│   │   └── profile/
│   │       ├── page.tsx            # Profilo user
│   │       └── admin/
│   │           └── users/
│   │               └── page.tsx    # Gestione utenti (solo admin)
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── workouts/route.ts
│   │   ├── exercises/route.ts
│   │   ├── sessions/route.ts
│   │   ├── stats/route.ts
│   │   └── admin/users/route.ts
│   ├── layout.tsx                  # Root layout (manifest, theme)
│   ├── manifest.ts                 # Manifest PWA
│   └── globals.css
├── components/
│   ├── ui/                         # shadcn components
│   ├── nav/
│   │   └── BottomNav.tsx
│   ├── home/
│   │   ├── PerformanceRating.tsx
│   │   └── WeeklySummary.tsx
│   ├── workout/
│   │   ├── ExerciseCard.tsx
│   │   ├── LiveTracker.tsx
│   │   ├── RestTimer.tsx
│   │   └── ManualEntry.tsx
│   ├── stats/
│   │   ├── ExerciseChart.tsx
│   │   ├── HeatmapCalendar.tsx
│   │   └── BodyWeightChart.tsx
│   └── shared/
│       └── ...
├── lib/
│   ├── db/
│   │   ├── schema.ts               # Drizzle schema
│   │   ├── index.ts                # Drizzle client
│   │   └── queries/                # Query functions
│   ├── auth/
│   │   ├── auth.ts                 # NextAuth config
│   │   └── permissions.ts          # Helper RBAC
│   ├── utils.ts
│   └── validations/                # Zod schemas
├── hooks/
│   ├── useWorkout.ts
│   ├── useTimer.ts
│   └── useStats.ts
├── stores/
│   └── workoutStore.ts             # Zustand store per sessione live
├── public/
│   ├── icons/
│   │   ├── icon-192.png
│   │   ├── icon-512.png
│   │   └── ...
│   └── sw.js                       # Service worker (generato)
├── drizzle/
│   └── migrations/
├── middleware.ts                   # Auth middleware
├── next.config.mjs
├── drizzle.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### Flusso Architetturale

```
┌──────────────┐
│   Browser    │ (PWA, mobile-first)
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────┐
│  Next.js App Router (Vercel)             │
│  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │  Pages   │→ │  Server  │→ │  API   │  │
│  │  (RSC)   │  │  Actions │  │ Routes │  │
│  └──────────┘  └──────────┘  └────┬───┘  │
│         ▲              ▲          │      │
│         │  ┌───────────┴────────┐ │      │
│         └──│  NextAuth (RBAC)   │←┘      │
│            └────────────────────┘        │
└────────────────────┬─────────────────────┘
                     │ Drizzle ORM
                     ▼
            ┌────────────────┐
            │  Neon Postgres │
            │  (serverless)  │
            └────────────────┘
```

---

## 4. Setup Progetto

### 4.1 Prerequisiti

- Node.js 20+
- pnpm 9+ (consigliato) o npm
- Account Neon (https://neon.tech)
- Account Vercel
- Git

### 4.2 Inizializzazione

```bash
# Crea il progetto
pnpm create next-app@latest gymtrack \
  --typescript --tailwind --app --src-dir=false \
  --import-alias "@/*"

cd gymtrack

# Installa dipendenze core
pnpm add drizzle-orm @neondatabase/serverless
pnpm add next-auth@beta @auth/drizzle-adapter
pnpm add zod react-hook-form @hookform/resolvers
pnpm add @tanstack/react-query zustand
pnpm add recharts date-fns
pnpm add lucide-react clsx tailwind-merge class-variance-authority
pnpm add @serwist/next serwist
pnpm add bcryptjs
pnpm add -D drizzle-kit @types/bcryptjs

# Setup shadcn/ui
pnpm dlx shadcn@latest init
```

### 4.3 Variabili d'Ambiente

Crea `.env.local`:

```env
# Database Neon
DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/gymtrack?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://user:password@ep-xxx.neon.tech/gymtrack?sslmode=require"

# NextAuth
AUTH_SECRET="<genera con: openssl rand -base64 32>"
AUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST="true"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4.4 Configurazione TypeScript

`tsconfig.json` (estensioni rilevanti):

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

---

## 5. Database (Neon Postgres)

### 5.1 Setup Neon

1. Crea progetto su https://neon.tech → ottieni `DATABASE_URL`
2. Crea un branch `dev` separato dal `main` per lo sviluppo locale
3. Il branching di Neon permette di avere DB isolati per ogni feature branch

### 5.2 Configurazione Drizzle

`drizzle.config.ts`:

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

`lib/db/index.ts`:

```typescript
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

### 5.3 Schema Database

`lib/db/schema.ts`:

```typescript
import {
  pgTable, uuid, text, integer, real, timestamp, boolean,
  pgEnum, primaryKey, index, jsonb
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============ ENUMS ============
export const userRoleEnum = pgEnum('user_role', ['admin', 'user']);
export const muscleGroupEnum = pgEnum('muscle_group', [
  'chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio'
]);
export const sessionStatusEnum = pgEnum('session_status', [
  'planned', 'in_progress', 'completed', 'skipped'
]);
export const fitnessGoalEnum = pgEnum('fitness_goal', [
  'mass', 'strength', 'definition', 'endurance'
]);

// ============ USERS ============
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: userRoleEnum('role').notNull().default('user'),

  // Profilo fitness
  age: integer('age'),
  heightCm: real('height_cm'),
  currentWeightKg: real('current_weight_kg'),
  targetWeightKg: real('target_weight_kg'),
  sex: text('sex'), // 'male' | 'female' | 'other'
  experienceLevel: text('experience_level'), // 'beginner' | 'intermediate' | 'advanced'
  fitnessGoal: fitnessGoalEnum('fitness_goal'),

  // Settings
  preferredUnit: text('preferred_unit').notNull().default('kg'), // 'kg' | 'lbs'
  theme: text('theme').notNull().default('dark'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  lastLoginAt: timestamp('last_login_at'),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  roleIdx: index('users_role_idx').on(table.role),
}));

// ============ EXERCISE TEMPLATES (catalogo) ============
// Esercizi predefiniti riutilizzabili (sia di sistema sia custom dell'utente)
export const exerciseTemplates = pgTable('exercise_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  // userId null = template di sistema (es. "Panca Piana")
  name: text('name').notNull(),
  muscleGroup: muscleGroupEnum('muscle_group').notNull(),
  notes: text('notes'),
  isSystem: boolean('is_system').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  userIdx: index('exercise_templates_user_idx').on(table.userId),
  nameIdx: index('exercise_templates_name_idx').on(table.name),
}));

// ============ WORKOUT PLANS ============
// Piano settimanale: associa giorni della settimana a workout
export const workoutPlans = pgTable('workout_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(), // es. "Push Day"
  dayOfWeek: integer('day_of_week').notNull(), // 0=Domenica ... 6=Sabato
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userDayIdx: index('workout_plans_user_day_idx').on(table.userId, table.dayOfWeek),
}));

// ============ PLANNED EXERCISES ============
// Esercizi nel piano: con serie, reps, peso, timer recovery
export const plannedExercises = pgTable('planned_exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  workoutPlanId: uuid('workout_plan_id').notNull()
    .references(() => workoutPlans.id, { onDelete: 'cascade' }),
  exerciseTemplateId: uuid('exercise_template_id').notNull()
    .references(() => exerciseTemplates.id),
  orderIndex: integer('order_index').notNull(), // ordine nell'allenamento

  plannedSets: integer('planned_sets').notNull(),       // es. 4
  plannedReps: integer('planned_reps').notNull(),       // es. 8 (fisso)
  plannedWeightKg: real('planned_weight_kg').notNull(), // es. 60

  // Timer recovery: default per esercizio + override per serie specifica
  defaultRestSeconds: integer('default_rest_seconds').notNull().default(90),
  // Override per serie: JSON tipo { "1-2": 60, "2-3": 90, "3-4": 120 }
  // Le chiavi sono "fromSet-toSet"
  restOverrides: jsonb('rest_overrides').$type<Record<string, number>>().default({}),

  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  planIdx: index('planned_exercises_plan_idx').on(table.workoutPlanId),
}));

// ============ WORKOUT SESSIONS ============
// Esecuzione effettiva (registrata live o manualmente)
export const workoutSessions = pgTable('workout_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  workoutPlanId: uuid('workout_plan_id').references(() => workoutPlans.id, { onDelete: 'set null' }),
  // workoutPlanId null se l'utente ha registrato un allenamento ad-hoc senza piano

  status: sessionStatusEnum('status').notNull().default('planned'),
  isManualEntry: boolean('is_manual_entry').notNull().default(false),
  // true = registrazione a posteriori, false = live tracking

  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  scheduledFor: timestamp('scheduled_for').notNull(), // data dell'allenamento

  totalVolumeKg: real('total_volume_kg'), // calcolato a fine sessione
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  userDateIdx: index('sessions_user_date_idx').on(table.userId, table.scheduledFor),
  statusIdx: index('sessions_status_idx').on(table.status),
}));

// ============ SET LOGS ============
// Singola serie eseguita (la granularità più fine)
export const setLogs = pgTable('set_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull()
    .references(() => workoutSessions.id, { onDelete: 'cascade' }),
  exerciseTemplateId: uuid('exercise_template_id').notNull()
    .references(() => exerciseTemplates.id),
  plannedExerciseId: uuid('planned_exercise_id')
    .references(() => plannedExercises.id, { onDelete: 'set null' }),

  setNumber: integer('set_number').notNull(), // 1, 2, 3...
  reps: integer('reps').notNull(),
  weightKg: real('weight_kg').notNull(),
  restSecondsActual: integer('rest_seconds_actual'), // recovery effettivo (solo live)
  isPersonalRecord: boolean('is_personal_record').notNull().default(false),

  completedAt: timestamp('completed_at').notNull().defaultNow(),
}, (table) => ({
  sessionIdx: index('set_logs_session_idx').on(table.sessionId),
  exerciseIdx: index('set_logs_exercise_idx').on(table.exerciseTemplateId),
}));

// ============ BODY MEASUREMENTS ============
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
}, (table) => ({
  userDateIdx: index('measurements_user_date_idx').on(table.userId, table.measuredAt),
}));

// ============ NEXTAUTH TABLES ============
// Generate via @auth/drizzle-adapter — vedi sezione Auth
// sessions, accounts, verification_tokens

// ============ RELATIONS ============
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
  plan: one(workoutPlans, {
    fields: [plannedExercises.workoutPlanId],
    references: [workoutPlans.id]
  }),
  template: one(exerciseTemplates, {
    fields: [plannedExercises.exerciseTemplateId],
    references: [exerciseTemplates.id]
  }),
}));

export const sessionsRelations = relations(workoutSessions, ({ one, many }) => ({
  user: one(users, { fields: [workoutSessions.userId], references: [users.id] }),
  plan: one(workoutPlans, {
    fields: [workoutSessions.workoutPlanId],
    references: [workoutPlans.id]
  }),
  setLogs: many(setLogs),
}));

export const setLogsRelations = relations(setLogs, ({ one }) => ({
  session: one(workoutSessions, {
    fields: [setLogs.sessionId],
    references: [workoutSessions.id]
  }),
  template: one(exerciseTemplates, {
    fields: [setLogs.exerciseTemplateId],
    references: [exerciseTemplates.id]
  }),
}));
```

### 5.4 Decisioni di Modellazione Chiave

**Perché separare `plannedExercises` e `setLogs`:**
- Il **piano** definisce l'intenzione (4 serie x 8 reps a 60kg)
- Il **log** registra la realtà (serie 1: 8 reps a 60kg; serie 2: 7 reps a 60kg; ecc.)
- Permette di confrontare programmato vs eseguito → statistiche di aderenza al piano

**Perché `restOverrides` come JSONB:**
- Schema flessibile per timer per-serie senza creare una tabella separata
- Query rare su questo campo → indicizzazione non necessaria
- Esempio: `{ "1-2": 60, "2-3": 90, "3-4": 120 }` = riposo crescente tra le serie

**Progressive overload su serie:**
- Nessun campo "next planned sets" automatico nel DB
- Il suggerimento "+1 serie" è **derivato in runtime** confrontando le ultime N sessioni completate con successo
- Se l'utente ha completato 3 sessioni consecutive raggiungendo le serie programmate → l'app suggerisce di aggiornare `plannedSets` a +1

**Personal Record (PR):**
- Calcolato al salvataggio di un `setLog`: si controlla se `weightKg * reps` (o solo `weightKg` per rep < 5) supera il massimo storico per quel `exerciseTemplateId`
- Flag `isPersonalRecord` settato a true → UI mostra confetti animation

### 5.5 Migrations

```bash
# Genera migration dallo schema
pnpm drizzle-kit generate

# Applica al DB
pnpm drizzle-kit migrate

# Studio per ispezione
pnpm drizzle-kit studio
```

### 5.6 Seed Data

Crea `lib/db/seed.ts` per popolare:
- Esercizi di sistema (`isSystem: true`, `userId: null`): Panca Piana, Squat, Stacco, Pulley, Curl Bilanciere, ecc.
- Un admin di default (email da .env)

---

## 6. Autenticazione e Autorizzazione

### 6.1 Setup NextAuth v5

`lib/auth/auth.ts`:

```typescript
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, parsed.data.email))
          .limit(1);

        if (!user) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        // Aggiorna last login
        await db
          .update(users)
          .set({ lastLoginAt: new Date() })
          .where(eq(users.id, user.id));

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'admin' | 'user';
      }
      return session;
    },
  },
});
```

### 6.2 Type Augmentation

`types/next-auth.d.ts`:

```typescript
import 'next-auth';

declare module 'next-auth' {
  interface User {
    role: 'admin' | 'user';
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: 'admin' | 'user';
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'admin' | 'user';
  }
}
```

### 6.3 Middleware (Protezione Route)

`middleware.ts`:

```typescript
import { auth } from '@/lib/auth/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const isPublicRoute = ['/login', '/register'].some(p => pathname.startsWith(p));
  const isAdminRoute = pathname.startsWith('/profile/admin');

  // Redirect a login se non autenticato
  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Redirect a home se loggato e prova ad accedere a /login
  if (isLoggedIn && isPublicRoute) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Solo admin su route /profile/admin
  if (isAdminRoute && req.auth?.user.role !== 'admin') {
    return NextResponse.redirect(new URL('/profile', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icons).*)'],
};
```

### 6.4 Helper RBAC

`lib/auth/permissions.ts`:

```typescript
import { auth } from './auth';
import { redirect } from 'next/navigation';

export async function requireAuth() {
  const session = await auth();
  if (!session) redirect('/login');
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== 'admin') redirect('/');
  return session;
}
```

### 6.5 Best Practice Sicurezza

| Pratica | Implementazione |
|---------|----------------|
| Password hashing | bcrypt con cost 12 |
| Session strategy | JWT (stateless, scala su edge) |
| CSRF | Gestito da NextAuth automaticamente |
| Rate limiting login | Upstash Rate Limit o similare su `/api/auth/*` |
| Input validation | Zod su ogni endpoint |
| SQL injection | Drizzle usa prepared statements |
| Secrets | Solo via env, mai hardcoded |

---

## 7. API Routes e Server Actions

### 7.1 Strategia

- **Server Actions** per mutation invocate dal client (form submission, salvataggio)
- **API Routes** per fetching su client component (TanStack Query) e per integrazioni future
- **Server Components** per fetch iniziale (SSR, no waterfall)

### 7.2 Esempio Server Action

`app/(app)/workout/actions.ts`:

```typescript
'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { workoutSessions, setLogs } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth/permissions';
import { revalidatePath } from 'next/cache';

const setLogSchema = z.object({
  sessionId: z.string().uuid(),
  exerciseTemplateId: z.string().uuid(),
  plannedExerciseId: z.string().uuid().nullable(),
  setNumber: z.number().int().min(1).max(20),
  reps: z.number().int().min(1).max(100),
  weightKg: z.number().min(0).max(500),
  restSecondsActual: z.number().int().nullable(),
});

export async function logSet(input: z.infer<typeof setLogSchema>) {
  const session = await requireAuth();
  const data = setLogSchema.parse(input);

  // Verifica che la session appartenga all'utente
  const [sessionRecord] = await db
    .select()
    .from(workoutSessions)
    .where(eq(workoutSessions.id, data.sessionId))
    .limit(1);

  if (!sessionRecord || sessionRecord.userId !== session.user.id) {
    throw new Error('Forbidden');
  }

  // Check PR
  const isPR = await checkPersonalRecord(
    session.user.id,
    data.exerciseTemplateId,
    data.weightKg,
    data.reps
  );

  const [inserted] = await db.insert(setLogs).values({
    ...data,
    isPersonalRecord: isPR,
  }).returning();

  revalidatePath('/workout');
  revalidatePath('/stats');

  return { setLog: inserted, isPR };
}
```

### 7.3 API Route Esempio

`app/api/stats/exercise-progression/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { setLogs, workoutSessions } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth/permissions';
import { eq, and, gte, desc } from 'drizzle-orm';
import { z } from 'zod';

const querySchema = z.object({
  exerciseId: z.string().uuid(),
  from: z.string().datetime().optional(),
  metric: z.enum(['weight', 'volume', 'sets']).default('weight'),
});

export async function GET(req: Request) {
  const session = await requireAuth();
  const url = new URL(req.url);
  const params = querySchema.parse({
    exerciseId: url.searchParams.get('exerciseId'),
    from: url.searchParams.get('from') ?? undefined,
    metric: url.searchParams.get('metric') ?? undefined,
  });

  const logs = await db
    .select({
      date: workoutSessions.scheduledFor,
      weightKg: setLogs.weightKg,
      reps: setLogs.reps,
      isPR: setLogs.isPersonalRecord,
    })
    .from(setLogs)
    .innerJoin(workoutSessions, eq(setLogs.sessionId, workoutSessions.id))
    .where(and(
      eq(workoutSessions.userId, session.user.id),
      eq(setLogs.exerciseTemplateId, params.exerciseId),
      params.from ? gte(workoutSessions.scheduledFor, new Date(params.from)) : undefined,
    ))
    .orderBy(desc(workoutSessions.scheduledFor));

  // Aggregazione per data (OHLC-style)
  const grouped = aggregateForCandlestick(logs);

  return NextResponse.json({ data: grouped });
}
```

### 7.4 Endpoint Principali

| Route | Metodo | Scopo | Auth |
|-------|--------|-------|------|
| `/api/workouts/plans` | GET | Lista piani settimanali utente | user |
| `/api/workouts/plans` | POST | Crea nuovo piano | user |
| `/api/workouts/plans/[id]` | PUT/DELETE | Modifica/elimina piano | user |
| `/api/workouts/sessions` | POST | Avvia nuova sessione (live o manual) | user |
| `/api/workouts/sessions/[id]/sets` | POST | Logga una serie | user |
| `/api/workouts/sessions/[id]/complete` | POST | Chiudi sessione | user |
| `/api/exercises/templates` | GET | Lista esercizi (sistema + utente) | user |
| `/api/exercises/templates` | POST | Crea esercizio custom | user |
| `/api/stats/dashboard` | GET | Aggregati per home | user |
| `/api/stats/exercise-progression` | GET | Dati grafico singolo esercizio | user |
| `/api/stats/heatmap` | GET | Heatmap frequenza | user |
| `/api/stats/body-weight` | GET | Trend peso corporeo | user |
| `/api/admin/users` | GET | Lista utenti | admin |
| `/api/admin/users` | POST | Crea utente | admin |
| `/api/admin/users/[id]` | DELETE | Elimina utente | admin |

---

## 8. Frontend e PWA

### 8.1 Configurazione PWA

`app/manifest.ts`:

```typescript
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GymTrack',
    short_name: 'GymTrack',
    description: 'Tracking allenamenti palestra',
    start_url: '/',
    display: 'standalone',
    background_color: '#0A0F0A',
    theme_color: '#A3E635',
    orientation: 'portrait',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
```

### 8.2 Service Worker con Serwist

`next.config.mjs`:

```javascript
import withSerwistInit from '@serwist/next';

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
});

export default withSerwist({
  reactStrictMode: true,
});
```

`app/sw.ts`:

```typescript
import { defaultCache } from '@serwist/next/worker';
import { Serwist } from 'serwist';

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
```

### 8.3 Bottom Navigation "Landing Style"

`components/nav/BottomNav.tsx`:

```tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Dumbbell, BarChart3, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/workout', icon: Dumbbell, label: 'Workout' },
  { href: '/stats', icon: BarChart3, label: 'Stats' },
  { href: '/profile', icon: User, label: 'Profilo' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className={cn(
        'flex gap-2 px-3 py-2 rounded-3xl',
        'bg-zinc-900/70 backdrop-blur-xl',
        'border border-lime-400/15',
        'shadow-[0_0_40px_rgba(163,230,53,0.15)]'
      )}>
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = pathname === href ||
            (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex flex-col items-center justify-center',
                'min-w-[64px] h-12 px-3 rounded-2xl transition-all duration-300',
                active && [
                  'bg-gradient-to-br from-lime-400 to-lime-600',
                  'shadow-[0_0_20px_rgba(163,230,53,0.5)]',
                  '-translate-y-1'
                ]
              )}
            >
              <Icon className={cn(
                'w-5 h-5 transition-all',
                active ? 'text-zinc-950' : 'text-zinc-400'
              )} />
              {active && (
                <span className="text-[10px] font-bold text-zinc-950 mt-0.5">
                  {label}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

### 8.4 Pattern Componenti Chiave

**LiveTracker** (`components/workout/LiveTracker.tsx`):
- Usa Zustand per state della sessione live (resiste a refresh accidentale via `persist` middleware)
- Hook `useTimer` custom per countdown serie
- Pulsanti grandi (h-14 minimo) per accessibilità con dita
- Web Audio API + Vibration API alla fine del timer

**RestTimer** (`components/workout/RestTimer.tsx`):
- Cerchio SVG animato con `stroke-dashoffset`
- Permette modifica al volo del tempo (+15s, -15s, +30s)
- Salta riposo (button)
- Persiste su `localStorage` per resistere a chiusura PWA

**ExerciseChart** (`components/stats/ExerciseChart.tsx`):
- Recharts `AreaChart` con `ComposedChart` se mostriamo overlay (peso + volume)
- Gradiente lime sotto l'area
- Tooltip custom con dettaglio serie

### 8.5 State Management

**Zustand** per la sessione live (deve sopravvivere a refresh):

```typescript
// stores/workoutStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LiveSession {
  sessionId: string | null;
  currentExerciseIndex: number;
  currentSet: number;
  completedSets: Array<{ exerciseId: string; setNumber: number; reps: number; weight: number }>;
  startedAt: string | null;
}

export const useWorkoutStore = create<LiveSession & Actions>()(
  persist(
    (set) => ({
      sessionId: null,
      currentExerciseIndex: 0,
      currentSet: 1,
      completedSets: [],
      startedAt: null,
      // ... actions
    }),
    { name: 'gymtrack-live-session' }
  )
);
```

**TanStack Query** per data fetching (cache + revalidation):

```typescript
// hooks/useStats.ts
import { useQuery } from '@tanstack/react-query';

export function useExerciseProgression(exerciseId: string, period: string) {
  return useQuery({
    queryKey: ['exercise-progression', exerciseId, period],
    queryFn: () => fetch(`/api/stats/exercise-progression?exerciseId=${exerciseId}&from=${period}`)
      .then(r => r.json()),
    staleTime: 5 * 60 * 1000, // 5 min
  });
}
```

---

## 9. Logica di Business Chiave

### 9.1 Calcolo Performance Score (Home)

Algoritmo per il rating 0-100 mostrato in home:

```
Inputs (ultimi 7 giorni):
- completionRate: sessioni completate / sessioni pianificate
- volumeDelta: variazione % volume vs settimana precedente
- streakBonus: giorni consecutivi di workout (capped a 14)
- prBonus: numero di PR ottenuti

Score = (
  completionRate * 40 +
  clamp(volumeDelta, -20, 20) + 50 * (volumeDelta > 0 ? 1 : 0.5) * 0.3 +
  (streakBonus / 14) * 20 +
  min(prBonus, 5) * 2
) * adjustmentFactor

Clamp a [0, 100]
```

Etichette:
- 0-30: "Riparti con calma 💪"
- 31-60: "Stai costruendo 🔨"
- 61-85: "Continua così 🚀"
- 86-100: "Stai spaccando 🔥"

### 9.2 Suggerimento Aumento Serie

```
trigger: l'utente apre il dettaglio di un esercizio nel piano

logica:
- Recupera ultime 3 sessioni che includevano questo esercizio
- Per ognuna, verifica se l'utente ha completato TUTTE le serie pianificate
- Se 3/3 successi consecutivi → mostra suggerimento "+1 serie"
- L'utente conferma con un tap → aggiorna plannedSets nel piano
```

### 9.3 Detection Personal Record

```
ad ogni setLog inserito:
- Recupera max(weightKg) storico per quel exerciseTemplateId
- Se weightKg > max → PR
- Se weightKg === max ma reps > max_reps_at_that_weight → PR
- Setta isPersonalRecord = true → UI triggera animazione confetti
```

### 9.4 Timer di Recovery con Override

```
Quando l'utente completa la serie N e sta per iniziare la N+1:

1. Cerca in restOverrides la chiave `${N}-${N+1}`
2. Se trovata → usa quel valore
3. Altrimenti → usa defaultRestSeconds
4. Avvia countdown
5. Permetti modifica live (+15s, +30s, skip)
6. Salva restSecondsActual nel setLog per analytics future
```

### 9.5 Aggregazione Grafici Stile Finanziario

Per il grafico candlestick per esercizio, per ogni periodo (settimana):

```
- open: peso medio prima serie della prima sessione del periodo
- close: peso medio ultima serie ultima sessione del periodo
- high: max peso del periodo
- low: min peso del periodo
- volume: somma (reps * weight) del periodo
```

---

## 10. Deploy su Vercel

### 10.1 Setup

1. Push del repo su GitHub
2. Import progetto su Vercel
3. Collega Neon via integration ufficiale Vercel → variabili `DATABASE_URL` impostate automaticamente
4. Aggiungi env: `AUTH_SECRET`, `AUTH_TRUST_HOST=true`
5. Vercel rileva Next.js → deploy automatico

### 10.2 Configurazione Edge

Le route che non usano `bcrypt` possono girare su Edge Runtime per ridurre cold start:

```typescript
// In API route:
export const runtime = 'edge';
```

⚠️ NextAuth con Credentials Provider **non** può girare su Edge (bcrypt richiede Node). Tieni `/api/auth/*` su Node runtime (default).

### 10.3 Preview Branches

Neon + Vercel: ogni PR ottiene un branch DB separato → preview deployment con dati isolati.

---

## 11. Fasi di Implementazione

### Fase 1: Foundation (3-4 giorni)
- Setup progetto Next.js + TypeScript + Tailwind
- Configurazione Drizzle + Neon
- Schema DB + migrations
- Seed esercizi di sistema
- Setup NextAuth + login/register pages
- Middleware auth
- Bottom navigation "landing style"

### Fase 2: Workout Planner (4-5 giorni)
- CRUD piani settimanali
- CRUD esercizi pianificati con timer recovery + override
- Vista settimanale (selettore giorni)
- Vista dettaglio giorno
- Form creazione/modifica esercizio
- Logica suggerimento +1 serie

### Fase 3: Live Tracking + Manual Entry (4-5 giorni)
- Sessione live: store Zustand persistito
- Componente RestTimer con countdown SVG
- Logging set in real time + detection PR
- Modalità registrazione manuale con date retroattive
- Notifiche/vibrazione timer

### Fase 4: Home Dashboard (2-3 giorni)
- Performance Score circolare animato
- Card riassuntive (volume, sessioni, PR, peso)
- Card "prossimo allenamento"
- Sparkline andamento settimanale

### Fase 5: Statistiche (3-4 giorni)
- Grafico progressione esercizio (Recharts area + candlestick custom)
- Heatmap frequenza tipo GitHub
- Grafico peso corporeo
- Card aggregati periodo
- Lista PR

### Fase 6: Profilo + Admin (3-4 giorni)
- Form dati personali
- Storico misurazioni corporee
- Settings (unit, theme, notifiche)
- Vista admin: lista utenti + search/filter
- Aggiunta/eliminazione utenti

### Fase 7: PWA + Polish (2-3 giorni)
- Manifest + icone (vari size)
- Service worker con Serwist
- Splash screen
- Skeleton loading
- Empty/error states
- Micro-animazioni (confetti PR, transizioni)

### Fase 8: Testing + Deploy (2 giorni)
- Test E2E flussi principali (Playwright)
- Deploy Vercel + collegamento Neon
- QA mobile su device reali

**Stima Totale: 23-30 giorni lavorativi**

---

## 12. Checklist Pre-Produzione

### Sicurezza
- [ ] Tutte le route protette via middleware
- [ ] Validazione Zod su ogni input lato server
- [ ] Password hashate con bcrypt cost 12+
- [ ] Rate limiting su login/register
- [ ] `AUTH_SECRET` generato e ruotato in produzione
- [ ] CORS configurato correttamente
- [ ] CSP headers in `next.config.mjs`

### Performance
- [ ] Server Components dove possibile
- [ ] Immagini ottimizzate via `next/image`
- [ ] Font self-hosted o `next/font`
- [ ] Bundle analyzer eseguito (no librerie inutili)
- [ ] TanStack Query con `staleTime` adeguati
- [ ] DB indexes su query frequenti (presenti nello schema)

### UX Mobile
- [ ] Touch target ≥ 44x44px
- [ ] Bottom nav sempre raggiungibile dal pollice
- [ ] Form usano `inputmode` e `autocomplete` corretti
- [ ] No layout shift al caricamento
- [ ] Skeleton screen ovunque ci sia loading
- [ ] Offline graceful degradation

### PWA
- [ ] Lighthouse PWA score ≥ 90
- [ ] Manifest valido
- [ ] Icone tutte le size (192, 512, maskable)
- [ ] Service worker attivo
- [ ] Installabile su iOS e Android
- [ ] Splash screen funzionante

### Data Integrity
- [ ] Cascade delete configurate correttamente
- [ ] Backup automatici Neon attivi
- [ ] Migration testate su branch staging
- [ ] Seed riproducibile

### Monitoring
- [ ] Vercel Analytics attivo
- [ ] Sentry o equivalente per errori
- [ ] Log strutturati su server actions critiche

---

## Note Finali

Questa documentazione è il punto di partenza. Lo sviluppo procederà in modo incrementale: ogni fase deve concludersi con un deploy funzionante su Vercel preview, in modo da testare su device reali fin da subito.

Il file `DESIGN_PROMPT.md` (separato) contiene il prompt da passare a `claude code design` per generare l'implementazione frontend a partire dal design già fornito.

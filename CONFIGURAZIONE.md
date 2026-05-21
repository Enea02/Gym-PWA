# GymTrack — Guida alla Configurazione

Tutto il codice è pronto in `gymtrack/`. Devi completare solo questi passaggi per far girare l'app.

---

## 1. Database Neon (OBBLIGATORIO)

1. Vai su **https://neon.tech** → crea account gratuito
2. Crea un nuovo progetto (es. "gymtrack")
3. Copia la **Connection string** → ti servono due varianti:
   - **Pooled** (per le query normali): `postgresql://user:pass@ep-xxx-yyy.eu-central-1.aws.neon.tech/neondb?sslmode=require`
   - **Direct** (per le migration): uguale ma senza pooling

---

## 2. File `.env.local`

Crea il file `gymtrack/.env.local` con questo contenuto:

```env
# Database Neon — copia dalla dashboard Neon
DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/gymtrack?sslmode=require"

# NextAuth — genera con: openssl rand -base64 32
AUTH_SECRET="GENERA_QUESTO_CON_OPENSSL"

# URL dell'app in sviluppo
AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Admin default (per il seed)
ADMIN_EMAIL="admin@gymtrack.app"
ADMIN_PASSWORD="Admin123!"
```

Per generare `AUTH_SECRET` apri il terminale e digita:
```bash
openssl rand -base64 32
```

---

## 3. Avvia il progetto in sviluppo

```bash
cd gymtrack

# Installa dipendenze (se non già fatto)
npm install

# Avvia in dev
npm run dev
```

Apri **http://localhost:3000**

---

## 4. Setup Database (prima volta)

Con il server acceso e `DATABASE_URL` configurato:

```bash
cd gymtrack

# Genera e applica le migration
npx drizzle-kit generate
npx drizzle-kit migrate

# Popola esercizi di sistema + admin default
npx tsx lib/db/seed.ts
```

Dopo il seed puoi fare login con:
- **Email:** `admin@gymtrack.app`
- **Password:** `Admin123!`

---

## 5. Icone PWA (per installazione su mobile)

Crea queste due immagini e mettile in `gymtrack/public/icons/`:
- `icon-192.png` (192×192 px)
- `icon-512.png` (512×512 px)

Suggerimento: usa il logo barbell (SVG → PNG) con sfondo verde lime `#A3E635`.

Per generarle rapidamente puoi usare https://realfavicongenerator.net

---

## 6. Deploy su Vercel (opzionale, per produzione)

1. Push su GitHub:
   ```bash
   git add -A
   git commit -m "Initial GymTrack implementation"
   git push
   ```

2. Vai su **https://vercel.com** → importa il repository
3. Imposta la **Root Directory** su `gymtrack`
4. Collega Neon tramite l'integrazione ufficiale Vercel (imposta `DATABASE_URL` automaticamente)
5. Aggiungi le altre env var: `AUTH_SECRET`, `AUTH_URL` (usa l'URL Vercel), `NEXT_PUBLIC_APP_URL`
6. Deploya

---

## 7. Struttura del progetto

```
gymtrack/
├── app/
│   ├── page.tsx              ← Home/Dashboard
│   ├── (auth)/               ← Login + Register
│   ├── (app)/                ← App autenticata (BottomNav)
│   │   ├── workout/          ← Allenamenti
│   │   ├── stats/            ← Statistiche
│   │   └── profile/          ← Profilo + Admin
│   └── api/                  ← Backend API routes
├── lib/
│   ├── db/schema.ts          ← Schema Drizzle (PostgreSQL)
│   ├── auth/auth.ts          ← NextAuth v5 JWT
│   └── validations/          ← Zod schemas
├── components/               ← UI components
├── stores/workoutStore.ts    ← Zustand (sessione live)
└── hooks/                    ← TanStack Query + timer
```

---

## 8. Nota sull'architettura

- **Frontend:** Demo data hardcoded nelle pagine (visibili subito anche senza DB)
- **Backend:** API routes pronte a `/api/*`, connesse a Neon una volta impostato `DATABASE_URL`
- **Auth:** JWT con NextAuth v5 — login/register funzionanti dopo il seed
- **Live tracking:** Persistito in localStorage via Zustand
- **PWA:** Manifest configurato, icone da aggiungere manualmente (vedi step 5)

---

## Problemi frequenti

| Problema | Soluzione |
|----------|-----------|
| `DATABASE_URL not set` | Crea `.env.local` con la stringa Neon |
| `AUTH_SECRET not set` | Genera con `openssl rand -base64 32` |
| Login non funziona | Esegui `npx tsx lib/db/seed.ts` per creare l'admin |
| Migration fallisce | Verifica che `DATABASE_URL` punti al DB Neon direct (non pooled) |
| Build fallisce | Controlla che tutte le env var siano impostate |

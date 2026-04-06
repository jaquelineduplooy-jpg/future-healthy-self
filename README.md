# Future Healthy Self

Wellness meal planner, exercise tracker & health dashboard.
Built with **Next.js 14 · Tailwind CSS · Supabase · TypeScript**.

---

## Quick start

### 1 — Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/future-healthy-self.git
cd future-healthy-self
npm install
```

### 2 — Environment variables

```bash
cp .env.example .env.local
```

The app runs **out of the box with mock data** — no Supabase needed yet:

```env
NEXT_PUBLIC_USE_MOCK_DATA=true
```

Open `.env.local` and fill in the keys you have. Everything works without them — mock mode falls back gracefully.

### 3 — Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app auto-redirects to `/planner`.

### 4 — Install as PWA on your phone

1. Open `http://YOUR_IP:3000` in **Safari (iPhone)** or **Chrome (Android)**
2. **Share → Add to Home Screen** (Safari) or **menu → Add to Home screen** (Chrome)
3. App installs with berry pink theme, works offline for logging

---

## Push to GitHub

If you received this as a ZIP, push it to GitHub in 3 commands:

```bash
# 1. Initialise git (if not already a repo)
git init
git add .
git commit -m "feat: initial PWA build — all 7 screens wired to data layer"

# 2. Create a new repo on GitHub (github.com → New repository)
#    Name it: future-healthy-self
#    Leave it empty (no README, no .gitignore)

# 3. Push
git remote add origin https://github.com/YOUR_USERNAME/future-healthy-self.git
git branch -M main
git push -u origin main
```

Then connect to **Vercel** for production or **Replit** for dev previews.

---

## Connect Supabase (when ready)

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL Editor
3. Update `.env.local`:
   ```env
   NEXT_PUBLIC_USE_MOCK_DATA=false
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Restart the dev server — all screens now read/write real data

**That's the only change needed.** The data layer (`lib/data.ts`) handles the switch automatically.

---

## Project structure

```
future-healthy-self/
├── app/
│   ├── layout.tsx              Root layout — AuthProvider, PWA meta, BottomNav
│   ├── globals.css             Tailwind + all 10 brand CSS tokens
│   ├── page.tsx                Redirects / → /planner
│   ├── planner/page.tsx        S1: Weekly meal planner (wired to data layer)
│   ├── shopping/page.tsx       S2: Shopping list with live people scaling
│   ├── tracker/page.tsx        S3: Daily food + water + mood (persists to DB)
│   ├── dashboard/page.tsx      S4: Progress dashboard with Recharts charts
│   ├── exercise/page.tsx       S5: Exercise tracker — mark done persists
│   ├── calendar/page.tsx       S6: Calendar + Google Calendar export modal
│   ├── ocr/page.tsx            S7: OCR recipe import — calls /api/ocr-import
│   └── api/
│       ├── ocr-import/route.ts     Google Vision + GPT-4o parsing pipeline
│       ├── auth/google/route.ts    Initiate Google OAuth
│       ├── auth/google/callback/   OAuth callback + token storage
│       └── calendar/sync/route.ts  Push to GCal or generate .ics
├── components/
│   └── layout/
│       ├── BottomNav.tsx       5-tab bottom navigation
│       └── PWARegister.tsx     Service worker registration
├── lib/
│   ├── data.ts                 ★ Single data access layer (mock ↔ Supabase switch)
│   ├── mock-data.ts            All mock data seeded from Recipe Database V1
│   ├── auth.tsx                Auth context (mock mode + real Supabase)
│   ├── supabase.ts             Browser client
│   ├── supabase-server.ts      Server client (Server Components + API routes)
│   ├── units.ts                Unit normalisation + fraction/range parser
│   └── gcal.ts                 Google Calendar push + .ics generator
├── types/
│   └── database.ts             TypeScript types for all 8 DB tables
├── public/
│   ├── manifest.json           PWA manifest
│   └── sw.js                   Service worker (offline caching)
├── supabase/
│   └── schema.sql              8 tables + Row Level Security policies
└── .env.example                All environment variables documented
```

---

## Screens

| Route | Screen | Data | Status |
|-------|--------|------|--------|
| `/planner` | Weekly meal planner | `meal_plans` + `recipes` | ✅ Wired |
| `/shopping` | Shopping list | `ingredients` + scaling | ✅ Wired |
| `/tracker` | Daily tracker | `daily_logs` + `health_logs` | ✅ Wired |
| `/dashboard` | Progress dashboard | `health_logs` + Recharts | ✅ Wired |
| `/exercise` | Exercise tracker | `workouts` | ✅ Wired |
| `/calendar` | Calendar + GCal export | `workouts` + `.ics` API | ✅ Wired |
| `/ocr` | OCR recipe import | `/api/ocr-import` | ✅ Wired |

---

## Brand colour tokens

| Token | Hex | Usage |
|-------|-----|-------|
| `--berry` | `#A72677` | Primary brand, status bar, CTAs |
| `--orange` | `#FF9759` | Main dishes, OCR upload |
| `--mint-dark` | `#3a9e7a` | Done states, checkboxes, water |
| `--olive` | `#BAC35A` | Side dishes, calorie bar |
| `--gold` | `#FBCE1D` | Progress fills, planned states |

---

## What's next (Phase 2)

- [ ] Auth screens — login/signup UI using Supabase Auth
- [ ] Seed script — import all 114 recipes from Recipe Database V1 xlsx
- [ ] Macro enrichment — USDA FoodData Central API
- [ ] Google Calendar live sync (two-way, OAuth tokens in Supabase)
- [ ] Measurement logging screen
- [ ] Weekly PDF report export
- [ ] React Native (Expo) mobile app

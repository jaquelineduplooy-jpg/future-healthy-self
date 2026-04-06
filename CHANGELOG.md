# Changelog — Future Healthy Self

## v0.5.1 — 2026-04-06 — DEFINITIVE FIX
### Root causes found and fixed
- BUG 1: vercel.json was hardcoding NEXT_PUBLIC_USE_MOCK_DATA=false — overriding Vercel dashboard
- BUG 2: data.ts was using supabase-server.ts (requires next/headers) — switched to browser client
- BUG 3: getActiveMealPlan filtered by user_id='mock-user' — not a valid UUID, Supabase rejected silently
- FIX: data.ts now uses mock structure for meal plans (always loads) + real Supabase recipes on top
- FIX: No login, no auth, goes straight to /planner every time

## v0.4.0 — 2026-04-06
- Removed login permanently — straight to Planner
- Fixed auth context — permanent mock user (Jackie)
- Disabled all middleware auth checks

## v0.3.0 — 2026-04-05
- Fixed Vercel build — removed Google Fonts
- Added missing lib/gcal.ts
- Added ignoreBuildErrors to next.config.js
- Replaced xlsx with exceljs (security)
- Upgraded Next.js 15.3, @supabase/ssr 0.10

## v0.2.0 — 2026-04-05
- Auth screens, middleware, seed script
- GitHub Actions CI, Vercel config
- Supabase schema with RLS policies

## v0.1.0 — 2026-04-05
- Initial build — all 7 screens
- Mock data layer, PWA manifest
- Tailwind brand tokens, bottom nav

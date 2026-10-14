# Architecture

## Stack

Expo SDK 57, React 19.2, React Native 0.86, expo-router, expo-sqlite,
TypeScript (strict `tsc --noEmit`), Android-only build.

## Structure

- `app/` — routes: `_layout.tsx` (DB init, providers, onboarding gate),
  `onboarding.tsx`, `add-food.tsx`, `recipe-editor.tsx`, `(tabs)/` six tabs.
- `src/context/` — `AppContext` (settings + i18n), `GamificationContext`
  (XP, badges, celebrations).
- `src/lib/` — `db` (schema, seed), `nutrition` (scaling, parsing,
  `estimateGoals`), `search` (accent-insensitive food filter), `planner`,
  `foodProviders` (Open Food Facts), `foodPrices`, `recipePrices`,
  `groceries`, `activity`, `healthSync`, `habits`, `opponents`, `i18n`, `diets`.
- `src/components/`, `src/ui/` — cards, rings, bars, sheets, badges.
- `src/data/` — seed foods, diet defaults, opponents/badges.
- `src/theme.ts` — color, gradient, radius, shared styles. The palette and
  the shared stylesheet resolve per appearance (`ThemeContext`, default
  light) via `useAppTheme()`; screens keep the same `colors`/`styles` names.

## Database

SQLite `daily-plate.db` via `SQLiteProvider`. Schema-only `onInit` with a
15 s timeout and error boundary; bulk food seed runs once in the background
after first paint. Seed *food* nutrition refreshes on a `SEED_VERSION` bump
(tracked in `sync_state`); seed recipes are never rewritten so saved plans
keep their reviewed totals. Key tables: `settings`, `foods`, `recipes`,
`diary_entries`, `plans`, `groceries`, `weights`, `water_entries`,
`workouts`, `xp_events`, `badges`, `sync_state`.

## Tests

`node --test scripts/*.test.mjs`: food-provider mapping, i18n key parity
(EN/EL), search behavior, nutrition estimates. Typecheck with
`node ./node_modules/typescript/bin/tsc --noEmit`.

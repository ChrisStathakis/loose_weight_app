# Settings and data

Route: `app/(tabs)/settings.tsx`. State: `src/context/AppContext.tsx`.

## Profile and goals

- Language (EN/EL), appearance (system / light / dark), height, weight, target weight, birth date (with age display).
- Daily calorie / protein / carbs / fat goals, eating style, excluded
  ingredients.
- A suggested-goals box (`estimateGoals()` in `src/lib/nutrition.ts`) appears
  when height, weight, and age are valid: Mifflin-St Jeor average, light
  activity, moderate deficit, clamped to 1400–3500 kcal. **Use suggested**
  fills the four goal fields.
- Inputs resync when settings change elsewhere (e.g. after a restore).
- Saving also writes today's weight into `weights`.

## Reminders

- An evening log reminder (daily 8 PM local notification, no server).
- The toggle requests permission on enable; blocked permissions and builds
  without the notifications module show guidance instead of failing.
- Requires a dev build with the `expo-notifications` plugin followed by
  `expo prebuild` / `expo run:android` — Expo Go cannot schedule it.

## Data tools

- **Export**: dumps all tables to a timestamped JSON backup and shares it.
- **Import**: restores a backup after a destructive-warning confirm, then
  refreshes settings. Tables: `settings`, `foods`, `recipes`,
  `diary_entries`, `plans`, `groceries`, `weights`, `water_entries`,
  `xp_events`, `badges`, `opponent_progress`, `workouts`, `sync_state`.
- Everything is local SQLite; there is no account or server sync.

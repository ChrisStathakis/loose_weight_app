# Activity

Route: `app/(tabs)/activity.tsx`. Estimates: `src/lib/activity.ts`.
Sync: `src/lib/healthSync.ts`.

## Manual logging

- Quick-start chips prefill common sessions (Walk 30, Run 20, Strength 45,
  Yoga 30); type, minutes, and body weight can then be adjusted.
- Calories default to `estimateForWorkout()`; an override field accepts a
  watch or machine value.
- The hero shows burned-today, burned-this-week, and active days / 7.
- Deleting a workout asks for confirmation.

## Watch sync

- The watch card explains the Redmi path: watch → Mi Fitness → Health Connect
  → Daily Plate, with a **Sync now** button and last-sync timestamp.
- Requires an Android dev build with Health Connect installed; Expo Go shows
  the not-available state.
- Synced rows carry `source='health-connect'`, an `external_id` for dedupe,
  and optional steps / distance. One XP award and one banner per sync.

Full spike notes: [Health Connect spike](health-connect-spike.md).
On-device steps: [Phone handoff](phone-handoff.md).

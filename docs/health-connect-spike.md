# Health Connect Spike Plan — Redmi Auto-Sync

Status: **planned, not implemented**. Manual workout logging + net calories are done;
this doc covers the automatic smartwatch sync follow-up.

Locked scope: **dev build (`expo run:android`), sync all
(sessions + calories + steps/distance), manual "Sync now" button**,
verified later on the PC with the physical phone. Android watches only
(Redmi/Xiaomi priority), no iOS.

## 1. Library choice (verified 2026-09-12)

* Use **`react-native-health-connect` v4+** only. Its config plugin + Expo
  module ship inside the package.
* Do **not** install the old `expo-health-connect` — it is deprecated/archived,
  and leaving both installed breaks the Android build with a duplicate
  `HealthConnectPackage` class.
* Google Fit APIs are deprecated (end of 2026), so Health Connect is the
  correct and only path.

## 2. Redmi data path (confirmed)

Redmi Watch → **Mi Fitness app** → **Health Connect** → our app.
No Xiaomi SDK needed. User-side setup (one time, on the phone):

1. Pair the watch in the Mi Fitness app.
2. Mi Fitness → Settings → Health Connect → enable sharing
   (exercise, calories, steps, distance).
3. Android Health Connect → App permissions → allow Mi Fitness.
4. Daily Plate reads from Health Connect.

The Activity tab's watch card already explains this flow.

## 3. Build / config changes (other PC, with phone)

1. `npx expo install react-native-health-connect`
   (+ `expo-build-properties` if an SDK bump is required — verify
   `compileSdk`/`targetSdk` against the lib's requirement;
   project is Expo 57 / RN 0.86 / newArch enabled, and `android/` exists).
2. `app.json`: add `"react-native-health-connect"` to `plugins`;
   confirm `minSdkVersion >= 26`.
3. Rebuild native code (`npx expo prebuild --clean` or `expo run:android`).
   **Expo Go stops working from this point** — use the dev build for testing.
4. Runtime check with the lib's availability API: on Android < 14 prompt to
   install Health Connect from the Play Store.

## 4. Sync implementation (spike)

* New `src/lib/healthSync.ts`:
  `initialize()` → `requestPermission()` for read `ExerciseSession`,
  `TotalCaloriesBurned`, `Steps`, `Distance` → read sessions in range →
  per session read calories/steps/distance in its time window.
* **Type mapping**: Health Connect returns a numeric `exerciseType` per
  session — map it onto our 14 `WorkoutType`s (verify the numeric constants
  against the Health Connect docs during implementation;
  default unknown → `other`).
* **DB**: workouts table needs two new nullable columns —
  `steps INTEGER`, `distance_m REAL` — via additive migration (same pattern
  as before). Insert with `source='health-connect'`,
  `external_id=<Health Connect record id>`; the existing unique index on
  `external_id` already dedupes re-syncs, and manual rows are never touched.
* Calories: prefer the session's `TotalCaloriesBurned` value; fall back to
  our MET estimate only if Health Connect reports none.
* **UI** (Activity tab): replace the static watch card with a "Sync now"
  button + last-sync timestamp, permission-denied and
  Health-Connect-missing states with guidance, and ⌚ badges on synced rows
  (already rendered).
* Gamification: reuse `addXp('workout-log')` per imported session
  (cap celebration to one banner per sync).

## 5. Verification (on the phone PC)

1. Dev build installs and old screens still work (`tsc --noEmit` first).
2. Log a workout on the Redmi → open Mi Fitness → confirm it appears →
   Health Connect → confirm Mi Fitness data visible.
3. In our app: Sync now → session appears with matching
   minutes/calories/steps, `source='health-connect'`.
4. Sync twice → no duplicates (`external_id` dedupe). Delete a synced row →
   define re-sync behavior during spike (recommendation: re-imports;
   user deletes again).
5. Backup/restore still round-trips the new `steps`/`distance_m` columns.

## 6. Known caveats

* Play Store release later requires a **Health data access declaration**
  for these permissions — sideloaded dev builds are unaffected.
* Background auto-sync is out of scope; manual button only.

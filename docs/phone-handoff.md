# Phone-PC Handoff — Health Connect Dev Build + Verification

This machine (no phone) implemented the Health Connect spike. This PC (with the
physical Redmi phone + watch) does the native rebuild and on-device verification.
Target commit: the `Health Connect spike` commit on top of `beb16a7`.

## 0. Prerequisites (phone PC)

- Node 22.13+, npm 10/11, JDK 17, Android SDK with compileSdk 36 / targetSdk 36
  (Expo SDK 57 defaults), platform-tools (`adb`) with USB debugging authorized.
- Physical Redmi/Xiaomi phone + watch paired in the Mi Fitness app.
- Pull latest `main` (or the spike branch) — must include the spike commit.
- Do NOT copy `node_modules` from another machine. Install fresh.

## 1. Install and sanity-check

```bash
npm install
npx expo-doctor@latest
npx tsc --noEmit
```

Expected: install succeeds (`react-dom@19.2.3` is pinned — do NOT upgrade it to
19.3.0; Expo SDK 57 targets React 19.2.3). Doctor may report 9 patch drifts
(e.g. `expo 57.0.21 → ~57.0.22`) and a missing `react-native-worklets` peer for
reanimated — both pre-existing and safe to ignore for this spike. Do NOT run
`--fix` / `--check` upgrades mid-spike.

## 2. Confirm config

- `app.json` → `plugins` must contain `"react-native-health-connect"`.
- `minSdkVersion >= 26` (SDK 57 default satisfies this). On-device Health Connect
  data additionally needs Android 9+ with the Health Connect app from the Play
  Store, or Android 14+ where it is built in. Below Android 9 the spike cannot
  be verified on that device.

## 3. Native rebuild (required)

`android/` was generated BEFORE the Health Connect plugin was added, so it has
no Health Connect wiring. Regenerate:

```bash
npx expo prebuild --clean
npx expo run:android
```

The plugin only edits the Android manifest (permissions-rationale intent filter
+ `ViewPermissionUsageActivity` alias, run-once/idempotent). From this point
**Expo Go no longer works** — always use the dev build.

## 4. One-time setup on the phone

1. Pair the watch in the Mi Fitness app.
2. Mi Fitness → Settings → Health Connect → enable sharing
   (exercise, calories, steps, distance).
3. Android Health Connect → App permissions → allow Mi Fitness (and Daily Plate
   when prompted at sync time).

## 5. Verification checklist (§5 of `docs/health-connect-spike.md`)

1. Dev build installs; old screens still work.
2. Log a workout on the Redmi → confirm it appears in Mi Fitness → confirm it
   is visible in Health Connect.
3. In Daily Plate → Activity → **Sync now** → session appears with matching
   minutes/calories/steps, `source='health-connect'`, ⌚ badge, plus
   steps/distance details where reported.
4. Sync twice → no duplicates (`external_id` dedupe via `INSERT OR IGNORE`).
5. Delete a synced row → next sync **re-imports it** (intended behavior — no
   tombstones in this spike).
6. Settings → export, then restore → new `steps`/`distance_m` columns and
   last-sync timestamp round-trip (old backups without the columns still
   restore).

## 6. Report back

- Sync result counts (imported / skipped / sessions) and any on-screen message.
- Any `permission-denied`, `sdk-unavailable`, or `not-installed` errors.
- Android version of the test phone + Health Connect app version if relevant.
- Anything in the verification checklist that failed, with steps to reproduce.

## Design decisions baked in (do not change mid-spike)

- Sync window: last 30 days, idempotent — safe to re-run.
- Calories: Health Connect `TotalCaloriesBurned` preferred, MET-estimate fallback
  (latest logged weight, default 70 kg).
- One XP award + one celebration banner per sync, regardless of session count.
- `steps`/`distance_m` are optional per session — rows without them are normal.

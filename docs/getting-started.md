# Getting started

## Requirements

- Node 22.13+, npm 10/11, JDK 17, Android SDK (Expo SDK 57 defaults).
- Android only (`app.json` lists `platforms: ["android"]`).
- Do not upgrade `react-dom` past the pinned 19.2.3 on this SDK.

## Run

```bash
npm install
npm run typecheck
node --test scripts/*.test.mjs
```

Start options from `package.json`:

- `npm start` — Expo dev server.
- `npm run android` — `expo run:android` (dev build; required for
  Health Connect and camera/barcode on device).

## Verify

1. `node ./node_modules/typescript/bin/tsc --noEmit` is clean.
2. `node --test scripts/*.test.mjs` — food providers, i18n key parity,
   search, and nutrition estimates.
3. On device: onboarding → log food → generate plan → build groceries →
   log workout → sync watch (dev build) → check Progress.

Health Connect specifics live in
[Health Connect spike](health-connect-spike.md) and
[Phone handoff](phone-handoff.md).

## Releases

- `eas.json` has `preview` (APK, for sideloading) and `production` (default
  app bundle) profiles. Current distribution is sideloaded APKs in `releases/`.
- Versions must stay in sync: `package.json` and `app.json` are both `1.0.0`,
  package `com.dailyplate.app`. Bump them together.
- No `versionCode` is set in `app.json`: fine for sideloading, but a Play
  Store release needs a bump strategy (or remote app versioning), plus the
  Health data access declaration noted in the spike doc.
- No OTA updates are configured; every change ships as a full build.
- `android/` is committed prebuild output, so `app.json` native properties
  (`plugins`, `userInterfaceStyle`, `orientation`, `icon`, `scheme`,
  `android`) do NOT sync automatically: after changing them (e.g. the
  notifications plugin), the phone PC must run `npx expo prebuild --clean`
  before `expo run:android`. `expo-doctor` flags this and pre-existing
  patch-version drifts; both are documented as safe to ignore mid-stream —
  do not run upgrades to fix them.

# Daily Plate

Private Greek/English calorie tracker and local meal planner built with Expo SDK 57 and React Native.

## Run on Android

```bash
npm install
npx expo start
```

Use a development build or an Android emulator/device. SDK 57 requires the matching Expo Go/development client. To create a local Android build:

```bash
npx expo run:android
```

For an installable APK from EAS, authenticate with Expo and run:

```bash
npx eas-cli build --platform android --profile preview
```

The app creates `daily-plate.db` in the app sandbox. The starter library contains bilingual Mediterranean foods and recipes. Online search and barcode lookup use Open Food Facts only when requested; selected products are cached locally.

## Data and privacy

Diary entries, goals, plans, grocery state, custom foods, and weights remain on-device. Settings provides versioned JSON export and validated transactional restore. External product data is attributed to Open Food Facts and should be used under its terms and data licenses.

## Quality checks

```bash
npm run typecheck
npm run lint
```

The planner is deterministic for a given set of eligible recipes except when the user explicitly replaces a meal. Historical diary rows keep nutrition snapshots, so editing a food later does not change past totals.

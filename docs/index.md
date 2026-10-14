# Daily Plate

Daily Plate is an offline-first Android food diary, meal planner, grocery list,
workout log, and progress tracker. Data stays on the device in SQLite
(`daily-plate.db`). The UI is bilingual (English / Greek).

## Screens

- **Onboarding** (`app/onboarding.tsx`): 3-step wizard — About, Goals
  (with a suggested-goals box from `estimateGoals()`), Eating style.
- **Today** (`app/(tabs)/index.tsx`): net-calorie ring, macros, weekly boss,
  water tracker, meal sections. Breakfast, lunch, and dinner always show;
  brunch and snacks collapse when empty. Diary edits open in a bottom sheet.
- **Add food** (`app/add-food.tsx`): local search, online search
  (Open Food Facts), barcode scan, custom food. The selected food stays in a
  sticky bottom bar with portion chips and macro preview.
- **Plan** (`app/(tabs)/plan.tsx`): proposal generator, multi-day save to
  consecutive dates, lock / shuffle / portion editing, custom recipe library.
  Shuffle respects the excluded-ingredients list.
- **Groceries** (`app/(tabs)/groceries.tsx`): builds a 7-day list from planned
  recipes, Monday week snap, store prices, share. Clearing checked items asks
  for confirmation.
- **Activity** (`app/(tabs)/activity.tsx`): manual workouts with quick-start
  templates plus Health Connect watch sync (Android dev build).
- **Progress** (`app/(tabs)/progress.tsx`): 7 / 30 / year / custom ranges,
  top foods per meal, badges, weight chart with 7-day average and kg/week rate.
- **Settings** (`app/(tabs)/settings.tsx`): goals with suggested values,
  profile, diet, exclusions, JSON export / import.

See [Getting started](getting-started.md) to run the app and
[Architecture](architecture.md) for the technical layout.

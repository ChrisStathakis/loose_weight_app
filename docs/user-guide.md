# Today and food diary

Route: `app/(tabs)/index.tsx`. Modal: `app/add-food.tsx`.

## Today

- Header: greeting, date stepper, streak chip, XP badge.
- Hero: `AnimatedRing` shows **net** calories (eaten minus burned from
  `workouts`), remaining kcal, consumed / burned line, best streak.
- `MacroPill` row tracks protein / carbs / fat against goals.
- Weekly opponent card and 7-day insight summarize the week.
- Water card: 8 × 250 ml segments toward a 2000 ml goal (`+250`, `+500`, `−250`).
- Meal sections: breakfast, lunch, and dinner always render; brunch and the
  three snacks appear when they have entries or when **Show all meals** is on.
- Each entry row shows emoji, name, grams, kcal; tap to edit, copy, or delete,
  or ⓘ for a full detail card (macros, vitamins, recipe ingredients).
  Delete asks for confirmation. Editing opens in a bottom-sheet modal with a
  live kcal preview scaled to the edited portion.

## Add food

- Tabs: All, Recents (last 12 diary foods), Favorites.
- Search is local-first with accent-insensitive matching (`src/lib/search.ts`);
  **Search online** queries Open Food Facts and caches picks into `foods`
  (`off-*` ids) for offline reuse.
- **Scan barcode** uses `expo-camera` and `lookupBarcode()`.
- **Create custom food** inserts a `custom-*` row into `foods`.
- Selecting a food opens a sticky bottom bar: emoji, name, kcal, P/C/F for the
  portion, per-100g reference, portion chips (50/100/150/200), grams input,
  Cancel / Log. Vitamins & minerals appear below, scaled to the portion —
  sourced from Open Food Facts when the producer provides them, cached
  offline per food; foods without data say so instead of guessing.
- Logging writes a `diary_entries` row and awards XP.

Online data is attributed to Open Food Facts in the UI.

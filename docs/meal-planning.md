# Meal planning

Route: `app/(tabs)/plan.tsx`. Planner: `src/lib/planner.ts`.

## Builder

- The screen is organized in numbered steps: ① liked foods, ② plan settings,
  ③ proposal, ④ the saved plan. The builder collapses automatically after
  a successful save.
- Liked foods (search from `foods`), days (1/2/3/5/7), meals per day (2–7),
  daily calories, optional protein-goal matching.
- With no liked foods, the proposal falls back to eating-style defaults
  (`src/data/dietDefaults.ts`) and says so.
- **Generate proposal** builds `preview` days with per-day kcal/protein totals.
  Preview items can be adjusted (±25 g, ±0.25 portion), shuffled, removed, or
  added to via the food/recipe picker.

## Saving

- **Save plan** writes every preview day to consecutive dates starting from the
  selected date. Locked meals on Day 1 are preserved; other days are
  overwritten.
- Saved rows support lock, shuffle (excluded-aware), gram/portion stepping,
  removal (with confirm), and one-tap logging to the diary.

## Exclusions

Proposals and all shuffle paths skip foods and recipes matching
`settings.excluded`. If everything is excluded, the original pool is used as a
fallback rather than failing.

## Recipes

- The **My recipes** card lists custom recipes (`custom-recipe-*`, first 5)
  with delete (with confirm) and a **New recipe** button to
  `app/recipe-editor.tsx`.
- The editor takes a name, one-ingredient-per-line list
  (e.g. `150 g tomato`), instructions, diet, per-serving macros, and servings
  (minimum 1). Save is disabled until a name is entered.

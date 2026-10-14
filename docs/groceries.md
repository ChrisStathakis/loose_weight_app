# Groceries

Route: `app/(tabs)/groceries.tsx`. Helpers: `src/lib/groceries.ts`,
`src/lib/foodPrices.ts`, `src/lib/recipePrices.ts`.

## Building the list

- The list covers `start → start + 6` from the week's saved `plans` joined to
  `recipes`. Ingredients scale by `portion / servings`.
- Manual items and prices survive regeneration; auto rows are rebuilt.
- Missing prices prefill from row memory, contributing recipes, or matching
  catalog foods (best-effort).
- Week controls: ±7 day shift plus a **This week (Mon)** snap to the current
  Monday.
- If the week has no planned recipes, Generate keeps the current list and
  explains that a plan with recipes must be saved first.

## Working the list

- Search, hide-checked toggle, collapsible categories, per-category check-all.
- Tap a row to toggle; expanding shows which planned recipes use it.
- Prices open a shared `PriceSheet`; the cheapest option shows as a chip.
- Totals show estimated total and still-to-buy cost.
- Share exports plain text; **Clear checked** asks for confirmation first.

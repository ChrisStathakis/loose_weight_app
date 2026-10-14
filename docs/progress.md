# Progress

Route: `app/(tabs)/progress.tsx`.

- Ranges: 7 days, 30 days, year (with year picker), custom YYYY-MM-DD range
  (clamped to today, max 366 days).
- Calorie chart plots net calories (eaten minus burned) against the goal,
  with average consumed / burned and the goal alongside. Protein / carbs / fat
  show average grams with goal bars.
- **Top foods** lists the top 3 per meal slot by frequency with total kcal.
- **Badges** shelf shows locked vs unlocked gamification badges.
- **Weight** card: latest entry, range delta, bar chart of recent entries,
  7-day average, kg/week rate, and trend label (down / up / steady), plus an
  add-weight row. A target weight set in Settings adds a goal box with
  remaining kg, a progress bar from the range start, and a reached banner.
  Reaching 3+ weigh-ins in 30 days awards the Scale Buddy
  badge (best-effort).

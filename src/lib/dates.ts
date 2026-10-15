/** Local date helpers. Never serialize dates with toISOString() for day keys:
 *  local midnight (or noon, for offsets ≥ +12) converts to the previous UTC
 *  day, which shifts streaks, week snapping and steppers by one day. */

export const localDateKey = (date = new Date()): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/** Adds calendar days to a YYYY-MM-DD key and returns a local key. */
export const addDaysKey = (base: string, days: number): string => {
  const d = new Date(`${base}T12:00:00`);
  d.setDate(d.getDate() + days);
  return localDateKey(d);
};

/** Monday of the week containing the given key ("This week (Mon)"). */
export const startOfWeekKey = (base: string): string => {
  const d = new Date(`${base}T12:00:00`);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return localDateKey(d);
};

/** The seven day keys (Monday → Sunday) of the week containing `base`. */
export const weekKeys = (base: string): string[] => {
  const monday = startOfWeekKey(base);
  return Array.from({ length: 7 }, (_, i) => addDaysKey(monday, i));
};

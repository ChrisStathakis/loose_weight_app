import type { Food } from '@/src/types';

// Search normalization shared by the local database and the UI. NFKC keeps
// equivalent forms (for example full-width Latin characters) consistent,
// while NFD removes Greek tonos and other combining marks.
export function normalizeEl(value: string): string {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ς/g, 'σ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function foodHaystack(food: Food): string {
  return normalizeEl(
    `${food.name_en ?? ''} ${food.name_el ?? ''} ${food.brand ?? ''}`,
  );
}

export function matchesFood(food: Food, rawQuery: string): boolean {
  const q = normalizeEl(rawQuery);
  if (!q) return true;
  const haystack = foodHaystack(food);
  // Requiring every word to occur makes both "greek yogurt" and
  // "γιαούρτι 2%" work regardless of word order or language.
  return q.split(' ').every((token) => haystack.includes(token));
}

export function filterFoods(foods: Food[], rawQuery: string, limit = 30): Food[] {
  const q = normalizeEl(rawQuery);
  if (!q) return foods.slice(0, limit);
  const out: Food[] = [];
  for (const f of foods) {
    if (matchesFood(f, q)) {
      out.push(f);
      if (out.length >= limit) break;
    }
  }
  return out;
}

// Debounce helper returning cancel fn. Only last call within delay fires.
export function debounceSearch(
  fn: (value: string) => void,
  delay = 300,
): { call: (value: string) => void; cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return {
    call: (value: string) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        fn(value);
      }, delay);
    },
    cancel: () => {
      if (timer) clearTimeout(timer);
      timer = null;
    },
  };
}

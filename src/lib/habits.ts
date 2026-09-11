export function calcStreak(loggedDates: string[], todayKey: string): { current: number; best: number } {
  const set = new Set(loggedDates);
  let current = 0;
  const cursor = new Date(`${todayKey}T12:00:00`);
  // Allow today to be missing (streak still alive if yesterday logged).
  if (!set.has(todayKey)) cursor.setDate(cursor.getDate() - 1);
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (set.has(key)) {
      current += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else break;
  }
  // best: longest run in the set
  const sorted = [...set].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const key of sorted) {
    if (prev) {
      const prevDate: Date = new Date(`${prev}T12:00:00`);
      prevDate.setDate(prevDate.getDate() + 1);
      if (prevDate.toISOString().slice(0, 10) === key) run += 1;
      else run = 1;
    } else run = 1;
    best = Math.max(best, run);
    prev = key;
  }
  return { current, best };
}

import { Locale } from '@/src/types';
import { tFor } from '@/src/lib/i18n';

export function greeting(hour = new Date().getHours(), locale: Locale = 'en'): string {
  if (hour < 11) return tFor(locale, 'morning');
  if (hour < 17) return tFor(locale, 'afternoon');
  return tFor(locale, 'evening');
}

const FOOD_EMOJI: Array<[RegExp, string]> = [
  [/oat|granola|cereal|muesli/i, '🥣'],
  [/yogurt|kefir|skyr/i, '🍦'],
  [/banana/i, '🍌'],
  [/apple/i, '🍎'],
  [/orange|lemon|citrus/i, '🍊'],
  [/berries|strawberr|grapes|pomegranate|kiwi/i, '🍇'],
  [/egg/i, '🍳'],
  [/chicken|turkey|poultry/i, '🍗'],
  [/beef|pork|lamb|meat/i, '🥩'],
  [/fish|salmon|tuna|sardine|cod|mackerel|shrimp|anchov/i, '🐟'],
  [/salad|lettuce|spinach|greens/i, '🥗'],
  [/tomato/i, '🍅'],
  [/avocado/i, '🥑'],
  [/potato|rice|pasta|couscous|bulgur|quinoa|bread|pita|orzo/i, '🍚'],
  [/lentil|bean|chickpea|hummus|fava|peas/i, '🫘'],
  [/cheese|feta|halloumi|mozzarella|cheddar|parmesan|cottage/i, '🧀'],
  [/milk/i, '🥛'],
  [/nut|almond|walnut|peanut|tahini|seed/i, '🥜'],
  [/honey/i, '🍯'],
  [/oil|butter|olive/i, '🫒'],
  [/soup/i, '🍲'],
  [/pizza|toast|sandwich|pita/i, '🥪'],
  [/chocolate|treat|snack/i, '🍫'],
  [/coffee/i, '☕'],
];

export function foodEmoji(name: string, brand?: string | null): string {
  const hay = `${name} ${brand ?? ''}`;
  for (const [re, emoji] of FOOD_EMOJI) if (re.test(hay)) return emoji;
  // Stable playful fallback by hash
  const fallbacks = ['🥗', '🍽️', '🥙', '🍲', '🥘'];
  let h = 0;
  for (let i = 0; i < hay.length; i += 1) h = (h * 31 + hay.charCodeAt(i)) >>> 0;
  return fallbacks[h % fallbacks.length];
}

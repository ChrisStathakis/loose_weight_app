export type MicroDef = {
  id: string;
  unit: string;
  label_en: string;
  label_el: string;
};

// OFF nutriment keys (value per 100g) mapped to display units. Values arrive
// in heterogeneous units, so the `<key>_unit` field wins when present.
export const NUTRIENTS: MicroDef[] = [
  { id: 'vitamin-a', unit: 'µg', label_en: 'Vitamin A', label_el: 'Βιταμίνη A' },
  { id: 'vitamin-c', unit: 'mg', label_en: 'Vitamin C', label_el: 'Βιταμίνη C' },
  { id: 'vitamin-d', unit: 'µg', label_en: 'Vitamin D', label_el: 'Βιταμίνη D' },
  { id: 'vitamin-e', unit: 'mg', label_en: 'Vitamin E', label_el: 'Βιταμίνη E' },
  { id: 'vitamin-k', unit: 'µg', label_en: 'Vitamin K', label_el: 'Βιταμίνη K' },
  { id: 'vitamin-b1', unit: 'mg', label_en: 'Thiamine (B1)', label_el: 'Θειαμίνη (B1)' },
  { id: 'vitamin-b2', unit: 'mg', label_en: 'Riboflavin (B2)', label_el: 'Ριβοφλαβίνη (B2)' },
  { id: 'vitamin-pp', unit: 'mg', label_en: 'Niacin (B3)', label_el: 'Νιασίνη (B3)' },
  { id: 'vitamin-b6', unit: 'mg', label_en: 'Vitamin B6', label_el: 'Βιταμίνη B6' },
  { id: 'vitamin-b9', unit: 'µg', label_en: 'Folate (B9)', label_el: 'Φυλλικό οξύ (B9)' },
  { id: 'vitamin-b12', unit: 'µg', label_en: 'Vitamin B12', label_el: 'Βιταμίνη B12' },
  { id: 'calcium', unit: 'mg', label_en: 'Calcium', label_el: 'Ασβέστιο' },
  { id: 'iron', unit: 'mg', label_en: 'Iron', label_el: 'Σίδηρος' },
  { id: 'magnesium', unit: 'mg', label_en: 'Magnesium', label_el: 'Μαγνήσιο' },
  { id: 'potassium', unit: 'mg', label_en: 'Potassium', label_el: 'Κάλιο' },
  { id: 'zinc', unit: 'mg', label_en: 'Zinc', label_el: 'Ψευδάργυρος' },
  { id: 'sodium', unit: 'mg', label_en: 'Sodium', label_el: 'Νάτριο' },
];

export type MicroValue = { nutrient: string; amount: number; unit: string };

const toNumber = (value: unknown): number | null => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** Extract per-100g micronutrients from an Open Food Facts nutriments object. */
export function mapMicros(nutriments: Record<string, unknown> | null | undefined): MicroValue[] {
  if (!nutriments || typeof nutriments !== 'object') return [];
  const out: MicroValue[] = [];
  for (const def of NUTRIENTS) {
    const raw = nutriments[`${def.id}_100g`] ?? nutriments[def.id];
    const amount = toNumber(raw);
    if (amount == null) continue;
    const unitRaw = nutriments[`${def.id}_unit`];
    const unit = typeof unitRaw === 'string' && unitRaw.trim() ? unitRaw.trim() : def.unit;
    out.push({ nutrient: def.id, amount, unit });
  }
  return out;
}

/** Scale per-100g micro values to a portion in grams. */
export function scaleMicros(micros: MicroValue[], grams: number): MicroValue[] {
  const factor = Math.max(0, grams) / 100;
  return micros.map((m) => ({ ...m, amount: m.amount * factor }));
}

export function microLabel(nutrient: string, locale: 'en' | 'el'): string {
  return (locale === 'el' ? NUTRIENTS.find((n) => n.id === nutrient)?.label_el : NUTRIENTS.find((n) => n.id === nutrient)?.label_en) ?? nutrient;
}

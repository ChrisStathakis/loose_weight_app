import type { Diet } from '../types';

export const DIETS: Diet[] = [
  'balanced',
  'vegetarian',
  'vegan',
  'mediterranean',
  'high-protein',
  'low-carb',
  'keto',
  'paleo',
  'gluten-free',
];

const known = new Set<string>(DIETS);

export const normalizeDiet = (value: unknown): Diet =>
  typeof value === 'string' && known.has(value) ? (value as Diet) : 'balanced';

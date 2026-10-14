import type { Diet } from '@/src/types';

/**
 * Curated proposal defaults per eating style. IDs reference the existing
 * seed/pack library only (base seed + pack2/3/4 foods and recipes), so no
 * re-seed or migration is needed and this works on already-installed apps.
 * Unknown IDs (e.g. an older DB that hasn't seeded yet) are skipped when
 * resolving, never crash.
 */
export type StyleDefaults = { foods: string[]; recipes: string[] };

export const dietDefaults: Record<Diet, StyleDefaults> = {
  balanced: {
    foods: [
      'oats', 'greek-yogurt', 'egg', 'chicken-breast', 'salmon', 'tuna',
      'rice', 'potato', 'tomato', 'cucumber', 'olive-oil', 'feta',
      'apple', 'wholegrain-bread',
    ],
    recipes: [
      'chicken-greek-salad', 'salmon-rice', 'tuna-bean-salad',
      'lemon-chicken-potato', 'giouvetsi', 'bifteki-platter',
      'souvlaki-pita-wrap', 'caesar-salad-chicken',
    ],
  },
  vegetarian: {
    foods: [
      'oats', 'greek-yogurt', 'egg', 'milk', 'feta', 'halloumi',
      'mozzarella', 'lentils', 'chickpeas', 'hummus', 'spinach',
      'avocado', 'tomato', 'almonds', 'honey', 'wholegrain-bread',
    ],
    recipes: [
      'greek-yogurt-bowl', 'dakos', 'spinach-omelet', 'halloumi-pita',
      'quinoa-greek-bowl', 'pasta-tomato-feta', 'kolokithokeftedes',
      'village-omelet',
    ],
  },
  vegan: {
    foods: [
      'oats', 'lentils', 'chickpeas', 'beans', 'tofu', 'tempeh',
      'hummus', 'tahini', 'avocado', 'quinoa', 'black-beans',
      'soy-yogurt', 'peanut-butter', 'almonds', 'apple', 'tomato',
      'spinach',
    ],
    recipes: [
      'lentil-soup', 'chickpea-bowl', 'fasolada', 'briam', 'spanakorizo',
      'tofu-vegetable-pan', 'gemista', 'fava', 'greek-bean-salad',
      'fakes-soup',
    ],
  },
  mediterranean: {
    foods: [
      'olive-oil', 'tomato', 'cucumber', 'feta', 'olives',
      'kalamata-olives', 'salmon', 'sardines', 'sea-bream',
      'grilled-octopus', 'chicken-souvlaki', 'tzatziki', 'lentils',
      'chickpeas', 'hummus', 'strained-yogurt-10',
    ],
    recipes: [
      'village-salad', 'octopus-salad', 'psari-plaki', 'sardeles-fournou',
      'gigantes-plaki', 'horta-plate', 'dakos', 'tuna-salad-greek',
    ],
  },
  'high-protein': {
    foods: [
      'chicken-breast', 'turkey', 'beef', 'tuna', 'salmon', 'sardines',
      'shrimp', 'egg', 'greek-yogurt', 'skyr', 'cottage-cheese',
      'lentils', 'pork-souvlaki', 'chicken-souvlaki',
    ],
    recipes: [
      'chicken-greek-salad', 'tuna-bean-salad', 'salmon-rice',
      'p3-turkey-egg-omelet', 'p3-tuna-egg-muffins',
      'p3-chicken-breakfast-pita', 'bifteki-platter', 'sardine-salad',
    ],
  },
  'low-carb': {
    foods: [
      'egg', 'chicken-breast', 'salmon', 'sardines', 'tuna', 'beef',
      'pork', 'feta', 'halloumi', 'cheddar', 'greek-yogurt', 'avocado',
      'olive-oil', 'spinach', 'cucumber', 'almonds', 'walnuts',
    ],
    recipes: [
      'octopus-salad', 'village-omelet', 'strapatsada',
      'p3-egg-tuna-bites', 'p3-mackerel-dip', 'p3-turkey-rollups',
      'p3-tuna-cucumber-bites', 'sardine-salad',
    ],
  },
  keto: {
    foods: [
      'egg', 'beef', 'pork', 'bacon', 'sardines', 'salmon', 'mackerel',
      'cheddar', 'feta', 'butter', 'olive-oil', 'avocado', 'almonds',
      'walnuts', 'cream',
    ],
    recipes: [
      'village-omelet', 'strapatsada', 'p3-egg-tuna-bites',
      'p3-mackerel-dip', 'octopus-salad', 'p3-turkey-rollups',
      'xifias-psitos', 'sardine-salad',
    ],
  },
  paleo: {
    foods: [
      'egg', 'chicken-breast', 'salmon', 'tuna', 'beef', 'pork',
      'almonds', 'walnuts', 'avocado', 'olive-oil', 'apple', 'banana',
      'orange', 'honey', 'dates', 'fig',
    ],
    recipes: [
      'psari-plaki', 'stifado', 'kleftiko', 'kotopoulo-krasato',
      'sardeles-fournou', 'octopus-stifado', 'fakes-soup', 'tourlou',
    ],
  },
  'gluten-free': {
    foods: [
      'rice', 'white-rice', 'potato', 'quinoa', 'corn-tortilla',
      'rice-cakes', 'egg', 'chicken-breast', 'salmon', 'greek-yogurt',
      'feta', 'tuna', 'lentils', 'chickpeas',
    ],
    recipes: [
      'salmon-rice', 'spanakorizo', 'fakes-soup', 'lentil-soup',
      'fasolada', 'village-salad', 'psari-plaki',
      'p3-lentil-morning-soup',
    ],
  },
};

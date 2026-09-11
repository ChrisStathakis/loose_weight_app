import { Food } from '@/src/types';
import { Locale } from '@/src/types';
import { tFor } from '@/src/lib/i18n';

const mapProduct = (product: any, index = 0, locale: Locale = 'en'): Food | null => {
  const nutrients = product.nutriments ?? {};
  const kcal = Number(nutrients['energy-kcal_100g'] ?? nutrients['energy-kcal'] ?? 0);
  const nameEn = product.product_name_en || product.product_name || product.generic_name_en || null;
  const nameEl = product.product_name_el || product.generic_name_el || product.product_name || product.product_name_en || null;
  if (!nameEn && !nameEl) return null;
  const fallback = tFor(locale, 'packagedFood');
  return {
    id: `off-${product.code ?? index}`,
    name_en: nameEn || nameEl || fallback,
    name_el: nameEl || nameEn || fallback,
    brand: product.brands || null,
    barcode: product.code || null,
    calories_per_100g: kcal,
    protein_per_100g: Number(nutrients.proteins_100g ?? 0),
    carbs_per_100g: Number(nutrients.carbohydrates_100g ?? 0),
    fat_per_100g: Number(nutrients.fat_100g ?? 0),
    serving_grams: null,
    source: 'Open Food Facts',
  };
};

const FIELDS = 'code,product_name,product_name_en,product_name_el,generic_name_en,generic_name_el,brands,nutriments';

export async function searchFoodsOnline(query: string, locale: Locale = 'en'): Promise<Food[]> {
  const params = new URLSearchParams({
    search_terms: query.trim(),
    page_size: '20',
    fields: FIELDS,
    // Ask Open Food Facts for the user's language first. Product names still
    // fall back across languages in mapProduct when a translation is absent.
    lc: locale === 'el' ? 'el' : 'en',
  });
  const response = await fetch(`https://world.openfoodfacts.org/api/v2/search?${params.toString()}`, { headers: { Accept: 'application/json', 'User-Agent': 'DailyPlate/1.0 (personal nutrition app)' } });
  if (!response.ok) throw new Error(`Open Food Facts ${response.status}`);
  const json = await response.json();
  return (json.products ?? []).map((p: any, i: number) => mapProduct(p, i, locale)).filter(Boolean) as Food[];
}

export async function lookupBarcode(barcode: string, locale: Locale = 'en'): Promise<Food | null> {
  const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}?fields=${FIELDS}`, { headers: { Accept: 'application/json', 'User-Agent': 'DailyPlate/1.0 (personal nutrition app)' } });
  if (!response.ok) return null;
  const json = await response.json();
  return json.status === 1 ? mapProduct(json.product, 0, locale) : null;
}

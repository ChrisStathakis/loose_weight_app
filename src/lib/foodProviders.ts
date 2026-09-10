import { Food } from '@/src/types';

const mapProduct = (product: any, index = 0): Food | null => {
  const nutrients = product.nutriments ?? {};
  const kcal = Number(nutrients['energy-kcal_100g'] ?? nutrients['energy-kcal'] ?? 0);
  if (!product.product_name && !product.product_name_en) return null;
  return {
    id: `off-${product.code ?? index}`,
    name_en: product.product_name_en || product.product_name || 'Packaged food',
    name_el: product.product_name || product.product_name_en || 'Packaged food',
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

export async function searchFoodsOnline(query: string): Promise<Food[]> {
  const params = new URLSearchParams({ search_terms: query, page_size: '20', fields: 'code,product_name,product_name_en,brands,nutriments' });
  const response = await fetch(`https://world.openfoodfacts.org/api/v2/search?${params.toString()}`, { headers: { Accept: 'application/json', 'User-Agent': 'DailyPlate/1.0 (personal nutrition app)' } });
  if (!response.ok) throw new Error(`Open Food Facts ${response.status}`);
  const json = await response.json();
  return (json.products ?? []).map(mapProduct).filter(Boolean) as Food[];
}

export async function lookupBarcode(barcode: string): Promise<Food | null> {
  const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}?fields=code,product_name,product_name_en,brands,nutriments`, { headers: { Accept: 'application/json', 'User-Agent': 'DailyPlate/1.0 (personal nutrition app)' } });
  if (!response.ok) return null;
  const json = await response.json();
  return json.status === 1 ? mapProduct(json.product, 0) : null;
}

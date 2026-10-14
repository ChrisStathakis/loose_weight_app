import type { Food, Locale } from '../types';
import { mapMicros } from './micronutrients';

// Keep in sync with the `packagedFood` key in src/lib/i18n.ts. Inlined (rather
// than importing tFor) so this module has no runtime alias imports and stays
// directly testable under plain Node type-stripping.
const packagedFoodFallback = (locale: Locale): string =>
  locale === 'el' ? 'Τυποποιημένο τρόφιμο' : 'Packaged food';

export const OFF_TIMEOUT_MS = 10000;
export const OFF_PAGE_SIZE = 20;

const toNumber = (value: unknown): number => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const normalizeBrand = (brands: unknown): string | null => {
  if (Array.isArray(brands)) {
    const parts = brands.map((b) => String(b ?? '').trim()).filter(Boolean);
    return parts.length ? parts.join(', ') : null;
  }
  if (typeof brands === 'string') {
    const trimmed = brands.trim();
    return trimmed ? trimmed : null;
  }
  return null;
};

const pickName = (product: any): { en: string | null; el: string | null } => {
  // Search-a-licious may return plain product_name plus localized variants or
  // language-keyed objects; legacy v1 returns product_name_en/_el strings.
  const asString = (v: unknown): string | null =>
    typeof v === 'string' && v.trim() ? v.trim() : null;
  const fromLangMap = (v: unknown, lang: string): string | null => {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const rec = v as Record<string, unknown>;
      return asString(rec[lang]) ?? asString(rec.en) ?? null;
    }
    return null;
  };
  const nameEn =
    asString(product.product_name_en) ||
    fromLangMap(product.product_name, 'en') ||
    asString(product.product_name) ||
    asString(product.generic_name_en) ||
    null;
  const nameEl =
    asString(product.product_name_el) ||
    fromLangMap(product.product_name, 'el') ||
    asString(product.generic_name_el) ||
    asString(product.product_name) ||
    asString(product.product_name_en) ||
    null;
  return { en: nameEn, el: nameEl };
};

export const mapProduct = (product: any, index = 0, locale: Locale = 'en'): Food | null => {
  if (!product || typeof product !== 'object') return null;
  const nutrients = product.nutriments ?? {};
  const kcal = toNumber(nutrients['energy-kcal_100g'] ?? nutrients['energy-kcal']);  const { en: nameEn, el: nameEl } = pickName(product);
  if (!nameEn && !nameEl) return null;
  const fallback = packagedFoodFallback(locale);
  const code = product.code != null ? String(product.code) : null;
  return {
    id: `off-${code ?? index}`,
    name_en: nameEn || nameEl || fallback,
    name_el: nameEl || nameEn || fallback,
    brand: normalizeBrand(product.brands ?? product.brand),
    barcode: code,
    calories_per_100g: kcal,
    protein_per_100g: toNumber(nutrients.proteins_100g),
    carbs_per_100g: toNumber(nutrients.carbohydrates_100g),
    fat_per_100g: toNumber(nutrients.fat_100g),
    serving_grams: null,
    source: 'Open Food Facts',
    micros: mapMicros(nutrients),
  };
};

const FIELDS = 'code,product_name,product_name_en,product_name_el,generic_name_en,generic_name_el,brands,nutriments';
const HEADERS = { Accept: 'application/json', 'User-Agent': 'DailyPlate/1.0 (personal nutrition app)' };

export class OffError extends Error {
  code: 'OFF_TIMEOUT' | 'OFF_RATE_LIMITED' | 'OFF_HTTP' | 'OFF_NETWORK';
  status?: number;
  constructor(code: OffError['code'], message: string, status?: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function fetchJson(url: string, timeoutMs = OFF_TIMEOUT_MS): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { headers: HEADERS, signal: controller.signal });
    if (response.status === 429) throw new OffError('OFF_RATE_LIMITED', 'Open Food Facts rate limited (429)', 429);
    if (!response.ok) throw new OffError('OFF_HTTP', `Open Food Facts ${response.status}`, response.status);
    return await response.json();
  } catch (e: any) {
    if (e instanceof OffError) throw e;
    if (e?.name === 'AbortError') throw new OffError('OFF_TIMEOUT', 'Open Food Facts timed out');
    throw new OffError('OFF_NETWORK', String(e instanceof Error ? e.message : e));
  } finally {
    clearTimeout(timer);
  }
}

const mapList = (items: any, locale: Locale): Food[] => {
  if (!Array.isArray(items)) return [];
  return items
    .map((p: any, i: number) => mapProduct(p, i, locale))
    .filter((f): f is Food => f !== null);
};

async function searchSearchalicious(query: string, locale: Locale): Promise<Food[]> {
  const params = new URLSearchParams({ q: query, page: '1', page_size: String(OFF_PAGE_SIZE), fields: FIELDS });
  if (locale === 'el') params.set('langs', 'el');
  const json = await fetchJson(`https://search.openfoodfacts.org/search?${params.toString()}`);
  return mapList(json.hits ?? json.products ?? [], locale);
}

async function searchLegacyV1(query: string, locale: Locale): Promise<Food[]> {
  const params = new URLSearchParams({
    search_terms: query,
    search_simple: '1',
    action: 'process',
    json: '1',
    page: '1',
    page_size: String(OFF_PAGE_SIZE),
    fields: FIELDS,
    lc: locale === 'el' ? 'el' : 'en',
  });
  const json = await fetchJson(`https://world.openfoodfacts.org/cgi/search.pl?${params.toString()}`);
  return mapList(json.products ?? json.hits ?? [], locale);
}

export async function searchFoodsOnline(query: string, locale: Locale = 'en'): Promise<Food[]> {
  const q = query.trim();
  if (!q) return [];
  // Race both full-text endpoints; first-wins merge keeps working even if one
  // backend is down. /api/v2/search is intentionally NOT used: it ignores
  // search_terms and returns unrelated products.
  const [a, b] = await Promise.allSettled([searchSearchalicious(q, locale), searchLegacyV1(q, locale)]);
  const lists = [a, b]
    .filter((r): r is PromiseFulfilledResult<Food[]> => r.status === 'fulfilled')
    .map((r) => r.value);
  if (!lists.length) {
    const first = a.status === 'rejected' ? a.reason : (b as PromiseRejectedResult).reason;
    throw first instanceof Error ? first : new OffError('OFF_NETWORK', String(first));
  }
  const seen = new Set<string>();
  const merged: Food[] = [];
  for (const list of lists) {
    for (const food of list) {
      const key = food.barcode || food.id;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(food);
      if (merged.length >= OFF_PAGE_SIZE) return merged;
    }
  }
  return merged;
}

export async function lookupBarcode(barcode: string, locale: Locale = 'en'): Promise<Food | null> {
  try {
    const json = await fetchJson(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode.trim())}?fields=${FIELDS}`,
    );
    return json.status === 1 && json.product ? mapProduct(json.product, 0, locale) : null;
  } catch (e) {
    // 404/unknown barcode maps to null (not found); network/timeout/429
    // propagate so the UI can show a distinct message.
    if (e instanceof OffError && (e.code === 'OFF_HTTP' || e.code === 'OFF_NETWORK')) {
      const status = e.status;
      if (status === 404) return null;
      if (e.code === 'OFF_NETWORK' && /404/.test(e.message)) return null;
    }
    throw e;
  }
}

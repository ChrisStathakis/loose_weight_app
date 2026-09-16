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
  [/souvlaki|σουβλ[αά]κι|gyros|γ[υύ]ρο|kokoretsi|κοκορ[εέ]τσι|kontosouvli|κοντοσο[υύ]βλι|soutzouk|σουτζουκ|bifteki|μπιφτ[εέ]κι|sausage|λουκ[αά]νικο|skewer|καλαμ[αά]κι/i, '🍢'],
  [/octopus|χταπ[οό]δι|calamari|καλαμαρ|squid|bream|τσιπο[υύ]ρα|bass|λαβρ[αά]κι|mullet|μπαρμπ|gavros|γα[υύ]ρο/i, '🐙'],
  [/beef|pork|lamb|meat|μπριζ[οό]λα|παϊδ[αά]κι/i, '🥩'],
  [/fish|salmon|tuna|sardine|cod|mackerel|shrimp|anchov|mussel|μ[υύ]δι|cuttlefish|σουπι[αά]|swordfish|ξιφ[ιί]α|grouper|ροφ[οό]|dentex|συναγρ[ιί]δα|botargo|αβγοτ[αά]ραχο|urchin|αχιν[οό]/i, '🐟'],
  [/salad|lettuce|spinach|greens/i, '🥗'],
  [/tomato/i, '🍅'],
  [/avocado/i, '🥑'],
  [/potato|rice|pasta|couscous|bulgur|quinoa|bread|pita|orzo/i, '🍚'],
  [/lentil|bean|chickpea|hummus|fava|peas/i, '🫘'],
  [/cheese|feta|halloumi|mozzarella|cheddar|parmesan|cottage|graviera|γραβι[εέ]ρα|kaseri|κασ[εέ]ρι|kefalotyri|κεφαλοτ[υύ]ρι|anthotyro|ανθ[οό]τυρο|mizithra|μυζ[ηή]θρα|manouri|μανο[υύ]ρι|sfela|σφ[εέ]λα|ladotyri|λαδοτ[υύ]ρι|goat cheese|κατσικ[ιί]σιο/i, '🧀'],
  [/pastourma|παστουρμ[αά]|apaki|απ[αά]κι|syglino|σ[υύ]γκλινο|noumboulo|νο[υύ]μπουλο/i, '🥓'],
  [/koulouri|κουλο[υύ]ρι|lagana|λαγ[αά]να|bobota|μπομπ[οό]τα|kritsini|κριτσ[ιί]νι|eptazymo|επτ[αά]ζυμο/i, '🥨'],
  [/revith|ρεβ[υύ]θ|fakes|φακ[εέ]|fasolakia|φασολ[αά]κι|gigantes|γ[ιί]γαντε/i, '🫘'],
  [/horta|χ[οό]ρτα|stamnagathi|σταμναγκ[αά]θι|leek|πρ[αά]σ|okra|μπ[αά]μι|artichoke|αγκιν[αά]ρα/i, '🥗'],
  [/wine|κρασ[ιί]|retsina|ρετσ[ιί]να|ouzo|ο[υύ]ζο|tsipouro|τσ[ιί]πουρο/i, '🍷'],
  [/tzatziki|τζατζ[ιί]κι|taramosalata|ταραμοσαλ[αά]τα|melitzanosalata|μελιτζανοσαλ[αά]τα|tirokafteri|τυροκαυτερ[ηή]|skordalia|σκορδαλι[αά]/i, '🥣'],
  [/baklava|μπακλαβ[αά]|galaktoboureko|γαλακτομπο[υύ]ρεκο|loukoumades|λουκουμ[αά]|halva|χαλβ[αά]|rizogalo|ρυζ[οό]γαλο|pasteli|παστ[εέ]λι|kataifi|κατα[ιί]φι|melomakarona|μελομακ[αά]ρονα|kourabies|κουραμπι[εέ]|bougatsa|μπουγ[αά]τσα|spanakopita|σπανακ[οό]πιτα|tiropita|τυρ[οό]πιτα|portokalopita|πορτοκαλ[οό]πιτα|karidopita|καρυδ[οό]πιτα|ravani|ραβαν[ιί]|samali|σ[αά]μαλι|diples|δ[ιί]πλε|amygdalota|αμυγδαλωτ[αά]|moustalevria|μουσταλευρι[αά]|spoon sweet|κουταλιο[υύ]|loukoumi|λουκο[υύ]μι|watermelon|καρπο[υύ]ζι|quince|κυδ[ωώ]νι|fig|σ[υύ]κ|dessert|cake|pastry|γλυκ[οό]/i, '🍰'],
  [/milk/i, '🥛'],
  [/nut|almond|walnut|peanut|tahini|seed/i, '🥜'],
  [/honey/i, '🍯'],
  [/oil|butter|olive/i, '🫒'],
  [/soup/i, '🍲'],
  [/pizza|toast|sandwich|pita/i, '🥪'],
  [/chocolate|treat|snack/i, '🍫'],
  [/coffee|καφ[εέ]|frappe|φραπ[εέ]/i, '☕'],
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

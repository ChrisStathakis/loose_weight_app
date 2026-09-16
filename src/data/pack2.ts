import { Food, Recipe } from '@/src/types';

// Batch 1: Greek & Mediterranean extension (~50 foods + ~50 recipes).
// Values are typical averages per 100g (foods) / per serving (recipes).

const pack2FoodData: Array<[string, string, string, number, number, number, number, number]> = [
  ['manouri', 'Manouri', 'Μανούρι', 400, 20, 3, 35, 30],
  ['sfela', 'Sfela', 'Σφέλα', 300, 22, 2, 23, 30],
  ['apaki', 'Apaki smoked pork', 'Απάκι', 220, 25, 1, 12, 50],
  ['syglino', 'Syglino smoked pork', 'Σύγκλινο', 350, 20, 1, 29, 50],
  ['pastourma', 'Pastourma', 'Παστουρμάς', 180, 28, 2, 6, 40],
  ['noumboulo', 'Noumboulo', 'Νούμπουλο', 200, 24, 1, 10, 40],
  ['kopanisti', 'Kopanisti', 'Κοπανιστή', 280, 15, 3, 23, 40],
  ['ladotyri', 'Ladotyri Mytilinis', 'Λαδοτύρι', 420, 24, 2, 35, 30],
  ['swordfish', 'Swordfish', 'Ξιφίας', 145, 23, 0, 5, 150],
  ['grouper', 'Grouper', 'Ροφός', 110, 22, 0, 2, 150],
  ['dentex', 'Dentex', 'Συναγρίδα', 120, 23, 0, 2.5, 150],
  ['cuttlefish', 'Cuttlefish', 'Σουπιά', 90, 16, 2, 1, 120],
  ['mussels', 'Mussels', 'Μύδια', 95, 12, 4, 2.5, 120],
  ['pickled-octopus', 'Pickled octopus', 'Χταπόδι ξυδάτο', 100, 19, 2, 1.5, 80],
  ['botargo', 'Botargo', 'Αβγοτάραχο', 250, 24, 2, 15, 20],
  ['sea-urchin', 'Sea urchin', 'Αχινός', 90, 13, 4, 2, 60],
  ['koulouri', 'Koulouri Thessalonikis', 'Κουλούρι Θεσσαλονίκης', 280, 8, 55, 4, 80],
  ['lagana', 'Lagana bread', 'Λαγάνα', 260, 8, 52, 3, 60],
  ['bobota', 'Bobota cornbread', 'Μπομπότα', 250, 6, 45, 5, 80],
  ['kritsini', 'Kritsini breadsticks', 'Κριτσίνια', 400, 12, 68, 8, 25],
  ['eptazymo', 'Eptazymo bread', 'Επτάζυμο ψωμί', 255, 9, 50, 3, 50],
  ['sour-trahana', 'Sour trahana (dry)', 'Τραχανάς ξινός', 350, 13, 68, 4, 40],
  ['gigantes-ready', 'Gigantes plaki', 'Γίγαντες πλακί', 110, 6, 16, 3, 200],
  ['portokalopita', 'Portokalopita', 'Πορτοκαλόπιτα', 300, 5, 42, 12, 120],
  ['karidopita', 'Karidopita', 'Καρυδόπιτα', 380, 7, 45, 20, 100],
  ['ravani', 'Ravani', 'Ραβανί', 290, 4, 48, 9, 100],
  ['samali', 'Samali', 'Σάμαλι', 280, 4, 50, 7, 100],
  ['diples', 'Diples', 'Δίπλες', 380, 5, 52, 17, 60],
  ['amygdalota', 'Amygdalota', 'Αμυγδαλωτά', 420, 11, 50, 20, 40],
  ['moustalevria', 'Moustalevria', 'Μουσταλευριά', 110, 1, 26, 0.5, 150],
  ['spoon-cherry', 'Sour cherry spoon sweet', 'Γλυκό κουταλιού βύσσινο', 250, 0.5, 62, 0.2, 40],
  ['spoon-quince', 'Quince spoon sweet', 'Γλυκό κουταλιού κυδώνι', 240, 0.5, 60, 0.2, 40],
  ['tahinomelo', 'Tahini with honey', 'Ταχινόμελο', 480, 10, 45, 30, 30],
  ['loukoumi', 'Loukoumi', 'Λουκούμι', 320, 0.5, 80, 0.3, 30],
  ['halva-tahini', 'Tahini halva', 'Χαλβάς ταχινένιος', 520, 12, 45, 32, 40],
  ['red-wine', 'Red wine', 'Κόκκινο κρασί', 83, 0.1, 2.6, 0, 150],
  ['retsina', 'Retsina', 'Ρετσίνα', 80, 0.1, 2.5, 0, 150],
  ['ouzo', 'Ouzo', 'Ούζο', 220, 0, 8, 0, 50],
  ['tsipouro', 'Tsipouro', 'Τσίπουρο', 220, 0, 0.5, 0, 50],
  ['kalamata-olives', 'Kalamata olives', 'Ελιές Καλαμών', 160, 1, 5, 15, 30],
  ['throumbes', 'Throumbes olives', 'Ελιές θρούμπες', 150, 1, 4, 14, 30],
  ['pickled-peppers', 'Pickled peppers', 'Πιπεριές τουρσί', 25, 1, 5, 0.3, 50],
  ['horta', 'Wild greens', 'Χόρτα', 35, 3, 5, 0.5, 150],
  ['stamnagathi', 'Stamnagathi', 'Σταμναγκάθι', 40, 3, 5, 1, 120],
  ['artichoke', 'Artichoke', 'Αγκινάρα', 50, 3.5, 11, 0.4, 120],
  ['okra', 'Okra', 'Μπάμιες', 35, 2, 7, 0.3, 150],
  ['leeks', 'Leeks', 'Πράσα', 60, 1.5, 14, 0.3, 100],
  ['strained-yogurt-10', 'Strained yogurt 10%', 'Στραγγιστό γιαούρτι 10%', 120, 9, 4, 7, 150],
  ['goat-cheese', 'Goat cheese', 'Κατσικίσιο τυρί', 290, 20, 2, 22, 40],
  ['watermelon', 'Watermelon', 'Καρπούζι', 30, 0.6, 7.6, 0.2, 200],
  ['quince', 'Quince', 'Κυδώνι', 57, 0.4, 15.3, 0.1, 150],
];

export const pack2Foods: Food[] = pack2FoodData.map(([id, name_en, name_el, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, serving_grams]) => ({ id, name_en, name_el, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, serving_grams, source: 'Daily Plate starter library' }));

export const pack2Recipes: Recipe[] = [
  {
    id: 'koulouri-cheese', name_en: 'Koulouri with cheese', name_el: 'Κουλούρι με τυρί', diet: 'vegetarian', servings: 1,
    ingredients: [{ name_en: 'Koulouri Thessalonikis', name_el: 'Κουλούρι', amount: 80, unit: 'g' }, { name_en: 'Graviera', name_el: 'Γραβιέρα', amount: 30, unit: 'g' }, { name_en: 'Tomato', name_el: 'Ντομάτα', amount: 50, unit: 'g' }],
    instructions_en: 'Slice the koulouri and fill with graviera and tomato.', instructions_el: 'Κόψε το κουλούρι και γέμισε με γραβιέρα και ντομάτα.', calories: 350, protein: 15, carbs: 47, fat: 13,
  },
  {
    id: 'strapatsada', name_en: 'Strapatsada', name_el: 'Στραπατσάδα', diet: 'vegetarian', servings: 1,
    ingredients: [{ name_en: 'Egg', name_el: 'Αυγό', amount: 100, unit: 'g' }, { name_en: 'Tomato', name_el: 'Ντομάτα', amount: 150, unit: 'g' }, { name_en: 'Feta', name_el: 'Φέτα', amount: 30, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 8, unit: 'g' }],
    instructions_en: 'Soften tomato in olive oil, stir in beaten eggs and feta until just set.', instructions_el: 'Σόταρε τη ντομάτα στο λάδι, πρόσθεσε τα αυγά και τη φέτα και ανακάτεψε μέχρι να δέσει.', calories: 320, protein: 18, carbs: 8, fat: 24,
  },
  {
    id: 'trahana-soup', name_en: 'Trahana soup', name_el: 'Τραχανόσουπα', diet: 'vegetarian', servings: 2,
    ingredients: [{ name_en: 'Trahana (dry)', name_el: 'Τραχανάς', amount: 80, unit: 'g' }, { name_en: 'Semi-skimmed milk', name_el: 'Γάλα με χαμηλά λιπαρά', amount: 200, unit: 'g' }, { name_en: 'Feta', name_el: 'Φέτα', amount: 30, unit: 'g' }, { name_en: 'Butter', name_el: 'Βούτυρο', amount: 10, unit: 'g' }],
    instructions_en: 'Simmer trahana in milk until creamy, finish with feta and butter.', instructions_el: 'Βράσε τον τραχανά στο γάλα μέχρι να γίνει κρέμα, πρόσθεσε φέτα και βούτυρο.', calories: 265, protein: 11, carbs: 33, fat: 10,
  },
  {
    id: 'village-omelet', name_en: 'Village omelet', name_el: 'Χωριάτικη ομελέτα', diet: 'vegetarian', servings: 1,
    ingredients: [{ name_en: 'Egg', name_el: 'Αυγό', amount: 100, unit: 'g' }, { name_en: 'Potato', name_el: 'Πατάτα', amount: 100, unit: 'g' }, { name_en: 'Onion', name_el: 'Κρεμμύδι', amount: 40, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 8, unit: 'g' }, { name_en: 'Feta', name_el: 'Φέτα', amount: 20, unit: 'g' }],
    instructions_en: 'Crisp the potato, add onion and beaten eggs with feta, and cook until set.', instructions_el: 'Τσιγάρισε την πατάτα, πρόσθεσε κρεμμύδι, αυγά και φέτα και ψήσε μέχρι να δέσει.', calories: 360, protein: 18, carbs: 23, fat: 22,
  },
  {
    id: 'honey-yogurt-pasteli', name_en: 'Yogurt with honey and pasteli', name_el: 'Γιαούρτι με μέλι και παστέλι', diet: 'vegetarian', servings: 1,
    ingredients: [{ name_en: 'Greek yogurt', name_el: 'Γιαούρτι', amount: 170, unit: 'g' }, { name_en: 'Honey', name_el: 'Μέλι', amount: 15, unit: 'g' }, { name_en: 'Pasteli', name_el: 'Παστέλι', amount: 20, unit: 'g' }],
    instructions_en: 'Top yogurt with honey and pasteli pieces.', instructions_el: 'Πρόσθεσε στο γιαούρτι μέλι και κομμάτια παστέλι.', calories: 260, protein: 19, carbs: 30, fat: 8,
  },
  {
    id: 'lagana-halva', name_en: 'Lagana with tahini halva', name_el: 'Λαγάνα με χαλβά', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Lagana bread', name_el: 'Λαγάνα', amount: 60, unit: 'g' }, { name_en: 'Tahini halva', name_el: 'Χαλβάς ταχινένιος', amount: 40, unit: 'g' }],
    instructions_en: 'Serve lagana slices with tahini halva.', instructions_el: 'Σέρβιρε φέτες λαγάνας με ταχινένιο χαλβά.', calories: 360, protein: 10, carbs: 49, fat: 15,
  },
  {
    id: 'feta-toast', name_en: 'Feta toast', name_el: 'Φρυγανιά με φέτα', diet: 'vegetarian', servings: 1,
    ingredients: [{ name_en: 'Wholegrain bread', name_el: 'Ψωμί ολικής', amount: 80, unit: 'g' }, { name_en: 'Feta', name_el: 'Φέτα', amount: 30, unit: 'g' }, { name_en: 'Tomato', name_el: 'Ντομάτα', amount: 60, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 5, unit: 'g' }],
    instructions_en: 'Toast the bread, top with feta, tomato, and a drizzle of oil.', instructions_el: 'Φρυγάνισε το ψωμί και πρόσθεσε φέτα, ντομάτα και λίγο λάδι.', calories: 330, protein: 15, carbs: 36, fat: 15,
  },
  {
    id: 'village-salad', name_en: 'Greek village salad', name_el: 'Χωριάτικη σαλάτα', diet: 'vegetarian', servings: 1,
    ingredients: [{ name_en: 'Tomato', name_el: 'Ντομάτα', amount: 150, unit: 'g' }, { name_en: 'Cucumber', name_el: 'Αγγούρι', amount: 100, unit: 'g' }, { name_en: 'Onion', name_el: 'Κρεμμύδι', amount: 40, unit: 'g' }, { name_en: 'Feta', name_el: 'Φέτα', amount: 50, unit: 'g' }, { name_en: 'Olives', name_el: 'Ελιές', amount: 30, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 12, unit: 'g' }],
    instructions_en: 'Chop vegetables, top with feta and olives, dress with oil and oregano.', instructions_el: 'Κόψε τα λαχανικά, πρόσθεσε φέτα και ελιές, ράντισε με λάδι και ρίγανη.', calories: 330, protein: 10, carbs: 17, fat: 26,
  },
  {
    id: 'octopus-salad', name_en: 'Octopus salad', name_el: 'Χταποδοσαλάτα', diet: 'balanced', servings: 1,
    ingredients: [{ name_en: 'Grilled octopus', name_el: 'Χταπόδι ψητό', amount: 150, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 10, unit: 'g' }, { name_en: 'Onion', name_el: 'Κρεμμύδι', amount: 30, unit: 'g' }, { name_en: 'Parsley', name_el: 'Μαϊντανός', amount: 10, unit: 'g' }, { name_en: 'Lemon', name_el: 'Λεμόνι', amount: 10, unit: 'g' }],
    instructions_en: 'Slice octopus and toss with oil, onion, parsley, and lemon.', instructions_el: 'Κόψε το χταπόδι και ανακάτεψε με λάδι, κρεμμύδι, μαϊντανό και λεμόνι.', calories: 270, protein: 31, carbs: 7, fat: 13,
  },
  {
    id: 'beet-skordalia', name_en: 'Beetroot with skordalia', name_el: 'Παντζάρια με σκορδαλιά', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Beetroot', name_el: 'Παντζάρι', amount: 200, unit: 'g' }, { name_en: 'Skordalia', name_el: 'Σκορδαλιά', amount: 60, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 5, unit: 'g' }],
    instructions_en: 'Boil beets, slice, and serve with skordalia and oil.', instructions_el: 'Βράσε τα παντζάρια, κόψε σε φέτες και σέρβιρε με σκορδαλιά και λάδι.', calories: 280, protein: 4, carbs: 35, fat: 15,
  },
  {
    id: 'horta-plate', name_en: 'Horta with olive oil', name_el: 'Χόρτα με λάδι', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Wild greens', name_el: 'Χόρτα', amount: 250, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 12, unit: 'g' }, { name_en: 'Lemon', name_el: 'Λεμόνι', amount: 15, unit: 'g' }],
    instructions_en: 'Boil greens until tender, drain, and dress with oil and lemon.', instructions_el: 'Βράσε τα χόρτα, στράγγιξε και ράντισε με λάδι και λεμόνι.', calories: 200, protein: 8, carbs: 14, fat: 13,
  },
  {
    id: 'tuna-salad-greek', name_en: 'Tuna salad', name_el: 'Τονοσαλάτα', diet: 'balanced', servings: 1,
    ingredients: [{ name_en: 'Tuna in water', name_el: 'Τόνος', amount: 120, unit: 'g' }, { name_en: 'Tomato', name_el: 'Ντομάτα', amount: 100, unit: 'g' }, { name_en: 'Cucumber', name_el: 'Αγγούρι', amount: 80, unit: 'g' }, { name_en: 'Onion', name_el: 'Κρεμμύδι', amount: 30, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 10, unit: 'g' }, { name_en: 'Olives', name_el: 'Ελιές', amount: 20, unit: 'g' }],
    instructions_en: 'Flake tuna over chopped vegetables, olives, and oil.', instructions_el: 'Σκόρπισε τον τόνο πάνω σε ψιλοκομμένα λαχανικά, ελιές και λάδι.', calories: 290, protein: 33, carbs: 11, fat: 14,
  },
  {
    id: 'kopanisti-plate', name_en: 'Kopanisti with rusks', name_el: 'Κοπανιστή με παξιμάδι', diet: 'vegetarian', servings: 1,
    ingredients: [{ name_en: 'Kopanisti', name_el: 'Κοπανιστή', amount: 60, unit: 'g' }, { name_en: 'Barley rusk', name_el: 'Παξιμάδι κρίθινο', amount: 40, unit: 'g' }, { name_en: 'Tomato', name_el: 'Ντομάτα', amount: 80, unit: 'g' }],
    instructions_en: 'Spread kopanisti on rusks and top with tomato.', instructions_el: 'Άλειψε την κοπανιστή στο παξιμάδι και πρόσθεσε ντομάτα.', calories: 320, protein: 14, carbs: 33, fat: 15,
  },
  {
    id: 'halloumi-salad', name_en: 'Halloumi salad', name_el: 'Σαλάτα με χαλούμι', diet: 'vegetarian', servings: 1,
    ingredients: [{ name_en: 'Halloumi', name_el: 'Χαλούμι', amount: 60, unit: 'g' }, { name_en: 'Lettuce', name_el: 'Μαρούλι', amount: 80, unit: 'g' }, { name_en: 'Tomato', name_el: 'Ντομάτα', amount: 100, unit: 'g' }, { name_en: 'Cucumber', name_el: 'Αγγούρι', amount: 60, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 10, unit: 'g' }],
    instructions_en: 'Grill halloumi and serve over salad with olive oil.', instructions_el: 'Ψήσε το χαλούμι και σέρβιρε πάνω σε σαλάτα με ελαιόλαδο.', calories: 320, protein: 16, carbs: 10, fat: 25,
  },
  {
    id: 'lentil-salad', name_en: 'Lentil salad', name_el: 'Φακοσαλάτα', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Cooked lentils', name_el: 'Φακές', amount: 180, unit: 'g' }, { name_en: 'Tomato', name_el: 'Ντομάτα', amount: 80, unit: 'g' }, { name_en: 'Onion', name_el: 'Κρεμμύδι', amount: 40, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 10, unit: 'g' }, { name_en: 'Parsley', name_el: 'Μαϊντανός', amount: 10, unit: 'g' }],
    instructions_en: 'Toss lentils with chopped vegetables, parsley, oil, and lemon.', instructions_el: 'Ανακάτεψε τις φακές με λαχανικά, μαϊντανό, λάδι και λεμόνι.', calories: 330, protein: 18, carbs: 43, fat: 11,
  },
  {
    id: 'artichoke-salad', name_en: 'Artichoke salad', name_el: 'Σαλάτα αγκινάρας', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Artichoke', name_el: 'Αγκινάρα', amount: 200, unit: 'g' }, { name_en: 'Carrot', name_el: 'Καρότο', amount: 60, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 10, unit: 'g' }, { name_en: 'Lemon', name_el: 'Λεμόνι', amount: 15, unit: 'g' }],
    instructions_en: 'Boil artichokes, slice, and dress with carrot, oil, and lemon.', instructions_el: 'Βράσε τις αγκινάρες, κόψε σε φέτες και ράντισε με καρότο, λάδι και λεμόνι.', calories: 220, protein: 8, carbs: 29, fat: 11,
  },
  {
    id: 'stifado', name_en: 'Beef stifado', name_el: 'Μοσχάρι στιφάδο', diet: 'balanced', servings: 2,
    ingredients: [{ name_en: 'Lean beef', name_el: 'Μοσχάρι', amount: 300, unit: 'g' }, { name_en: 'Onion', name_el: 'Κρεμμύδι', amount: 250, unit: 'g' }, { name_en: 'Tomato sauce', name_el: 'Σάλτσα ντομάτας', amount: 150, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 15, unit: 'g' }, { name_en: 'Red wine', name_el: 'Κόκκινο κρασί', amount: 60, unit: 'g' }],
    instructions_en: 'Brown beef, add whole shallots, wine, and tomato. Braise until silky.', instructions_el: 'Σόταρε το μοσχάρι, πρόσθεσε κρεμμυδάκια, κρασί και ντομάτα. Σιγόβρασε μέχρι να μελώσει.', calories: 425, protein: 41, carbs: 17, fat: 18,
  },
  {
    id: 'kleftiko', name_en: 'Lamb kleftiko', name_el: 'Κλέφτικο', diet: 'balanced', servings: 2,
    ingredients: [{ name_en: 'Lean lamb', name_el: 'Αρνί', amount: 300, unit: 'g' }, { name_en: 'Potato', name_el: 'Πατάτα', amount: 300, unit: 'g' }, { name_en: 'Tomato', name_el: 'Ντομάτα', amount: 100, unit: 'g' }, { name_en: 'Onion', name_el: 'Κρεμμύδι', amount: 60, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 15, unit: 'g' }, { name_en: 'Lemon', name_el: 'Λεμόνι', amount: 15, unit: 'g' }],
    instructions_en: 'Wrap lamb and vegetables in parchment with lemon and oil. Slow-roast until falling apart.', instructions_el: 'Τύλιξε αρνί και λαχανικά σε λαδόκολλα με λεμόνι και λάδι. Ψήσε αργά μέχρι να λιώνει.', calories: 510, protein: 41, carbs: 32, fat: 24,
  },
  {
    id: 'psari-plaki', name_en: 'Psari plaki', name_el: 'Ψάρι πλακί', diet: 'balanced', servings: 2,
    ingredients: [{ name_en: 'White fish', name_el: 'Λευκό ψάρι', amount: 300, unit: 'g' }, { name_en: 'Tomato', name_el: 'Ντομάτα', amount: 200, unit: 'g' }, { name_en: 'Onion', name_el: 'Κρεμμύδι', amount: 100, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 20, unit: 'g' }, { name_en: 'Parsley', name_el: 'Μαϊντανός', amount: 10, unit: 'g' }],
    instructions_en: 'Bake fish over tomato and onion with olive oil and parsley.', instructions_el: 'Ψήσε το ψάρι πάνω σε ντομάτα και κρεμμύδι με ελαιόλαδο και μαϊντανό.', calories: 290, protein: 36, carbs: 9, fat: 13,
  },
  {
    id: 'shrimp-saganaki', name_en: 'Shrimp saganaki', name_el: 'Γαρίδες σαγανάκι', diet: 'balanced', servings: 1,
    ingredients: [{ name_en: 'Shrimp', name_el: 'Γαρίδες', amount: 200, unit: 'g' }, { name_en: 'Tomato sauce', name_el: 'Σάλτσα ντομάτας', amount: 120, unit: 'g' }, { name_en: 'Feta', name_el: 'Φέτα', amount: 40, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 10, unit: 'g' }],
    instructions_en: 'Simmer shrimp in tomato sauce, crumble feta on top, and finish in the oven.', instructions_el: 'Σιγόβρασε τις γαρίδες στη σάλτσα, τρίψε φέτα από πάνω και τελείωσε στον φούρνο.', calories: 430, protein: 55, carbs: 9, fat: 20,
  },
  {
    id: 'gigantes-plaki', name_en: 'Baked gigantes', name_el: 'Γίγαντες φούρνου', diet: 'vegan', servings: 2,
    ingredients: [{ name_en: 'Cooked white beans', name_el: 'Φασόλια', amount: 300, unit: 'g' }, { name_en: 'Tomato sauce', name_el: 'Σάλτσα ντομάτας', amount: 150, unit: 'g' }, { name_en: 'Onion', name_el: 'Κρεμμύδι', amount: 80, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 20, unit: 'g' }],
    instructions_en: 'Bake beans with tomato, onion, and plenty of olive oil until caramelized.', instructions_el: 'Ψήσε τα φασόλια με ντομάτα, κρεμμύδι και μπόλικο ελαιόλαδο μέχρι να καραμελώσουν.', calories: 320, protein: 15, carbs: 42, fat: 11,
  },
  {
    id: 'revithada', name_en: 'Revithada', name_el: 'Ρεβυθάδα', diet: 'vegan', servings: 2,
    ingredients: [{ name_en: 'Cooked chickpeas', name_el: 'Ρεβίθια', amount: 300, unit: 'g' }, { name_en: 'Onion', name_el: 'Κρεμμύδι', amount: 80, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 20, unit: 'g' }, { name_en: 'Lemon', name_el: 'Λεμόνι', amount: 15, unit: 'g' }],
    instructions_en: 'Slow-bake chickpeas with onion, lemon, and olive oil until creamy.', instructions_el: 'Ψήσε αργά τα ρεβίθια με κρεμμύδι, λεμόνι και ελαιόλαδο μέχρι να γίνουν κρέμα.', calories: 350, protein: 14, carbs: 45, fat: 14,
  },
  {
    id: 'prasorizo', name_en: 'Prasorizo', name_el: 'Πρασόρυζο', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Leeks', name_el: 'Πράσα', amount: 200, unit: 'g' }, { name_en: 'Cooked white rice', name_el: 'Ρύζι άσπρο μαγειρεμένο', amount: 120, unit: 'g' }, { name_en: 'Onion', name_el: 'Κρεμμύδι', amount: 40, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 10, unit: 'g' }],
    instructions_en: 'Soften leeks and onion in oil, fold through rice, and finish with lemon.', instructions_el: 'Σόταρε πράσα και κρεμμύδι στο λάδι, πρόσθεσε ρύζι και τελείωσε με λεμόνι.', calories: 380, protein: 6, carbs: 65, fat: 11,
  },
  {
    id: 'aginares-polita', name_en: 'Aginares a la polita', name_el: 'Αγκινάρες αλά πολίτα', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Artichoke', name_el: 'Αγκινάρα', amount: 250, unit: 'g' }, { name_en: 'Carrot', name_el: 'Καρότο', amount: 80, unit: 'g' }, { name_en: 'Potato', name_el: 'Πατάτα', amount: 100, unit: 'g' }, { name_en: 'Onion', name_el: 'Κρεμμύδι', amount: 60, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 15, unit: 'g' }],
    instructions_en: 'Braise artichokes with carrot, potato, and onion in olive oil and lemon.', instructions_el: 'Σιγόβρασε αγκινάρες με καρότο, πατάτα και κρεμμύδι σε ελαιόλαδο και λεμόνι.', calories: 400, protein: 12, carbs: 60, fat: 16,
  },
  {
    id: 'papoutsakia', name_en: 'Melitzanes papoutsakia', name_el: 'Παπουτσάκια', diet: 'balanced', servings: 2,
    ingredients: [{ name_en: 'Eggplant', name_el: 'Μελιτζάνα', amount: 400, unit: 'g' }, { name_en: 'Lean beef', name_el: 'Μοσχάρι', amount: 200, unit: 'g' }, { name_en: 'Tomato sauce', name_el: 'Σάλτσα ντομάτας', amount: 150, unit: 'g' }, { name_en: 'Onion', name_el: 'Κρεμμύδι', amount: 60, unit: 'g' }, { name_en: 'Parmesan', name_el: 'Παρμεζάνα', amount: 30, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 15, unit: 'g' }],
    instructions_en: 'Halve and roast eggplants, fill with beef-tomato mince, top with parmesan, and bake.', instructions_el: 'Κόψε τις μελιτζάνες στη μέση, ψήσε, γέμισε με κιμά-ντομάτα, πασπάλισε παρμεζάνα και ξαναψήσε.', calories: 390, protein: 35, carbs: 20, fat: 20,
  },
  {
    id: 'tomatokeftedes', name_en: 'Tomatokeftedes', name_el: 'Ντοματοκεφτέδες', diet: 'vegetarian', servings: 2,
    ingredients: [{ name_en: 'Tomato', name_el: 'Ντομάτα', amount: 400, unit: 'g' }, { name_en: 'Onion', name_el: 'Κρεμμύδι', amount: 80, unit: 'g' }, { name_en: 'Feta', name_el: 'Φέτα', amount: 60, unit: 'g' }, { name_en: 'Flour', name_el: 'Αλεύρι', amount: 60, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 20, unit: 'g' }],
    instructions_en: 'Mix chopped tomato with onion, feta, and flour. Pan-fry spoonfuls until golden.', instructions_el: 'Ανακάτεψε ντομάτα με κρεμμύδι, φέτα και αλεύρι. Τηγάνισε κουταλιές μέχρι να ροδίσουν.', calories: 320, protein: 10, carbs: 35, fat: 17,
  },
  {
    id: 'keftedes', name_en: 'Greek keftedes', name_el: 'Κεφτέδες', diet: 'balanced', servings: 2,
    ingredients: [{ name_en: 'Lean beef', name_el: 'Μοσχάρι', amount: 250, unit: 'g' }, { name_en: 'Onion', name_el: 'Κρεμμύδι', amount: 60, unit: 'g' }, { name_en: 'Egg', name_el: 'Αυγό', amount: 50, unit: 'g' }, { name_en: 'Wholegrain bread', name_el: 'Ψωμί ολικής', amount: 40, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 15, unit: 'g' }],
    instructions_en: 'Mix mince with onion, egg, and soaked bread. Shape and pan-fry until browned.', instructions_el: 'Ανακάτεψε τον κιμά με κρεμμύδι, αυγό και μουλιασμένο ψωμί. Πλάσε και τηγάνισε.', calories: 380, protein: 39, carbs: 11, fat: 20,
  },
  {
    id: 'mushroom-kritharoto', name_en: 'Mushroom kritharoto', name_el: 'Κριθαρότο μανιταριών', diet: 'vegetarian', servings: 1,
    ingredients: [{ name_en: 'Wholewheat pasta cooked', name_el: 'Ζυμαρικά ολικής', amount: 200, unit: 'g' }, { name_en: 'Mushrooms', name_el: 'Μανιτάρια', amount: 150, unit: 'g' }, { name_en: 'Parmesan', name_el: 'Παρμεζάνα', amount: 20, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 10, unit: 'g' }, { name_en: 'Onion', name_el: 'Κρεμμύδι', amount: 50, unit: 'g' }],
    instructions_en: 'Sear mushrooms and onion, fold through orzo with parmesan until creamy.', instructions_el: 'Σόταρε μανιτάρια και κρεμμύδι, πρόσθεσε κριθαράκι με παρμεζάνα μέχρι να γίνει κρεμώδες.', calories: 520, protein: 24, carbs: 71, fat: 19,
  },
  {
    id: 'hilopites-chicken', name_en: 'Hilopites with chicken', name_el: 'Χυλοπίτες με κοτόπουλο', diet: 'balanced', servings: 1,
    ingredients: [{ name_en: 'Cooked hilopites', name_el: 'Χυλοπίτες', amount: 180, unit: 'g' }, { name_en: 'Chicken breast', name_el: 'Κοτόπουλο', amount: 120, unit: 'g' }, { name_en: 'Tomato sauce', name_el: 'Σάλτσα ντομάτας', amount: 80, unit: 'g' }, { name_en: 'Parmesan', name_el: 'Παρμεζάνα', amount: 15, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 8, unit: 'g' }],
    instructions_en: 'Simmer chicken in tomato sauce and serve over hilopites with parmesan.', instructions_el: 'Σιγόβρασε το κοτόπουλο στη σάλτσα και σέρβιρε πάνω σε χυλοπίτες με παρμεζάνα.', calories: 630, protein: 53, carbs: 59, fat: 20,
  },
  {
    id: 'moussaka-full', name_en: 'Classic moussaka', name_el: 'Μουσακάς', diet: 'balanced', servings: 2,
    ingredients: [{ name_en: 'Lean beef', name_el: 'Μοσχάρι', amount: 250, unit: 'g' }, { name_en: 'Eggplant', name_el: 'Μελιτζάνα', amount: 300, unit: 'g' }, { name_en: 'Potato', name_el: 'Πατάτα', amount: 200, unit: 'g' }, { name_en: 'Tomato sauce', name_el: 'Σάλτσα ντομάτας', amount: 150, unit: 'g' }, { name_en: 'Semi-skimmed milk', name_el: 'Γάλα με χαμηλά λιπαρά', amount: 100, unit: 'g' }, { name_en: 'Egg', name_el: 'Αυγό', amount: 50, unit: 'g' }, { name_en: 'Parmesan', name_el: 'Παρμεζάνα', amount: 20, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 15, unit: 'g' }],
    instructions_en: 'Layer roasted eggplant, potato, and beef-tomato. Crown with béchamel and bake golden.', instructions_el: 'Στρώσε μελιτζάνα, πατάτα και μοσχάρι-ντομάτα. Σκέπασε με μπεσαμέλ και ψήσε μέχρι να ροδίσει.', calories: 520, protein: 46, carbs: 34, fat: 23,
  },
  {
    id: 'tourlou', name_en: 'Tourlou', name_el: 'Τουρλού', diet: 'vegan', servings: 2,
    ingredients: [{ name_en: 'Potato', name_el: 'Πατάτα', amount: 250, unit: 'g' }, { name_en: 'Zucchini', name_el: 'Κολοκύθι', amount: 200, unit: 'g' }, { name_en: 'Eggplant', name_el: 'Μελιτζάνα', amount: 150, unit: 'g' }, { name_en: 'Tomato', name_el: 'Ντομάτα', amount: 200, unit: 'g' }, { name_en: 'Onion', name_el: 'Κρεμμύδι', amount: 80, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 20, unit: 'g' }],
    instructions_en: 'Bake mixed vegetables with tomato and olive oil until melting soft.', instructions_el: 'Ψήσε ανάμεικτα λαχανικά με ντομάτα και ελαιόλαδο μέχρι να μαλακώσουν.', calories: 250, protein: 6, carbs: 37, fat: 11,
  },
  {
    id: 'bamies-tomato', name_en: 'Bamies with tomato', name_el: 'Μπάμιες με ντομάτα', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Okra', name_el: 'Μπάμιες', amount: 300, unit: 'g' }, { name_en: 'Tomato', name_el: 'Ντομάτα', amount: 200, unit: 'g' }, { name_en: 'Onion', name_el: 'Κρεμμύδι', amount: 80, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 15, unit: 'g' }],
    instructions_en: 'Braise okra with tomato and onion in olive oil until tender.', instructions_el: 'Σιγόβρασε τις μπάμιες με ντομάτα και κρεμμύδι σε ελαιόλαδο.', calories: 310, protein: 9, carbs: 36, fat: 16,
  },
  {
    id: 'sardeles-fournou', name_en: 'Baked sardines', name_el: 'Σαρδέλες φούρνου', diet: 'balanced', servings: 1,
    ingredients: [{ name_en: 'Sardines', name_el: 'Σαρδέλες', amount: 200, unit: 'g' }, { name_en: 'Tomato', name_el: 'Ντομάτα', amount: 100, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 10, unit: 'g' }, { name_en: 'Lemon', name_el: 'Λεμόνι', amount: 15, unit: 'g' }, { name_en: 'Onion', name_el: 'Κρεμμύδι', amount: 40, unit: 'g' }],
    instructions_en: 'Bake sardines with tomato, onion, lemon, and olive oil.', instructions_el: 'Ψήσε τις σαρδέλες με ντομάτα, κρεμμύδι, λεμόνι και ελαιόλαδο.', calories: 540, protein: 51, carbs: 9, fat: 32,
  },
  {
    id: 'gavros-tiganitos', name_en: 'Fried gavros', name_el: 'Γαύρος τηγανητός', diet: 'balanced', servings: 1,
    ingredients: [{ name_en: 'Marinated gavros', name_el: 'Γαύρος', amount: 200, unit: 'g' }, { name_en: 'Flour', name_el: 'Αλεύρι', amount: 30, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 15, unit: 'g' }],
    instructions_en: 'Dredge gavros in flour and fry until crisp. Serve with lemon.', instructions_el: 'Πέρασε τον γαύρο από αλεύρι και τηγάνισε μέχρι να γίνει τραγανός. Σέρβιρε με λεμόνι.', calories: 540, protein: 43, carbs: 22, fat: 27,
  },
  {
    id: 'soupies-stew', name_en: 'Cuttlefish stew', name_el: 'Σουπιές στιφάδο', diet: 'balanced', servings: 1,
    ingredients: [{ name_en: 'Cuttlefish', name_el: 'Σουπιά', amount: 250, unit: 'g' }, { name_en: 'Onion', name_el: 'Κρεμμύδι', amount: 100, unit: 'g' }, { name_en: 'Tomato sauce', name_el: 'Σάλτσα ντομάτας', amount: 100, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 12, unit: 'g' }, { name_en: 'Cooked white rice', name_el: 'Ρύζι άσπρο μαγειρεμένο', amount: 60, unit: 'g' }],
    instructions_en: 'Braise cuttlefish with onion and tomato. Serve with rice.', instructions_el: 'Σιγόβρασε τις σουπιές με κρεμμύδι και ντομάτα. Σέρβιρε με ρύζι.', calories: 480, protein: 44, carbs: 37, fat: 15,
  },
  {
    id: 'mydia-saganaki', name_en: 'Mussels saganaki', name_el: 'Μύδια σαγανάκι', diet: 'balanced', servings: 1,
    ingredients: [{ name_en: 'Mussels', name_el: 'Μύδια', amount: 200, unit: 'g' }, { name_en: 'Tomato sauce', name_el: 'Σάλτσα ντομάτας', amount: 100, unit: 'g' }, { name_en: 'Feta', name_el: 'Φέτα', amount: 30, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 10, unit: 'g' }],
    instructions_en: 'Simmer mussels in tomato sauce, crumble feta, and gratinate.', instructions_el: 'Σιγόβρασε τα μύδια στη σάλτσα, τρίψε φέτα και γκρατινάρισε.', calories: 390, protein: 30, carbs: 15, fat: 22,
  },
  {
    id: 'xifias-psitos', name_en: 'Grilled swordfish', name_el: 'Ξιφίας ψητός', diet: 'balanced', servings: 1,
    ingredients: [{ name_en: 'Swordfish', name_el: 'Ξιφίας', amount: 180, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 10, unit: 'g' }, { name_en: 'Lemon', name_el: 'Λεμόνι', amount: 15, unit: 'g' }, { name_en: 'Onion', name_el: 'Κρεμμύδι', amount: 30, unit: 'g' }],
    instructions_en: 'Grill swordfish steaks and dress with oil, lemon, and onion.', instructions_el: 'Ψήσε τον ξιφία και ράντισε με λάδι, λεμόνι και κρεμμύδι.', calories: 370, protein: 42, carbs: 4, fat: 19,
  },
  {
    id: 'kotopoulo-krasato', name_en: 'Chicken in wine', name_el: 'Κοτόπουλο κρασάτο', diet: 'balanced', servings: 2,
    ingredients: [{ name_en: 'Chicken thigh', name_el: 'Μπούτι κοτόπουλο', amount: 300, unit: 'g' }, { name_en: 'Onion', name_el: 'Κρεμμύδι', amount: 100, unit: 'g' }, { name_en: 'Red wine', name_el: 'Κόκκινο κρασί', amount: 100, unit: 'g' }, { name_en: 'Tomato', name_el: 'Ντομάτα', amount: 100, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 12, unit: 'g' }],
    instructions_en: 'Brown chicken, deglaze with wine, add tomato, and braise until tender.', instructions_el: 'Σόταρε το κοτόπουλο, σβήσε με κρασί, πρόσθεσε ντομάτα και σιγόβρασε.', calories: 440, protein: 40, carbs: 8, fat: 23,
  },
  {
    id: 'octopus-stifado', name_en: 'Octopus stifado', name_el: 'Χταπόδι στιφάδο', diet: 'balanced', servings: 1,
    ingredients: [{ name_en: 'Grilled octopus', name_el: 'Χταπόδι', amount: 250, unit: 'g' }, { name_en: 'Onion', name_el: 'Κρεμμύδι', amount: 200, unit: 'g' }, { name_en: 'Tomato sauce', name_el: 'Σάλτσα ντομάτας', amount: 100, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 12, unit: 'g' }, { name_en: 'Red wine', name_el: 'Κόκκινο κρασί', amount: 40, unit: 'g' }],
    instructions_en: 'Braise octopus with whole shallots, wine, and tomato until tender.', instructions_el: 'Σιγόβρασε το χταπόδι με κρεμμυδάκια, κρασί και ντομάτα.', calories: 520, protein: 54, carbs: 30, fat: 17,
  },
  {
    id: 'tahini-soup', name_en: 'Tahini soup', name_el: 'Ταχινόσουπα', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Tahini', name_el: 'Ταχίνι', amount: 40, unit: 'g' }, { name_en: 'Potato', name_el: 'Πατάτα', amount: 150, unit: 'g' }, { name_en: 'Carrot', name_el: 'Καρότο', amount: 80, unit: 'g' }, { name_en: 'Onion', name_el: 'Κρεμμύδι', amount: 50, unit: 'g' }, { name_en: 'Lemon', name_el: 'Λεμόνι', amount: 15, unit: 'g' }],
    instructions_en: 'Simmer vegetables until soft, whisk in tahini and lemon, and blend.', instructions_el: 'Βράσε τα λαχανικά, πρόσθεσε ταχίνι και λεμόνι και πολτοποίησε.', calories: 410, protein: 11, carbs: 48, fat: 22,
  },
  {
    id: 'lagana-tarama', name_en: 'Lagana with taramosalata', name_el: 'Λαγάνα με ταραμοσαλάτα', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Lagana bread', name_el: 'Λαγάνα', amount: 80, unit: 'g' }, { name_en: 'Taramosalata', name_el: 'Ταραμοσαλάτα', amount: 50, unit: 'g' }],
    instructions_en: 'Serve lagana with taramosalata and lemon.', instructions_el: 'Σέρβιρε λαγάνα με ταραμοσαλάτα και λεμόνι.', calories: 380, protein: 7, carbs: 48, fat: 19,
  },
  {
    id: 'fakes-soup', name_en: 'Fakes lentil soup', name_el: 'Φακές σούπα', diet: 'vegan', servings: 2,
    ingredients: [{ name_en: 'Cooked lentils', name_el: 'Φακές', amount: 350, unit: 'g' }, { name_en: 'Onion', name_el: 'Κρεμμύδι', amount: 80, unit: 'g' }, { name_en: 'Carrot', name_el: 'Καρότο', amount: 80, unit: 'g' }, { name_en: 'Tomato', name_el: 'Ντομάτα', amount: 100, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 20, unit: 'g' }],
    instructions_en: 'Simmer lentils with vegetables, finish with olive oil and vinegar.', instructions_el: 'Σιγόβρασε τις φακές με λαχανικά, τελείωσε με ελαιόλαδο και ξύδι.', calories: 330, protein: 17, carbs: 45, fat: 11,
  },
  {
    id: 'fasolakia', name_en: 'Fasolakia', name_el: 'Φασολάκια', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Green beans', name_el: 'Φασολάκια', amount: 300, unit: 'g' }, { name_en: 'Potato', name_el: 'Πατάτα', amount: 150, unit: 'g' }, { name_en: 'Tomato', name_el: 'Ντομάτα', amount: 150, unit: 'g' }, { name_en: 'Onion', name_el: 'Κρεμμύδι', amount: 60, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 15, unit: 'g' }],
    instructions_en: 'Braise green beans with potato, tomato, and onion in olive oil.', instructions_el: 'Σιγόβρασε τα φασολάκια με πατάτα, ντομάτα και κρεμμύδι σε ελαιόλαδο.', calories: 390, protein: 11, carbs: 59, fat: 16,
  },
  {
    id: 'mushroom-giouvetsi', name_en: 'Mushroom giouvetsi', name_el: 'Μανιτάρια γιουβέτσι', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Mushrooms', name_el: 'Μανιτάρια', amount: 250, unit: 'g' }, { name_en: 'Tomato sauce', name_el: 'Σάλτσα ντομάτας', amount: 150, unit: 'g' }, { name_en: 'Onion', name_el: 'Κρεμμύδι', amount: 60, unit: 'g' }, { name_en: 'Cooked bulgur', name_el: 'Πλιγούρι μαγειρεμένο', amount: 100, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 12, unit: 'g' }],
    instructions_en: 'Bake mushrooms with tomato and onion, serve over bulgur.', instructions_el: 'Ψήσε μανιτάρια με ντομάτα και κρεμμύδι, σέρβιρε πάνω σε πλιγούρι.', calories: 310, protein: 14, carbs: 41, fat: 14,
  },
  {
    id: 'potato-salad', name_en: 'Potato salad', name_el: 'Πατατοσαλάτα', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Potato', name_el: 'Πατάτα', amount: 300, unit: 'g' }, { name_en: 'Onion', name_el: 'Κρεμμύδι', amount: 60, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 12, unit: 'g' }, { name_en: 'Lemon', name_el: 'Λεμόνι', amount: 15, unit: 'g' }, { name_en: 'Parsley', name_el: 'Μαϊντανός', amount: 10, unit: 'g' }],
    instructions_en: 'Toss boiled potato with onion, parsley, oil, and lemon.', instructions_el: 'Ανακάτεψε βραστή πατάτα με κρεμμύδι, μαϊντανό, λάδι και λεμόνι.', calories: 370, protein: 7, carbs: 60, fat: 12,
  },
  {
    id: 'baked-apples', name_en: 'Baked apples with honey', name_el: 'Ψητά μήλα με μέλι', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Apple', name_el: 'Μήλο', amount: 250, unit: 'g' }, { name_en: 'Honey', name_el: 'Μέλι', amount: 20, unit: 'g' }, { name_en: 'Walnuts', name_el: 'Καρύδια', amount: 15, unit: 'g' }],
    instructions_en: 'Bake apples with honey and walnuts until soft and caramelized.', instructions_el: 'Ψήσε τα μήλα με μέλι και καρύδια μέχρι να μαλακώσουν.', calories: 290, protein: 3, carbs: 53, fat: 10,
  },
  {
    id: 'figs-yogurt', name_en: 'Figs with yogurt', name_el: 'Σύκα με γιαούρτι', diet: 'vegetarian', servings: 1,
    ingredients: [{ name_en: 'Fig', name_el: 'Σύκο', amount: 150, unit: 'g' }, { name_en: 'Greek yogurt', name_el: 'Γιαούρτι', amount: 100, unit: 'g' }, { name_en: 'Honey', name_el: 'Μέλι', amount: 10, unit: 'g' }, { name_en: 'Walnuts', name_el: 'Καρύδια', amount: 10, unit: 'g' }],
    instructions_en: 'Serve fresh figs over yogurt with honey and walnuts.', instructions_el: 'Σέρβιρε φρέσκα σύκα πάνω σε γιαούρτι με μέλι και καρύδια.', calories: 280, protein: 13, carbs: 42, fat: 9,
  },
  {
    id: 'watermelon-feta', name_en: 'Watermelon with feta', name_el: 'Καρπούζι με φέτα', diet: 'vegetarian', servings: 1,
    ingredients: [{ name_en: 'Watermelon', name_el: 'Καρπούζι', amount: 300, unit: 'g' }, { name_en: 'Feta', name_el: 'Φέτα', amount: 40, unit: 'g' }],
    instructions_en: 'Serve chilled watermelon with feta and mint.', instructions_el: 'Σέρβιρε κρύο καρπούζι με φέτα και δυόσμο.', calories: 200, protein: 8, carbs: 24, fat: 9,
  },
  {
    id: 'baked-quince', name_en: 'Baked quince', name_el: 'Κυδώνι ψητό', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Quince', name_el: 'Κυδώνι', amount: 250, unit: 'g' }, { name_en: 'Honey', name_el: 'Μέλι', amount: 15, unit: 'g' }, { name_en: 'Walnuts', name_el: 'Καρύδια', amount: 10, unit: 'g' }],
    instructions_en: 'Bake quince with honey until tender, top with walnuts.', instructions_el: 'Ψήσε το κυδώνι με μέλι μέχρι να μαλακώσει, πρόσθεσε καρύδια.', calories: 250, protein: 2, carbs: 52, fat: 7,
  },
  {
    id: 'yogurt-gliko', name_en: 'Yogurt with spoon sweet', name_el: 'Γιαούρτι με γλυκό κουταλιού', diet: 'vegetarian', servings: 1,
    ingredients: [{ name_en: 'Greek yogurt', name_el: 'Γιαούρτι', amount: 150, unit: 'g' }, { name_en: 'Sour cherry spoon sweet', name_el: 'Γλυκό κουταλιού βύσσινο', amount: 40, unit: 'g' }],
    instructions_en: 'Top yogurt with a spoon sweet.', instructions_el: 'Πρόσθεσε στο γιαούρτι γλυκό κουταλιού.', calories: 210, protein: 15, carbs: 31, fat: 3,
  },
];

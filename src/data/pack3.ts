import { Food, Recipe } from '@/src/types';

// Batch 2: breakfast + snacks + quick budget international (~8 foods + ~105 recipes).
// Values are typical averages per 100g (foods) / per serving (recipes).
// IDs use p3- prefix to avoid collisions with seed + pack2.

const pack3FoodData: Array<[string, string, string, number, number, number, number, number]> = [
  ['corn-tortilla', 'Corn tortilla', 'Τορτίγια καλαμποκιού', 220, 5, 45, 2, 60],
  ['rice-cakes', 'Rice cakes', 'Ρυζογκοφρέτες', 387, 8, 81, 3, 20],
  ['light-cream-cheese', 'Light cream cheese', 'Κρέμα τυριού light', 120, 7, 4, 9, 30],
  ['black-beans', 'Cooked black beans', 'Μαγειρεμένα μαύρα φασόλια', 132, 8.9, 23.7, 0.5, 180],
  ['soy-yogurt', 'Soy yogurt', 'Γιαούρτι σόγιας', 45, 3.5, 3, 2.5, 150],
  ['oat-drink', 'Oat drink', 'Ρόφημα βρώμης', 45, 1, 8, 1.5, 200],
  ['cocoa', 'Cocoa powder', 'Κακάο', 228, 20, 58, 14, 10],
  ['dates', 'Dried dates', 'Χουρμάδες', 282, 2.5, 75, 0.4, 30],
];

export const pack3Foods: Food[] = pack3FoodData.map(([id, name_en, name_el, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, serving_grams]) => ({ id, name_en, name_el, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, serving_grams, source: 'Daily Plate starter library' }));

export const pack3Recipes: Recipe[] = [
  // ---- BREAKFAST balanced (12) ----
  {
    id: 'p3-turkey-egg-omelet', name_en: 'Turkey egg omelet', name_el: 'Ομελέτα με γαλοπούλα', diet: 'balanced', servings: 1,
    ingredients: [{ name_en: 'Egg', name_el: 'Αυγό', amount: 100, unit: 'g' }, { name_en: 'Turkey breast', name_el: 'Στήθος γαλοπούλας', amount: 60, unit: 'g' }, { name_en: 'Bell pepper', name_el: 'Πιπεριά', amount: 60, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 5, unit: 'g' }],
    instructions_en: 'Whisk eggs, add turkey and pepper, and cook in olive oil until set.', instructions_el: 'Χτύπησε τα αυγά, πρόσθεσε γαλοπούλα και πιπεριά και ψήσε σε ελαιόλαδο.', calories: 300, protein: 30, carbs: 5, fat: 17,
  },
  {
    id: 'p3-tuna-egg-muffins', name_en: 'Tuna egg muffins', name_el: 'Μάφιν αυγού με τόνο', diet: 'balanced', servings: 2,
    ingredients: [{ name_en: 'Egg', name_el: 'Αυγό', amount: 150, unit: 'g' }, { name_en: 'Tuna in water', name_el: 'Τόνος', amount: 120, unit: 'g' }, { name_en: 'Onion', name_el: 'Κρεμμύδι', amount: 40, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 5, unit: 'g' }],
    instructions_en: 'Mix eggs with tuna and onion, pour into muffin cups, and bake until set.', instructions_el: 'Ανακάτεψε αυγά με τόνο και κρεμμύδι, μοίρασε σε φόρμες και ψήσε.', calories: 220, protein: 28, carbs: 4, fat: 10,
  },
  {
    id: 'p3-chicken-breakfast-pita', name_en: 'Chicken breakfast pita', name_el: 'Πίτα πρωινού με κοτόπουλο', diet: 'balanced', servings: 1,
    ingredients: [{ name_en: 'Wholewheat pita', name_el: 'Πίτα ολικής', amount: 60, unit: 'g' }, { name_en: 'Chicken breast', name_el: 'Κοτόπουλο', amount: 80, unit: 'g' }, { name_en: 'Egg', name_el: 'Αυγό', amount: 50, unit: 'g' }, { name_en: 'Tomato', name_el: 'Ντομάτα', amount: 60, unit: 'g' }],
    instructions_en: 'Fill warm pita with sliced chicken, boiled egg, and tomato.', instructions_el: 'Γέμισε τη ζεστή πίτα με κοτόπουλο, βραστό αυγό και ντομάτα.', calories: 380, protein: 36, carbs: 35, fat: 10,
  },
  {
    id: 'p3-salmon-rye-toast', name_en: 'Salmon rye toast', name_el: 'Ψωμί σικάλεως με σολομό', diet: 'balanced', servings: 1,
    ingredients: [{ name_en: 'Rye bread', name_el: 'Ψωμί σικάλεως', amount: 80, unit: 'g' }, { name_en: 'Salmon', name_el: 'Σολομός', amount: 80, unit: 'g' }, { name_en: 'Cucumber', name_el: 'Αγγούρι', amount: 50, unit: 'g' }, { name_en: 'Lemon', name_el: 'Λεμόνι', amount: 10, unit: 'g' }],
    instructions_en: 'Top toasted rye with salmon, cucumber, and lemon.', instructions_el: 'Βάλε πάνω στο φρυγανισμένο ψωμί σολομό, αγγούρι και λεμόνι.', calories: 340, protein: 24, carbs: 38, fat: 10,
  },
  {
    id: 'p3-prosciutto-egg-toast', name_en: 'Prosciutto egg toast', name_el: 'Τοστ με προσούτο και αυγό', diet: 'balanced', servings: 1,
    ingredients: [{ name_en: 'Wholegrain bread', name_el: 'Ψωμί ολικής', amount: 80, unit: 'g' }, { name_en: 'Egg', name_el: 'Αυγό', amount: 50, unit: 'g' }, { name_en: 'Prosciutto', name_el: 'Προσούτο', amount: 40, unit: 'g' }, { name_en: 'Tomato', name_el: 'Ντομάτα', amount: 60, unit: 'g' }],
    instructions_en: 'Top toast with boiled egg slices, prosciutto, and tomato.', instructions_el: 'Βάλε στο τοστ φέτες βραστού αυγού, προσούτο και ντομάτα.', calories: 330, protein: 22, carbs: 34, fat: 12,
  },
  {
    id: 'p3-sardine-morning-toast', name_en: 'Sardine morning toast', name_el: 'Πρωινό τοστ με σαρδέλα', diet: 'balanced', servings: 1,
    ingredients: [{ name_en: 'Wholegrain bread', name_el: 'Ψωμί ολικής', amount: 80, unit: 'g' }, { name_en: 'Sardines', name_el: 'Σαρδέλες', amount: 80, unit: 'g' }, { name_en: 'Tomato', name_el: 'Ντομάτα', amount: 60, unit: 'g' }, { name_en: 'Lemon', name_el: 'Λεμόνι', amount: 10, unit: 'g' }],
    instructions_en: 'Mash sardines with lemon and spread on toast with tomato.', instructions_el: 'Λιώσε τις σαρδέλες με λεμόνι και άλειψε στο τοστ με ντομάτα.', calories: 370, protein: 25, carbs: 34, fat: 15,
  },
  {
    id: 'p3-mackerel-scramble', name_en: 'Mackerel egg scramble', name_el: 'Στραπάτσα με σκουμπρί', diet: 'balanced', servings: 1,
    ingredients: [{ name_en: 'Egg', name_el: 'Αυγό', amount: 100, unit: 'g' }, { name_en: 'Mackerel', name_el: 'Σκουμπρί', amount: 80, unit: 'g' }, { name_en: 'Onion', name_el: 'Κρεμμύδι', amount: 40, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 5, unit: 'g' }],
    instructions_en: 'Scramble eggs with onion and flaked mackerel in olive oil.', instructions_el: 'Ανακάτεψε τα αυγά με κρεμμύδι και σκουμπρί σε ελαιόλαδο.', calories: 380, protein: 30, carbs: 5, fat: 26,
  },
  {
    id: 'p3-pastourma-eggs', name_en: 'Pastourma eggs', name_el: 'Αυγά με παστουρμά', diet: 'balanced', servings: 1,
    ingredients: [{ name_en: 'Egg', name_el: 'Αυγό', amount: 100, unit: 'g' }, { name_en: 'Pastourma', name_el: 'Παστουρμάς', amount: 40, unit: 'g' }, { name_en: 'Tomato', name_el: 'Ντομάτα', amount: 80, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 5, unit: 'g' }],
    instructions_en: 'Sear pastourma, add tomato and beaten eggs, and cook until set.', instructions_el: 'Σόταρε τον παστουρμά, πρόσθεσε ντομάτα και αυγά και ψήσε.', calories: 290, protein: 24, carbs: 5, fat: 19,
  },
  {
    id: 'p3-shrimp-scramble-toast', name_en: 'Shrimp scramble toast', name_el: 'Τοστ με γαρίδες και αυγά', diet: 'balanced', servings: 1,
    ingredients: [{ name_en: 'Wholegrain bread', name_el: 'Ψωμί ολικής', amount: 80, unit: 'g' }, { name_en: 'Egg', name_el: 'Αυγό', amount: 50, unit: 'g' }, { name_en: 'Shrimp', name_el: 'Γαρίδες', amount: 80, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 5, unit: 'g' }],
    instructions_en: 'Scramble egg with shrimp in olive oil and serve on toast.', instructions_el: 'Ανακάτεψε αυγό με γαρίδες στο λάδι και σέρβιρε στο τοστ.', calories: 350, protein: 30, carbs: 33, fat: 11,
  },
  {
    id: 'p3-chicken-savoury-oats', name_en: 'Chicken savoury oats', name_el: 'Αλμυρή βρώμη με κοτόπουλο', diet: 'balanced', servings: 1,
    ingredients: [{ name_en: 'Rolled oats', name_el: 'Βρώμη', amount: 50, unit: 'g' }, { name_en: 'Chicken breast', name_el: 'Κοτόπουλο', amount: 100, unit: 'g' }, { name_en: 'Spinach', name_el: 'Σπανάκι', amount: 50, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 5, unit: 'g' }],
    instructions_en: 'Cook oats in water, top with sliced chicken and wilted spinach.', instructions_el: 'Βράσε τη βρώμη σε νερό και πρόσθεσε κοτόπουλο και σπανάκι.', calories: 400, protein: 38, carbs: 35, fat: 11,
  },
  {
    id: 'p3-turkey-cheese-toast', name_en: 'Turkey cheese toast', name_el: 'Τοστ με γαλοπούλα και τυρί', diet: 'balanced', servings: 1,
    ingredients: [{ name_en: 'Wholegrain bread', name_el: 'Ψωμί ολικής', amount: 80, unit: 'g' }, { name_en: 'Turkey breast', name_el: 'Στήθος γαλοπούλας', amount: 60, unit: 'g' }, { name_en: 'Mozzarella', name_el: 'Μοτσαρέλα', amount: 30, unit: 'g' }, { name_en: 'Tomato', name_el: 'Ντομάτα', amount: 60, unit: 'g' }],
    instructions_en: 'Toast bread and top with turkey, mozzarella, and tomato. Grill briefly.', instructions_el: 'Φρυγάνισε το ψωμί, πρόσθεσε γαλοπούλα, μοτσαρέλα και ντομάτα και γκρατινάρισε.', calories: 370, protein: 32, carbs: 35, fat: 11,
  },
  {
    id: 'p3-cod-morning-bowl', name_en: 'Cod morning bowl', name_el: 'Πρωινό μπολ με μπακαλιάρο', diet: 'balanced', servings: 1,
    ingredients: [{ name_en: 'Cod', name_el: 'Μπακαλιάρος', amount: 120, unit: 'g' }, { name_en: 'Egg', name_el: 'Αυγό', amount: 50, unit: 'g' }, { name_en: 'Potato', name_el: 'Πατάτα', amount: 150, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 5, unit: 'g' }],
    instructions_en: 'Serve baked cod with boiled potato and boiled egg, dressed with oil and lemon.', instructions_el: 'Σέρβιρε ψητό μπακαλιάρο με βραστή πατάτα και αυγό, με λάδι και λεμόνι.', calories: 360, protein: 36, carbs: 28, fat: 11,
  },
  // ---- BREAKFAST vegetarian (12) ----
  {
    id: 'p3-honey-oat-yogurt', name_en: 'Honey oat yogurt', name_el: 'Γιαούρτι με βρώμη και μέλι', diet: 'vegetarian', servings: 1,
    ingredients: [{ name_en: 'Greek yogurt', name_el: 'Γιαούρτι', amount: 170, unit: 'g' }, { name_en: 'Rolled oats', name_el: 'Βρώμη', amount: 40, unit: 'g' }, { name_en: 'Honey', name_el: 'Μέλι', amount: 12, unit: 'g' }, { name_en: 'Walnuts', name_el: 'Καρύδια', amount: 10, unit: 'g' }],
    instructions_en: 'Mix yogurt with oats, drizzle honey, and top with walnuts.', instructions_el: 'Ανακάτεψε γιαούρτι με βρώμη, πρόσθεσε μέλι και καρύδια.', calories: 380, protein: 21, carbs: 49, fat: 12,
  },
  {
    id: 'p3-banana-peanut-oats', name_en: 'Banana peanut oats', name_el: 'Βρώμη με μπανάνα και φυστικοβούτυρο', diet: 'vegetarian', servings: 1,
    ingredients: [{ name_en: 'Rolled oats', name_el: 'Βρώμη', amount: 50, unit: 'g' }, { name_en: 'Semi-skimmed milk', name_el: 'Γάλα με χαμηλά λιπαρά', amount: 200, unit: 'g' }, { name_en: 'Banana', name_el: 'Μπανάνα', amount: 80, unit: 'g' }, { name_en: 'Peanut butter', name_el: 'Φυστικοβούτυρο', amount: 12, unit: 'g' }],
    instructions_en: 'Cook oats in milk, top with banana and peanut butter.', instructions_el: 'Βράσε τη βρώμη στο γάλα και πρόσθεσε μπανάνα και φυστικοβούτυρο.', calories: 430, protein: 16, carbs: 64, fat: 13,
  },
  {
    id: 'p3-feta-egg-toast', name_en: 'Feta egg toast', name_el: 'Τοστ με φέτα και αυγό', diet: 'vegetarian', servings: 1,
    ingredients: [{ name_en: 'Wholegrain bread', name_el: 'Ψωμί ολικής', amount: 80, unit: 'g' }, { name_en: 'Egg', name_el: 'Αυγό', amount: 50, unit: 'g' }, { name_en: 'Feta', name_el: 'Φέτα', amount: 30, unit: 'g' }, { name_en: 'Tomato', name_el: 'Ντομάτα', amount: 60, unit: 'g' }],
    instructions_en: 'Top toast with boiled egg, feta, and tomato.', instructions_el: 'Βάλε στο τοστ βραστό αυγό, φέτα και ντομάτα.', calories: 350, protein: 18, carbs: 35, fat: 15,
  },
  {
    id: 'p3-halloumi-egg-plate', name_en: 'Halloumi egg plate', name_el: 'Πιάτο με χαλούμι και αυγό', diet: 'vegetarian', servings: 1,
    ingredients: [{ name_en: 'Halloumi', name_el: 'Χαλούμι', amount: 40, unit: 'g' }, { name_en: 'Egg', name_el: 'Αυγό', amount: 50, unit: 'g' }, { name_en: 'Tomato', name_el: 'Ντομάτα', amount: 100, unit: 'g' }, { name_en: 'Cucumber', name_el: 'Αγγούρι', amount: 60, unit: 'g' }],
    instructions_en: 'Grill halloumi, boil the egg, and serve with tomato and cucumber.', instructions_el: 'Ψήσε το χαλούμι, βράσε το αυγό και σέρβιρε με ντομάτα και αγγούρι.', calories: 300, protein: 19, carbs: 9, fat: 21,
  },
  {
    id: 'p3-milk-rice-pudding', name_en: 'Light rizogalo', name_el: 'Ελαφρύ ρυζόγαλο', diet: 'vegetarian', servings: 1,
    ingredients: [{ name_en: 'Semi-skimmed milk', name_el: 'Γάλα με χαμηλά λιπαρά', amount: 250, unit: 'g' }, { name_en: 'Cooked white rice', name_el: 'Ρύζι άσπρο μαγειρεμένο', amount: 100, unit: 'g' }, { name_en: 'Honey', name_el: 'Μέλι', amount: 10, unit: 'g' }],
    instructions_en: 'Simmer rice in milk until creamy, chill, and top with honey and cinnamon.', instructions_el: 'Σιγόβρασε το ρύζι στο γάλα μέχρι να γίνει κρέμα, κρύωσε και πρόσθεσε μέλι και κανέλα.', calories: 280, protein: 10, carbs: 51, fat: 4,
  },
  {
    id: 'p3-yogurt-muesli-cup', name_en: 'Yogurt muesli cup', name_el: 'Κύπελλο γιαουρτιού με μούσλι', diet: 'vegetarian', servings: 1,
    ingredients: [{ name_en: 'Greek yogurt', name_el: 'Γιαούρτι', amount: 170, unit: 'g' }, { name_en: 'Rolled oats', name_el: 'Βρώμη', amount: 30, unit: 'g' }, { name_en: 'Raisins', name_el: 'Σταφίδες', amount: 20, unit: 'g' }, { name_en: 'Apple', name_el: 'Μήλο', amount: 80, unit: 'g' }],
    instructions_en: 'Layer yogurt with oats, raisins, and diced apple.', instructions_el: 'Στρώσε γιαούρτι με βρώμη, σταφίδες και μήλο σε κυβάκια.', calories: 330, protein: 20, carbs: 57, fat: 4,
  },
  {
    id: 'p3-tiropita-cup', name_en: 'Tiropita egg cup', name_el: 'Κύπελλο τυρόπιτας με αυγό', diet: 'vegetarian', servings: 1,
    ingredients: [{ name_en: 'Egg', name_el: 'Αυγό', amount: 50, unit: 'g' }, { name_en: 'Feta', name_el: 'Φέτα', amount: 40, unit: 'g' }, { name_en: 'Semi-skimmed milk', name_el: 'Γάλα με χαμηλά λιπαρά', amount: 60, unit: 'g' }, { name_en: 'Wholegrain bread', name_el: 'Ψωμί ολικής', amount: 40, unit: 'g' }],
    instructions_en: 'Soak bread in egg-milk, add feta, and bake in a cup until golden.', instructions_el: 'Μούλιασε το ψωμί σε αυγό-γάλα, πρόσθεσε φέτα και ψήσε σε φλιτζάνι.', calories: 320, protein: 20, carbs: 23, fat: 16,
  },
  {
    id: 'p3-egg-avocado-toast', name_en: 'Egg avocado toast', name_el: 'Τοστ με αυγό και αβοκάντο', diet: 'vegetarian', servings: 1,
    ingredients: [{ name_en: 'Wholegrain bread', name_el: 'Ψωμί ολικής', amount: 80, unit: 'g' }, { name_en: 'Egg', name_el: 'Αυγό', amount: 50, unit: 'g' }, { name_en: 'Avocado', name_el: 'Αβοκάντο', amount: 60, unit: 'g' }],
    instructions_en: 'Top toast with avocado and sliced boiled egg. Season with lemon.', instructions_el: 'Βάλε στο τοστ αβοκάντο και φέτες βραστού αυγού με λεμόνι.', calories: 380, protein: 15, carbs: 33, fat: 21,
  },
  {
    id: 'p3-strawberry-yogurt-bowl', name_en: 'Strawberry yogurt bowl', name_el: 'Μπολ γιαουρτιού με φράουλες', diet: 'vegetarian', servings: 1,
    ingredients: [{ name_en: 'Greek yogurt', name_el: 'Γιαούρτι', amount: 170, unit: 'g' }, { name_en: 'Strawberries', name_el: 'Φράουλες', amount: 150, unit: 'g' }, { name_en: 'Honey', name_el: 'Μέλι', amount: 10, unit: 'g' }, { name_en: 'Almonds', name_el: 'Αμύγδαλα', amount: 10, unit: 'g' }],
    instructions_en: 'Top yogurt with strawberries, honey, and almonds.', instructions_el: 'Πρόσθεσε στο γιαούρτι φράουλες, μέλι και αμύγδαλα.', calories: 270, protein: 20, carbs: 31, fat: 8,
  },
  {
    id: 'p3-apple-cinnamon-oats', name_en: 'Apple cinnamon oats', name_el: 'Βρώμη με μήλο και κανέλα', diet: 'vegetarian', servings: 1,
    ingredients: [{ name_en: 'Rolled oats', name_el: 'Βρώμη', amount: 50, unit: 'g' }, { name_en: 'Semi-skimmed milk', name_el: 'Γάλα με χαμηλά λιπαρά', amount: 200, unit: 'g' }, { name_en: 'Apple', name_el: 'Μήλο', amount: 100, unit: 'g' }, { name_en: 'Honey', name_el: 'Μέλι', amount: 8, unit: 'g' }],
    instructions_en: 'Cook oats in milk with diced apple and cinnamon. Drizzle honey.', instructions_el: 'Βράσε τη βρώμη στο γάλα με μήλο και κανέλα. Πρόσθεσε μέλι.', calories: 360, protein: 12, carbs: 68, fat: 5,
  },
  {
    id: 'p3-cocoa-banana-milk', name_en: 'Cocoa banana milk', name_el: 'Γάλα με μπανάνα και κακάο', diet: 'vegetarian', servings: 1,
    ingredients: [{ name_en: 'Semi-skimmed milk', name_el: 'Γάλα με χαμηλά λιπαρά', amount: 250, unit: 'g' }, { name_en: 'Banana', name_el: 'Μπανάνα', amount: 100, unit: 'g' }, { name_en: 'Cocoa powder', name_el: 'Κακάο', amount: 8, unit: 'g' }, { name_en: 'Honey', name_el: 'Μέλι', amount: 8, unit: 'g' }],
    instructions_en: 'Blend milk with banana, cocoa, and honey. Serve chilled.', instructions_el: 'Χτύπησε γάλα με μπανάνα, κακάο και μέλι. Σέρβιρε κρύο.', calories: 260, protein: 10, carbs: 50, fat: 4,
  },
  {
    id: 'p3-mizithra-honey-toast', name_en: 'Mizithra honey toast', name_el: 'Τοστ με μυζήθρα και μέλι', diet: 'vegetarian', servings: 1,
    ingredients: [{ name_en: 'Wholegrain bread', name_el: 'Ψωμί ολικής', amount: 80, unit: 'g' }, { name_en: 'Mizithra', name_el: 'Μυζήθρα', amount: 50, unit: 'g' }, { name_en: 'Honey', name_el: 'Μέλι', amount: 12, unit: 'g' }],
    instructions_en: 'Spread mizithra on toast and drizzle with honey.', instructions_el: 'Άλειψε μυζήθρα στο τοστ και ράντισε με μέλι.', calories: 370, protein: 13, carbs: 48, fat: 14,
  },
  // ---- BREAKFAST vegan (11) ----
  {
    id: 'p3-tahini-banana-oats', name_en: 'Tahini banana oats', name_el: 'Βρώμη με ταχίνι και μπανάνα', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Rolled oats', name_el: 'Βρώμη', amount: 50, unit: 'g' }, { name_en: 'Banana', name_el: 'Μπανάνα', amount: 100, unit: 'g' }, { name_en: 'Tahini', name_el: 'Ταχίνι', amount: 15, unit: 'g' }, { name_en: 'Honey', name_el: 'Μέλι', amount: 8, unit: 'g' }],
    instructions_en: 'Cook oats in water and top with banana, tahini, and honey.', instructions_el: 'Βράσε τη βρώμη σε νερό και πρόσθεσε μπανάνα, ταχίνι και μέλι.', calories: 410, protein: 10, carbs: 68, fat: 12,
  },
  {
    id: 'p3-peanut-apple-oats', name_en: 'Peanut apple oats', name_el: 'Βρώμη με μήλο και φυστικοβούτυρο', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Rolled oats', name_el: 'Βρώμη', amount: 50, unit: 'g' }, { name_en: 'Apple', name_el: 'Μήλο', amount: 120, unit: 'g' }, { name_en: 'Peanut butter', name_el: 'Φυστικοβούτυρο', amount: 15, unit: 'g' }],
    instructions_en: 'Cook oats in water and stir through peanut butter with diced apple.', instructions_el: 'Βράσε τη βρώμη σε νερό και ανακάτεψε με φυστικοβούτυρο και μήλο.', calories: 380, protein: 10, carbs: 55, fat: 14,
  },
  {
    id: 'p3-chickpea-pancakes', name_en: 'Chickpea flour pancakes', name_el: 'Τηγανίτες με αλεύρι ρεβιθιού', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Flour', name_el: 'Αλεύρι', amount: 60, unit: 'g' }, { name_en: 'Cooked chickpeas', name_el: 'Ρεβίθια', amount: 60, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 8, unit: 'g' }, { name_en: 'Onion', name_el: 'Κρεμμύδι', amount: 30, unit: 'g' }],
    instructions_en: 'Blend flour with water and chickpeas, fry thin pancakes in olive oil.', instructions_el: 'Ανακάτεψε αλεύρι με νερό και ρεβίθια και τηγάνισε λεπτές τηγανίτες.', calories: 420, protein: 13, carbs: 62, fat: 13,
  },
  {
    id: 'p3-fruit-soy-yogurt', name_en: 'Fruit soy yogurt', name_el: 'Γιαούρτι σόγιας με φρούτα', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Soy yogurt', name_el: 'Γιαούρτι σόγιας', amount: 200, unit: 'g' }, { name_en: 'Banana', name_el: 'Μπανάνα', amount: 80, unit: 'g' }, { name_en: 'Strawberries', name_el: 'Φράουλες', amount: 100, unit: 'g' }, { name_en: 'Walnuts', name_el: 'Καρύδια', amount: 10, unit: 'g' }],
    instructions_en: 'Top soy yogurt with banana, strawberries, and walnuts.', instructions_el: 'Πρόσθεσε στο γιαούρτι σόγιας μπανάνα, φράουλες και καρύδια.', calories: 250, protein: 10, carbs: 35, fat: 9,
  },
  {
    id: 'p3-bulgur-porridge', name_en: 'Bulgur morning porridge', name_el: 'Χυλός πλιγουριού', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Cooked bulgur', name_el: 'Πλιγούρι μαγειρεμένο', amount: 180, unit: 'g' }, { name_en: 'Apple', name_el: 'Μήλο', amount: 100, unit: 'g' }, { name_en: 'Raisins', name_el: 'Σταφίδες', amount: 20, unit: 'g' }, { name_en: 'Walnuts', name_el: 'Καρύδια', amount: 10, unit: 'g' }],
    instructions_en: 'Warm bulgur with apple and raisins, top with walnuts and cinnamon.', instructions_el: 'Ζέστανε το πλιγούρι με μήλο και σταφίδες, πρόσθεσε καρύδια και κανέλα.', calories: 330, protein: 8, carbs: 62, fat: 8,
  },
  {
    id: 'p3-couscous-fruit-bowl', name_en: 'Couscous fruit bowl', name_el: 'Μπολ κουσκούς με φρούτα', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Cooked couscous', name_el: 'Κουσκούς', amount: 150, unit: 'g' }, { name_en: 'Orange', name_el: 'Πορτοκάλι', amount: 120, unit: 'g' }, { name_en: 'Pomegranate', name_el: 'Ρόδι', amount: 60, unit: 'g' }, { name_en: 'Honey', name_el: 'Μέλι', amount: 10, unit: 'g' }],
    instructions_en: 'Fluff couscous and top with orange, pomegranate, and honey.', instructions_el: 'Αφράτεψε το κουσκούς και πρόσθεσε πορτοκάλι, ρόδι και μέλι.', calories: 330, protein: 7, carbs: 70, fat: 2,
  },
  {
    id: 'p3-avocado-tomato-toast', name_en: 'Avocado tomato toast', name_el: 'Τοστ με αβοκάντο και ντομάτα', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Wholegrain bread', name_el: 'Ψωμί ολικής', amount: 80, unit: 'g' }, { name_en: 'Avocado', name_el: 'Αβοκάντο', amount: 80, unit: 'g' }, { name_en: 'Tomato', name_el: 'Ντομάτα', amount: 80, unit: 'g' }],
    instructions_en: 'Mash avocado on toast and top with tomato and lemon.', instructions_el: 'Λιώσε το αβοκάντο στο τοστ και πρόσθεσε ντομάτα και λεμόνι.', calories: 350, protein: 8, carbs: 38, fat: 19,
  },
  {
    id: 'p3-orange-tahini-toast', name_en: 'Orange tahini toast', name_el: 'Τοστ με ταχίνι και πορτοκάλι', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Wholegrain bread', name_el: 'Ψωμί ολικής', amount: 80, unit: 'g' }, { name_en: 'Tahini', name_el: 'Ταχίνι', amount: 20, unit: 'g' }, { name_en: 'Orange', name_el: 'Πορτοκάλι', amount: 100, unit: 'g' }, { name_en: 'Honey', name_el: 'Μέλι', amount: 8, unit: 'g' }],
    instructions_en: 'Spread tahini on toast and top with orange slices and honey.', instructions_el: 'Άλειψε ταχίνι στο τοστ και πρόσθεσε πορτοκάλι και μέλι.', calories: 380, protein: 10, carbs: 54, fat: 14,
  },
  {
    id: 'p3-baked-oats-apple', name_en: 'Baked oats with apple', name_el: 'Ψητή βρώμη με μήλο', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Rolled oats', name_el: 'Βρώμη', amount: 50, unit: 'g' }, { name_en: 'Apple', name_el: 'Μήλο', amount: 150, unit: 'g' }, { name_en: 'Raisins', name_el: 'Σταφίδες', amount: 15, unit: 'g' }, { name_en: 'Walnuts', name_el: 'Καρύδια', amount: 10, unit: 'g' }],
    instructions_en: 'Mix oats with grated apple and raisins, bake until golden, top with walnuts.', instructions_el: 'Ανακάτεψε βρώμη με τριμμένο μήλο και σταφίδες, ψήσε και πρόσθεσε καρύδια.', calories: 350, protein: 7, carbs: 64, fat: 9,
  },
  {
    id: 'p3-hummus-breakfast-toast', name_en: 'Hummus breakfast toast', name_el: 'Πρωινό τοστ με χούμους', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Wholegrain bread', name_el: 'Ψωμί ολικής', amount: 80, unit: 'g' }, { name_en: 'Hummus', name_el: 'Χούμους', amount: 60, unit: 'g' }, { name_en: 'Tomato', name_el: 'Ντομάτα', amount: 60, unit: 'g' }],
    instructions_en: 'Spread hummus on toast and top with tomato.', instructions_el: 'Άλειψε χούμους στο τοστ και πρόσθεσε ντομάτα.', calories: 310, protein: 11, carbs: 43, fat: 11,
  },
  {
    id: 'p3-lentil-morning-soup', name_en: 'Lentil morning soup', name_el: 'Πρωινή φακοσούπα', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Cooked lentils', name_el: 'Φακές', amount: 180, unit: 'g' }, { name_en: 'Carrot', name_el: 'Καρότο', amount: 60, unit: 'g' }, { name_en: 'Onion', name_el: 'Κρεμμύδι', amount: 40, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 8, unit: 'g' }],
    instructions_en: 'Simmer lentils with carrot and onion, finish with olive oil and lemon.', instructions_el: 'Σιγόβρασε φακές με καρότο και κρεμμύδι, τελείωσε με λάδι και λεμόνι.', calories: 300, protein: 17, carbs: 40, fat: 9,
  },
  // ---- SNACKS balanced (10) ----
  {
    id: 'p3-tuna-cucumber-bites', name_en: 'Tuna cucumber bites', name_el: 'Μπουκιές αγγουριού με τόνο', diet: 'balanced', servings: 1,
    ingredients: [{ name_en: 'Tuna in water', name_el: 'Τόνος', amount: 80, unit: 'g' }, { name_en: 'Cucumber', name_el: 'Αγγούρι', amount: 150, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 5, unit: 'g' }],
    instructions_en: 'Top thick cucumber rounds with tuna, oil, and lemon.', instructions_el: 'Βάλε πάνω σε ροδέλες αγγουριού τόνο, λάδι και λεμόνι.', calories: 150, protein: 22, carbs: 5, fat: 5,
  },
  {
    id: 'p3-turkey-rollups', name_en: 'Turkey rollups', name_el: 'Ρολάκια γαλοπούλας', diet: 'balanced', servings: 1,
    ingredients: [{ name_en: 'Turkey breast', name_el: 'Στήθος γαλοπούλας', amount: 80, unit: 'g' }, { name_en: 'Light cream cheese', name_el: 'Κρέμα τυριού light', amount: 30, unit: 'g' }, { name_en: 'Cucumber', name_el: 'Αγγούρι', amount: 60, unit: 'g' }],
    instructions_en: 'Spread cream cheese on turkey slices, add cucumber sticks, and roll.', instructions_el: 'Άλειψε κρέμα τυριού στη γαλοπούλα, πρόσθεσε αγγούρι και τύλιξε.', calories: 160, protein: 26, carbs: 4, fat: 4,
  },
  {
    id: 'p3-salmon-cucumber-snack', name_en: 'Salmon cucumber snack', name_el: 'Σνακ με σολομό και αγγούρι', diet: 'balanced', servings: 1,
    ingredients: [{ name_en: 'Salmon', name_el: 'Σολομός', amount: 60, unit: 'g' }, { name_en: 'Cucumber', name_el: 'Αγγούρι', amount: 120, unit: 'g' }, { name_en: 'Light cream cheese', name_el: 'Κρέμα τυριού light', amount: 20, unit: 'g' }],
    instructions_en: 'Top cucumber rounds with cream cheese and smoked salmon.', instructions_el: 'Βάλε σε ροδέλες αγγουριού κρέμα τυριού και σολομό.', calories: 170, protein: 16, carbs: 5, fat: 10,
  },
  {
    id: 'p3-shrimp-cup', name_en: 'Shrimp cocktail cup', name_el: 'Κύπελλο με γαρίδες', diet: 'balanced', servings: 1,
    ingredients: [{ name_en: 'Shrimp', name_el: 'Γαρίδες', amount: 120, unit: 'g' }, { name_en: 'Lettuce', name_el: 'Μαρούλι', amount: 60, unit: 'g' }, { name_en: 'Tomato sauce', name_el: 'Σάλτσα ντομάτας', amount: 40, unit: 'g' }, { name_en: 'Lemon', name_el: 'Λεμόνι', amount: 10, unit: 'g' }],
    instructions_en: 'Serve boiled shrimp over lettuce with tomato sauce and lemon.', instructions_el: 'Σέρβιρε βρασμένες γαρίδες σε μαρούλι με σάλτσα ντομάτας και λεμόνι.', calories: 150, protein: 28, carbs: 7, fat: 1,
  },
  {
    id: 'p3-sardine-lemon-snack', name_en: 'Sardine lemon snack', name_el: 'Σνακ σαρδέλας με λεμόνι', diet: 'balanced', servings: 1,
    ingredients: [{ name_en: 'Sardines', name_el: 'Σαρδέλες', amount: 80, unit: 'g' }, { name_en: 'Lemon', name_el: 'Λεμόνι', amount: 15, unit: 'g' }, { name_en: 'Onion', name_el: 'Κρεμμύδι', amount: 30, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 5, unit: 'g' }],
    instructions_en: 'Serve sardines with onion, lemon, and olive oil.', instructions_el: 'Σέρβιρε σαρδέλες με κρεμμύδι, λεμόνι και ελαιόλαδο.', calories: 220, protein: 21, carbs: 4, fat: 13,
  },
  {
    id: 'p3-chicken-skewers-snack', name_en: 'Chicken skewer snack', name_el: 'Σνακ σουβλάκι κοτόπουλο', diet: 'balanced', servings: 1,
    ingredients: [{ name_en: 'Chicken breast', name_el: 'Κοτόπουλο', amount: 120, unit: 'g' }, { name_en: 'Bell pepper', name_el: 'Πιπεριά', amount: 60, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 5, unit: 'g' }],
    instructions_en: 'Skewer chicken with pepper and grill with olive oil and oregano.', instructions_el: 'Πέρασε κοτόπουλο με πιπεριά σε σουβλάκι και ψήσε με λάδι και ρίγανη.', calories: 230, protein: 36, carbs: 4, fat: 7,
  },
  {
    id: 'p3-prosciutto-watermelon', name_en: 'Prosciutto watermelon bites', name_el: 'Μπουκιές προσούτο με καρπούζι', diet: 'balanced', servings: 1,
    ingredients: [{ name_en: 'Prosciutto', name_el: 'Προσούτο', amount: 40, unit: 'g' }, { name_en: 'Watermelon', name_el: 'Καρπούζι', amount: 200, unit: 'g' }],
    instructions_en: 'Wrap watermelon cubes with prosciutto and serve chilled.', instructions_el: 'Τύλιξε κυβάκια καρπουζιού με προσούτο και σέρβιρε κρύο.', calories: 130, protein: 10, carbs: 16, fat: 3,
  },
  {
    id: 'p3-tuna-stuffed-pepper', name_en: 'Tuna stuffed pepper', name_el: 'Πιπεριά γεμιστή με τόνο', diet: 'balanced', servings: 1,
    ingredients: [{ name_en: 'Tuna in water', name_el: 'Τόνος', amount: 80, unit: 'g' }, { name_en: 'Bell pepper', name_el: 'Πιπεριά', amount: 150, unit: 'g' }, { name_en: 'Onion', name_el: 'Κρεμμύδι', amount: 30, unit: 'g' }],
    instructions_en: 'Fill pepper halves with tuna and onion, chill, and slice.', instructions_el: 'Γέμισε μισές πιπεριές με τόνο και κρεμμύδι και σέρβιρε κρύο.', calories: 150, protein: 22, carbs: 10, fat: 2,
  },
  {
    id: 'p3-egg-tuna-bites', name_en: 'Egg tuna bites', name_el: 'Μπουκιές αυγού με τόνο', diet: 'balanced', servings: 1,
    ingredients: [{ name_en: 'Egg', name_el: 'Αυγό', amount: 100, unit: 'g' }, { name_en: 'Tuna in water', name_el: 'Τόνος', amount: 60, unit: 'g' }],
    instructions_en: 'Halve boiled eggs and top with tuna and pepper.', instructions_el: 'Κόψε βραστά αυγά στη μέση και πρόσθεσε τόνο και πιπέρι.', calories: 220, protein: 28, carbs: 1, fat: 11,
  },
  {
    id: 'p3-mackerel-dip', name_en: 'Mackerel dip', name_el: 'Ντιπ σκουμπριού', diet: 'balanced', servings: 1,
    ingredients: [{ name_en: 'Mackerel', name_el: 'Σκουμπρί', amount: 80, unit: 'g' }, { name_en: 'Greek yogurt', name_el: 'Γιαούρτι', amount: 60, unit: 'g' }, { name_en: 'Lemon', name_el: 'Λεμόνι', amount: 10, unit: 'g' }, { name_en: 'Cucumber', name_el: 'Αγγούρι', amount: 80, unit: 'g' }],
    instructions_en: 'Blend mackerel with yogurt and lemon, serve with cucumber sticks.', instructions_el: 'Πολτοποίησε σκουμπρί με γιαούρτι και λεμόνι, σέρβιρε με αγγούρι.', calories: 230, protein: 20, carbs: 6, fat: 14,
  },
  // ---- SNACKS vegetarian (10) ----
  {
    id: 'p3-feta-veg-sticks', name_en: 'Feta veg sticks', name_el: 'Στικ λαχανικών με φέτα', diet: 'vegetarian', servings: 1,
    ingredients: [{ name_en: 'Feta', name_el: 'Φέτα', amount: 40, unit: 'g' }, { name_en: 'Carrot', name_el: 'Καρότο', amount: 80, unit: 'g' }, { name_en: 'Cucumber', name_el: 'Αγγούρι', amount: 80, unit: 'g' }],
    instructions_en: 'Serve feta cubes with carrot and cucumber sticks.', instructions_el: 'Σέρβιρε κυβάκια φέτας με στικ καρότου και αγγουριού.', calories: 160, protein: 7, carbs: 11, fat: 10,
  },
  {
    id: 'p3-yogurt-dill-dip', name_en: 'Yogurt dill dip', name_el: 'Ντιπ γιαουρτιού με άνηθο', diet: 'vegetarian', servings: 1,
    ingredients: [{ name_en: 'Greek yogurt', name_el: 'Γιαούρτι', amount: 150, unit: 'g' }, { name_en: 'Cucumber', name_el: 'Αγγούρι', amount: 80, unit: 'g' }, { name_en: 'Dill', name_el: 'Άνηθος', amount: 10, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 5, unit: 'g' }],
    instructions_en: 'Mix yogurt with grated cucumber, dill, and olive oil.', instructions_el: 'Ανακάτεψε γιαούρτι με τριμμένο αγγούρι, άνηθο και ελαιόλαδο.', calories: 150, protein: 16, carbs: 8, fat: 7,
  },
  {
    id: 'p3-cheese-apple-plate', name_en: 'Cheese apple plate', name_el: 'Πιάτο τυριού με μήλο', diet: 'vegetarian', servings: 1,
    ingredients: [{ name_en: 'Graviera', name_el: 'Γραβιέρα', amount: 30, unit: 'g' }, { name_en: 'Apple', name_el: 'Μήλο', amount: 150, unit: 'g' }, { name_en: 'Walnuts', name_el: 'Καρύδια', amount: 10, unit: 'g' }],
    instructions_en: 'Serve graviera slices with apple and walnuts.', instructions_el: 'Σέρβιρε φέτες γραβιέρας με μήλο και καρύδια.', calories: 260, protein: 9, carbs: 23, fat: 15,
  },
  {
    id: 'p3-halloumi-bites', name_en: 'Halloumi bites', name_el: 'Μπουκιές χαλουμιού', diet: 'vegetarian', servings: 1,
    ingredients: [{ name_en: 'Halloumi', name_el: 'Χαλούμι', amount: 50, unit: 'g' }, { name_en: 'Tomato', name_el: 'Ντομάτα', amount: 80, unit: 'g' }],
    instructions_en: 'Grill halloumi cubes and serve with tomato.', instructions_el: 'Ψήσε κυβάκια χαλουμιού και σέρβιρε με ντομάτα.', calories: 200, protein: 12, carbs: 5, fat: 15,
  },
  {
    id: 'p3-egg-salad-snack', name_en: 'Egg salad snack', name_el: 'Σνακ αυγοσαλάτας', diet: 'vegetarian', servings: 1,
    ingredients: [{ name_en: 'Egg', name_el: 'Αυγό', amount: 100, unit: 'g' }, { name_en: 'Greek yogurt', name_el: 'Γιαούρτι', amount: 40, unit: 'g' }, { name_en: 'Lettuce', name_el: 'Μαρούλι', amount: 60, unit: 'g' }],
    instructions_en: 'Chop boiled eggs with yogurt and serve over lettuce.', instructions_el: 'Ψιλόκοψε βραστά αυγά με γιαούρτι και σέρβιρε σε μαρούλι.', calories: 190, protein: 17, carbs: 3, fat: 12,
  },
  {
    id: 'p3-tzatziki-rusk-snack', name_en: 'Tzatziki rusk snack', name_el: 'Σνακ τζατζίκι με παξιμάδι', diet: 'vegetarian', servings: 1,
    ingredients: [{ name_en: 'Tzatziki', name_el: 'Τζατζίκι', amount: 60, unit: 'g' }, { name_en: 'Barley rusk', name_el: 'Παξιμάδι κρίθινο', amount: 30, unit: 'g' }, { name_en: 'Tomato', name_el: 'Ντομάτα', amount: 60, unit: 'g' }],
    instructions_en: 'Top rusk with tzatziki and diced tomato.', instructions_el: 'Βάλε πάνω στο παξιμάδι τζατζίκι και ντομάτα σε κυβάκια.', calories: 180, protein: 6, carbs: 26, fat: 6,
  },
  {
    id: 'p3-milk-banana-snack', name_en: 'Milk banana snack', name_el: 'Σνακ γάλα με μπανάνα', diet: 'vegetarian', servings: 1,
    ingredients: [{ name_en: 'Semi-skimmed milk', name_el: 'Γάλα με χαμηλά λιπαρά', amount: 200, unit: 'g' }, { name_en: 'Banana', name_el: 'Μπανάνα', amount: 80, unit: 'g' }],
    instructions_en: 'Serve cold milk with sliced banana and cinnamon.', instructions_el: 'Σέρβιρε κρύο γάλα με μπανάνα σε φέτες και κανέλα.', calories: 170, protein: 8, carbs: 32, fat: 3,
  },
  {
    id: 'p3-cottage-fruit-cup', name_en: 'Cottage fruit cup', name_el: 'Κύπελλο cottage με φρούτα', diet: 'vegetarian', servings: 1,
    ingredients: [{ name_en: 'Cottage cheese', name_el: 'Cottage cheese', amount: 120, unit: 'g' }, { name_en: 'Peach', name_el: 'Ροδάκινο', amount: 100, unit: 'g' }, { name_en: 'Honey', name_el: 'Μέλι', amount: 8, unit: 'g' }],
    instructions_en: 'Top cottage cheese with peach and honey.', instructions_el: 'Πρόσθεσε στο cottage ροδάκινο και μέλι.', calories: 200, protein: 15, carbs: 25, fat: 5,
  },
  {
    id: 'p3-mozzarella-tomato-bites', name_en: 'Mozzarella tomato bites', name_el: 'Μπουκιές μοτσαρέλας με ντομάτα', diet: 'vegetarian', servings: 1,
    ingredients: [{ name_en: 'Mozzarella', name_el: 'Μοτσαρέλα', amount: 50, unit: 'g' }, { name_en: 'Tomato', name_el: 'Ντομάτα', amount: 120, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 5, unit: 'g' }],
    instructions_en: 'Serve mozzarella with tomato, oil, and oregano.', instructions_el: 'Σέρβιρε μοτσαρέλα με ντομάτα, λάδι και ρίγανη.', calories: 200, protein: 15, carbs: 6, fat: 13,
  },
  {
    id: 'p3-yogurt-cucumber-cup', name_en: 'Yogurt cucumber cup', name_el: 'Κύπελλο γιαουρτιού με αγγούρι', diet: 'vegetarian', servings: 1,
    ingredients: [{ name_en: 'Greek yogurt', name_el: 'Γιαούρτι', amount: 150, unit: 'g' }, { name_en: 'Cucumber', name_el: 'Αγγούρι', amount: 100, unit: 'g' }, { name_en: 'Walnuts', name_el: 'Καρύδια', amount: 10, unit: 'g' }],
    instructions_en: 'Mix yogurt with diced cucumber and top with walnuts.', instructions_el: 'Ανακάτεψε γιαούρτι με αγγούρι σε κυβάκια και πρόσθεσε καρύδια.', calories: 180, protein: 17, carbs: 8, fat: 9,
  },
  // ---- SNACKS vegan (10) ----
  {
    id: 'p3-hummus-veg-sticks', name_en: 'Hummus veg sticks', name_el: 'Στικ λαχανικών με χούμους', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Hummus', name_el: 'Χούμους', amount: 80, unit: 'g' }, { name_en: 'Carrot', name_el: 'Καρότο', amount: 80, unit: 'g' }, { name_en: 'Cucumber', name_el: 'Αγγούρι', amount: 80, unit: 'g' }],
    instructions_en: 'Serve hummus with carrot and cucumber sticks.', instructions_el: 'Σέρβιρε χούμους με στικ καρότου και αγγουριού.', calories: 200, protein: 8, carbs: 21, fat: 10,
  },
  {
    id: 'p3-roasted-chickpeas', name_en: 'Roasted chickpeas', name_el: 'Ψητά ρεβίθια', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Cooked chickpeas', name_el: 'Ρεβίθια', amount: 180, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 8, unit: 'g' }],
    instructions_en: 'Roast chickpeas with oil and paprika until crisp.', instructions_el: 'Ψήσε τα ρεβίθια με λάδι και πάπρικα μέχρι να γίνουν τραγανά.', calories: 360, protein: 15, carbs: 49, fat: 11,
  },
  {
    id: 'p3-tahini-apple-dip', name_en: 'Tahini apple dip', name_el: 'Ντιπ ταχίνι με μήλο', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Tahini', name_el: 'Ταχίνι', amount: 20, unit: 'g' }, { name_en: 'Apple', name_el: 'Μήλο', amount: 150, unit: 'g' }, { name_en: 'Honey', name_el: 'Μέλι', amount: 8, unit: 'g' }],
    instructions_en: 'Serve apple slices with tahini-honey dip.', instructions_el: 'Σέρβιρε φέτες μήλου με ντιπ ταχίνι-μέλι.', calories: 230, protein: 4, carbs: 34, fat: 11,
  },
  {
    id: 'p3-peanut-banana-bites', name_en: 'Peanut banana bites', name_el: 'Μπουκιές μπανάνας με φυστικοβούτυρο', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Banana', name_el: 'Μπανάνα', amount: 120, unit: 'g' }, { name_en: 'Peanut butter', name_el: 'Φυστικοβούτυρο', amount: 15, unit: 'g' }],
    instructions_en: 'Top banana rounds with peanut butter.', instructions_el: 'Βάλε πάνω σε ροδέλες μπανάνας φυστικοβούτυρο.', calories: 200, protein: 5, carbs: 30, fat: 8,
  },
  {
    id: 'p3-olives-rusk-snack', name_en: 'Olives rusk snack', name_el: 'Σνακ ελιές με παξιμάδι', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Olives', name_el: 'Ελιές', amount: 30, unit: 'g' }, { name_en: 'Barley rusk', name_el: 'Παξιμάδι κρίθινο', amount: 30, unit: 'g' }, { name_en: 'Tomato', name_el: 'Ντομάτα', amount: 80, unit: 'g' }],
    instructions_en: 'Serve rusk with tomato and olives.', instructions_el: 'Σέρβιρε παξιμάδι με ντομάτα και ελιές.', calories: 180, protein: 4, carbs: 27, fat: 7,
  },
  {
    id: 'p3-fruit-nut-mix', name_en: 'Fruit nut mix', name_el: 'Μείγμα φρούτων με ξηρούς καρπούς', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Apple', name_el: 'Μήλο', amount: 100, unit: 'g' }, { name_en: 'Banana', name_el: 'Μπανάνα', amount: 60, unit: 'g' }, { name_en: 'Walnuts', name_el: 'Καρύδια', amount: 15, unit: 'g' }, { name_en: 'Raisins', name_el: 'Σταφίδες', amount: 15, unit: 'g' }],
    instructions_en: 'Mix chopped fruit with walnuts and raisins.', instructions_el: 'Ανακάτεψε ψιλοκομμένα φρούτα με καρύδια και σταφίδες.', calories: 260, protein: 4, carbs: 47, fat: 10,
  },
  {
    id: 'p3-avocado-rusk', name_en: 'Avocado rusk', name_el: 'Παξιμάδι με αβοκάντο', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Barley rusk', name_el: 'Παξιμάδι κρίθινο', amount: 40, unit: 'g' }, { name_en: 'Avocado', name_el: 'Αβοκάντο', amount: 60, unit: 'g' }, { name_en: 'Tomato', name_el: 'Ντομάτα', amount: 60, unit: 'g' }],
    instructions_en: 'Top rusk with avocado and tomato. Season with lemon.', instructions_el: 'Βάλε στο παξιμάδι αβοκάντο και ντομάτα με λεμόνι.', calories: 250, protein: 5, carbs: 32, fat: 12,
  },
  {
    id: 'p3-tomato-bruschetta', name_en: 'Tomato bruschetta', name_el: 'Μπρουσκέτα ντομάτας', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Wholegrain bread', name_el: 'Ψωμί ολικής', amount: 80, unit: 'g' }, { name_en: 'Tomato', name_el: 'Ντομάτα', amount: 150, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 8, unit: 'g' }, { name_en: 'Garlic', name_el: 'Σκόρδο', amount: 3, unit: 'g' }],
    instructions_en: 'Top toasted bread with tomato, garlic, and olive oil.', instructions_el: 'Βάλε στο φρυγανισμένο ψωμί ντομάτα, σκόρδο και ελαιόλαδο.', calories: 270, protein: 8, carbs: 39, fat: 10,
  },
  {
    id: 'p3-boiled-corn-snack', name_en: 'Boiled corn snack', name_el: 'Σνακ βραστό καλαμπόκι', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Sweet corn', name_el: 'Καλαμπόκι', amount: 200, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 5, unit: 'g' }, { name_en: 'Lemon', name_el: 'Λεμόνι', amount: 10, unit: 'g' }],
    instructions_en: 'Serve boiled corn with olive oil, lemon, and salt.', instructions_el: 'Σέρβιρε βραστό καλαμπόκι με ελαιόλαδο, λεμόνι και αλάτι.', calories: 220, protein: 7, carbs: 38, fat: 6,
  },
  {
    id: 'p3-dates-walnuts', name_en: 'Dates with walnuts', name_el: 'Χουρμάδες με καρύδια', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Dried dates', name_el: 'Χουρμάδες', amount: 40, unit: 'g' }, { name_en: 'Walnuts', name_el: 'Καρύδια', amount: 15, unit: 'g' }],
    instructions_en: 'Fill dates with walnut halves and serve.', instructions_el: 'Γέμισε τους χουρμάδες με καρύδια και σέρβιρε.', calories: 210, protein: 3, carbs: 32, fat: 10,
  },
  // ---- QUICK INTERNATIONAL balanced (13) ----
  {
    id: 'p3-mexican-chicken-tortilla', name_en: 'Mexican chicken tortilla', name_el: 'Τορτίγια με κοτόπουλο μεξικάνικη', diet: 'balanced', servings: 1,
    ingredients: [{ name_en: 'Corn tortilla', name_el: 'Τορτίγια καλαμποκιού', amount: 120, unit: 'g' }, { name_en: 'Chicken breast', name_el: 'Κοτόπουλο', amount: 120, unit: 'g' }, { name_en: 'Tomato', name_el: 'Ντομάτα', amount: 80, unit: 'g' }, { name_en: 'Sweet corn', name_el: 'Καλαμπόκι', amount: 60, unit: 'g' }],
    instructions_en: 'Fill warm tortillas with chicken, tomato, and corn. Add lemon and herbs.', instructions_el: 'Γέμισε τις τορτίγιες με κοτόπουλο, ντομάτα και καλαμπόκι. Πρόσθεσε λεμόνι.', calories: 520, protein: 42, carbs: 65, fat: 9,
  },
  {
    id: 'p3-turkey-rice-stirfry', name_en: 'Turkey rice stir-fry', name_el: 'Ρύζι με γαλοπούλα σωτέ', diet: 'balanced', servings: 1,
    ingredients: [{ name_en: 'Turkey breast', name_el: 'Στήθος γαλοπούλας', amount: 120, unit: 'g' }, { name_en: 'Cooked white rice', name_el: 'Ρύζι άσπρο μαγειρεμένο', amount: 160, unit: 'g' }, { name_en: 'Bell pepper', name_el: 'Πιπεριά', amount: 80, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 8, unit: 'g' }],
    instructions_en: 'Stir-fry turkey with pepper in oil and toss with rice.', instructions_el: 'Σόταρε γαλοπούλα με πιπεριά στο λάδι και ανακάτεψε με ρύζι.', calories: 480, protein: 38, carbs: 55, fat: 11,
  },
  {
    id: 'p3-tuna-pasta-italian', name_en: 'Tuna tomato pasta', name_el: 'Ζυμαρικά με τόνο', diet: 'balanced', servings: 1,
    ingredients: [{ name_en: 'Wholewheat pasta cooked', name_el: 'Ζυμαρικά ολικής', amount: 200, unit: 'g' }, { name_en: 'Tuna in water', name_el: 'Τόνος', amount: 100, unit: 'g' }, { name_en: 'Tomato sauce', name_el: 'Σάλτσα ντομάτας', amount: 120, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 8, unit: 'g' }],
    instructions_en: 'Toss pasta with tuna, warm tomato sauce, and olive oil.', instructions_el: 'Ανακάτεψε τα ζυμαρικά με τόνο, ζεστή σάλτσα και ελαιόλαδο.', calories: 520, protein: 36, carbs: 66, fat: 12,
  },
  {
    id: 'p3-chicken-curry-light', name_en: 'Light chicken curry', name_el: 'Ελαφρύ κάρι κοτόπουλου', diet: 'balanced', servings: 1,
    ingredients: [{ name_en: 'Chicken breast', name_el: 'Κοτόπουλο', amount: 130, unit: 'g' }, { name_en: 'Cooked white rice', name_el: 'Ρύζι άσπρο μαγειρεμένο', amount: 150, unit: 'g' }, { name_en: 'Tomato', name_el: 'Ντομάτα', amount: 100, unit: 'g' }, { name_en: 'Onion', name_el: 'Κρεμμύδι', amount: 60, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 8, unit: 'g' }],
    instructions_en: 'Simmer chicken with tomato, onion, and curry spices. Serve over rice.', instructions_el: 'Σιγόβρασε κοτόπουλο με ντομάτα, κρεμμύδι και κάρι. Σέρβιρε με ρύζι.', calories: 470, protein: 40, carbs: 52, fat: 11,
  },
  {
    id: 'p3-beef-chili-beans', name_en: 'Beef chili beans', name_el: 'Μοσχάρι με φασόλια τσίλι', diet: 'balanced', servings: 2,
    ingredients: [{ name_en: 'Lean beef', name_el: 'Μοσχάρι', amount: 200, unit: 'g' }, { name_en: 'Cooked white beans', name_el: 'Φασόλια', amount: 250, unit: 'g' }, { name_en: 'Tomato sauce', name_el: 'Σάλτσα ντομάτας', amount: 150, unit: 'g' }, { name_en: 'Onion', name_el: 'Κρεμμύδι', amount: 80, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 10, unit: 'g' }],
    instructions_en: 'Brown beef with onion, add beans and tomato, and simmer 15 minutes.', instructions_el: 'Σόταρε μοσχάρι με κρεμμύδι, πρόσθεσε φασόλια και ντομάτα και σιγόβρασε 15 λεπτά.', calories: 420, protein: 38, carbs: 36, fat: 14,
  },
  {
    id: 'p3-pork-veg-stirfry', name_en: 'Pork veg stir-fry', name_el: 'Χοιρινό σωτέ με λαχανικά', diet: 'balanced', servings: 1,
    ingredients: [{ name_en: 'Lean pork', name_el: 'Άπαχο χοιρινό', amount: 130, unit: 'g' }, { name_en: 'Zucchini', name_el: 'Κολοκύθι', amount: 120, unit: 'g' }, { name_en: 'Bell pepper', name_el: 'Πιπεριά', amount: 80, unit: 'g' }, { name_en: 'Cooked white rice', name_el: 'Ρύζι άσπρο μαγειρεμένο', amount: 120, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 8, unit: 'g' }],
    instructions_en: 'Stir-fry pork with vegetables in oil and serve over rice.', instructions_el: 'Σόταρε χοιρινό με λαχανικά στο λάδι και σέρβιρε με ρύζι.', calories: 480, protein: 37, carbs: 48, fat: 14,
  },
  {
    id: 'p3-salmon-bulgur-bowl', name_en: 'Salmon bulgur bowl', name_el: 'Μπολ πλιγουριού με σολομό', diet: 'balanced', servings: 1,
    ingredients: [{ name_en: 'Salmon', name_el: 'Σολομός', amount: 120, unit: 'g' }, { name_en: 'Cooked bulgur', name_el: 'Πλιγούρι μαγειρεμένο', amount: 160, unit: 'g' }, { name_en: 'Cucumber', name_el: 'Αγγούρι', amount: 80, unit: 'g' }, { name_en: 'Lemon', name_el: 'Λεμόνι', amount: 10, unit: 'g' }],
    instructions_en: 'Serve baked salmon over bulgur with cucumber and lemon.', instructions_el: 'Σέρβιρε ψητό σολομό πάνω σε πλιγούρι με αγγούρι και λεμόνι.', calories: 450, protein: 32, carbs: 35, fat: 19,
  },
  {
    id: 'p3-shrimp-noodle-pan', name_en: 'Shrimp noodle pan', name_el: 'Τηγάνι με γαρίδες και νουντλς', diet: 'balanced', servings: 1,
    ingredients: [{ name_en: 'Shrimp', name_el: 'Γαρίδες', amount: 150, unit: 'g' }, { name_en: 'Wholewheat pasta cooked', name_el: 'Ζυμαρικά ολικής', amount: 180, unit: 'g' }, { name_en: 'Bell pepper', name_el: 'Πιπεριά', amount: 80, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 8, unit: 'g' }],
    instructions_en: 'Stir-fry shrimp with pepper and toss with pasta and lemon.', instructions_el: 'Σόταρε γαρίδες με πιπεριά και ανακάτεψε με ζυμαρικά και λεμόνι.', calories: 450, protein: 38, carbs: 55, fat: 9,
  },
  {
    id: 'p3-cod-tomato-rice', name_en: 'Cod tomato rice', name_el: 'Μπακαλιάρος με ρύζι και ντομάτα', diet: 'balanced', servings: 1,
    ingredients: [{ name_en: 'Cod', name_el: 'Μπακαλιάρος', amount: 150, unit: 'g' }, { name_en: 'Cooked white rice', name_el: 'Ρύζι άσπρο μαγειρεμένο', amount: 150, unit: 'g' }, { name_en: 'Tomato sauce', name_el: 'Σάλτσα ντομάτας', amount: 120, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 8, unit: 'g' }],
    instructions_en: 'Bake cod in tomato sauce and serve over rice.', instructions_el: 'Ψήσε τον μπακαλιάρο στη σάλτσα και σέρβιρε με ρύζι.', calories: 420, protein: 34, carbs: 53, fat: 8,
  },
  {
    id: 'p3-chicken-burrito-bowl', name_en: 'Chicken burrito bowl', name_el: 'Μπολ μπουρίτο με κοτόπουλο', diet: 'balanced', servings: 1,
    ingredients: [{ name_en: 'Chicken breast', name_el: 'Κοτόπουλο', amount: 120, unit: 'g' }, { name_en: 'Cooked white rice', name_el: 'Ρύζι άσπρο μαγειρεμένο', amount: 140, unit: 'g' }, { name_en: 'Cooked black beans', name_el: 'Μαύρα φασόλια', amount: 100, unit: 'g' }, { name_en: 'Sweet corn', name_el: 'Καλαμπόκι', amount: 60, unit: 'g' }, { name_en: 'Tomato', name_el: 'Ντομάτα', amount: 60, unit: 'g' }],
    instructions_en: 'Bowl rice with chicken, black beans, corn, and tomato.', instructions_el: 'Σέρβιρε σε μπολ ρύζι με κοτόπουλο, μαύρα φασόλια, καλαμπόκι και ντομάτα.', calories: 540, protein: 43, carbs: 73, fat: 7,
  },
  {
    id: 'p3-turkey-tacos', name_en: 'Turkey tacos', name_el: 'Τάκος με γαλοπούλα', diet: 'balanced', servings: 1,
    ingredients: [{ name_en: 'Corn tortilla', name_el: 'Τορτίγια καλαμποκιού', amount: 120, unit: 'g' }, { name_en: 'Turkey breast', name_el: 'Στήθος γαλοπούλας', amount: 120, unit: 'g' }, { name_en: 'Tomato', name_el: 'Ντομάτα', amount: 80, unit: 'g' }, { name_en: 'Lettuce', name_el: 'Μαρούλι', amount: 60, unit: 'g' }],
    instructions_en: 'Fill tortillas with turkey, tomato, and lettuce.', instructions_el: 'Γέμισε τις τορτίγιες με γαλοπούλα, ντομάτα και μαρούλι.', calories: 460, protein: 40, carbs: 57, fat: 7,
  },
  {
    id: 'p3-tuna-rice-bowl', name_en: 'Tuna rice bowl', name_el: 'Μπολ ρυζιού με τόνο', diet: 'balanced', servings: 1,
    ingredients: [{ name_en: 'Tuna in water', name_el: 'Τόνος', amount: 120, unit: 'g' }, { name_en: 'Cooked white rice', name_el: 'Ρύζι άσπρο μαγειρεμένο', amount: 160, unit: 'g' }, { name_en: 'Cucumber', name_el: 'Αγγούρι', amount: 80, unit: 'g' }, { name_en: 'Sweet corn', name_el: 'Καλαμπόκι', amount: 50, unit: 'g' }],
    instructions_en: 'Bowl rice with tuna, cucumber, and corn. Dress with lemon.', instructions_el: 'Σέρβιρε σε μπολ ρύζι με τόνο, αγγούρι και καλαμπόκι με λεμόνι.', calories: 450, protein: 36, carbs: 63, fat: 4,
  },
  {
    id: 'p3-chicken-soup-light', name_en: 'Light chicken soup', name_el: 'Ελαφριά κοτόσουπα', diet: 'balanced', servings: 1,
    ingredients: [{ name_en: 'Chicken breast', name_el: 'Κοτόπουλο', amount: 120, unit: 'g' }, { name_en: 'Cooked white rice', name_el: 'Ρύζι άσπρο μαγειρεμένο', amount: 100, unit: 'g' }, { name_en: 'Carrot', name_el: 'Καρότο', amount: 80, unit: 'g' }, { name_en: 'Onion', name_el: 'Κρεμμύδι', amount: 50, unit: 'g' }],
    instructions_en: 'Simmer chicken with carrot and onion, add rice, and finish with lemon.', instructions_el: 'Σιγόβρασε κοτόπουλο με καρότο και κρεμμύδι, πρόσθεσε ρύζι και λεμόνι.', calories: 360, protein: 36, carbs: 38, fat: 5,
  },
  // ---- QUICK INTERNATIONAL vegetarian (13) ----
  {
    id: 'p3-egg-fried-rice', name_en: 'Egg fried rice', name_el: 'Ρύζι με αυγό', diet: 'vegetarian', servings: 1,
    ingredients: [{ name_en: 'Egg', name_el: 'Αυγό', amount: 100, unit: 'g' }, { name_en: 'Cooked white rice', name_el: 'Ρύζι άσπρο μαγειρεμένο', amount: 180, unit: 'g' }, { name_en: 'Green peas', name_el: 'Αρακάς', amount: 80, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 8, unit: 'g' }],
    instructions_en: 'Scramble egg, add rice and peas, and stir-fry in oil.', instructions_el: 'Ανακάτεψε αυγό, πρόσθεσε ρύζι και αρακά και σόταρε στο λάδι.', calories: 480, protein: 20, carbs: 66, fat: 14,
  },
  {
    id: 'p3-mushroom-quesadilla', name_en: 'Mushroom quesadilla', name_el: 'Κεσαδίγια με μανιτάρια', diet: 'vegetarian', servings: 1,
    ingredients: [{ name_en: 'Corn tortilla', name_el: 'Τορτίγια καλαμποκιού', amount: 120, unit: 'g' }, { name_en: 'Mushrooms', name_el: 'Μανιτάρια', amount: 120, unit: 'g' }, { name_en: 'Mozzarella', name_el: 'Μοτσαρέλα', amount: 40, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 5, unit: 'g' }],
    instructions_en: 'Fill tortillas with mushrooms and mozzarella, fold, and toast.', instructions_el: 'Γέμισε τις τορτίγιες με μανιτάρια και μοτσαρέλα και ψήσε.', calories: 450, protein: 20, carbs: 60, fat: 14,
  },
  {
    id: 'p3-margherita-pasta', name_en: 'Margherita pasta', name_el: 'Ζυμαρικά μαργαρίτα', diet: 'vegetarian', servings: 1,
    ingredients: [{ name_en: 'Wholewheat pasta cooked', name_el: 'Ζυμαρικά ολικής', amount: 200, unit: 'g' }, { name_en: 'Tomato sauce', name_el: 'Σάλτσα ντομάτας', amount: 150, unit: 'g' }, { name_en: 'Mozzarella', name_el: 'Μοτσαρέλα', amount: 40, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 5, unit: 'g' }],
    instructions_en: 'Toss pasta with tomato sauce, mozzarella, and olive oil.', instructions_el: 'Ανακάτεψε τα ζυμαρικά με σάλτσα, μοτσαρέλα και ελαιόλαδο.', calories: 510, protein: 24, carbs: 70, fat: 15,
  },
  {
    id: 'p3-omelet-rice-plate', name_en: 'Omelet rice plate', name_el: 'Πιάτο ομελέτας με ρύζι', diet: 'vegetarian', servings: 1,
    ingredients: [{ name_en: 'Egg', name_el: 'Αυγό', amount: 100, unit: 'g' }, { name_en: 'Cooked white rice', name_el: 'Ρύζι άσπρο μαγειρεμένο', amount: 150, unit: 'g' }, { name_en: 'Tomato', name_el: 'Ντομάτα', amount: 80, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 8, unit: 'g' }],
    instructions_en: 'Cook a plain omelet in oil and serve with rice and tomato.', instructions_el: 'Ψήσε απλή ομελέτα στο λάδι και σέρβιρε με ρύζι και ντομάτα.', calories: 460, protein: 18, carbs: 55, fat: 18,
  },
  {
    id: 'p3-cheese-bean-burrito', name_en: 'Cheese bean burrito', name_el: 'Μπουρίτο με φασόλια και τυρί', diet: 'vegetarian', servings: 1,
    ingredients: [{ name_en: 'Corn tortilla', name_el: 'Τορτίγια καλαμποκιού', amount: 120, unit: 'g' }, { name_en: 'Cooked black beans', name_el: 'Μαύρα φασόλια', amount: 150, unit: 'g' }, { name_en: 'Mozzarella', name_el: 'Μοτσαρέλα', amount: 30, unit: 'g' }, { name_en: 'Tomato', name_el: 'Ντομάτα', amount: 60, unit: 'g' }],
    instructions_en: 'Fill tortillas with beans, cheese, and tomato. Warm through.', instructions_el: 'Γέμισε τις τορτίγιες με φασόλια, τυρί και ντομάτα και ζέστανε.', calories: 520, protein: 25, carbs: 80, fat: 11,
  },
  {
    id: 'p3-spinach-cream-pasta', name_en: 'Spinach cream pasta', name_el: 'Ζυμαρικά με σπανάκι και κρέμα', diet: 'vegetarian', servings: 1,
    ingredients: [{ name_en: 'Wholewheat pasta cooked', name_el: 'Ζυμαρικά ολικής', amount: 200, unit: 'g' }, { name_en: 'Spinach', name_el: 'Σπανάκι', amount: 120, unit: 'g' }, { name_en: 'Light cream cheese', name_el: 'Κρέμα τυριού light', amount: 40, unit: 'g' }, { name_en: 'Parmesan', name_el: 'Παρμεζάνα', amount: 10, unit: 'g' }],
    instructions_en: 'Wilt spinach, stir in cream cheese, and toss with pasta and parmesan.', instructions_el: 'Μάρανε το σπανάκι, πρόσθεσε κρέμα τυριού και ανακάτεψε με ζυμαρικά και παρμεζάνα.', calories: 480, protein: 24, carbs: 66, fat: 13,
  },
  {
    id: 'p3-egg-bulgur-skillet', name_en: 'Egg bulgur skillet', name_el: 'Τηγάνι πλιγουριού με αυγό', diet: 'vegetarian', servings: 1,
    ingredients: [{ name_en: 'Egg', name_el: 'Αυγό', amount: 100, unit: 'g' }, { name_en: 'Cooked bulgur', name_el: 'Πλιγούρι μαγειρεμένο', amount: 160, unit: 'g' }, { name_en: 'Tomato', name_el: 'Ντομάτα', amount: 100, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 8, unit: 'g' }],
    instructions_en: 'Warm bulgur with tomato, make wells, crack in eggs, and cook until set.', instructions_el: 'Ζέστανε πλιγούρι με ντομάτα, άνοιξε λακκούβες, σπάσε τα αυγά και ψήσε.', calories: 420, protein: 19, carbs: 48, fat: 17,
  },
  {
    id: 'p3-lentil-feta-bowl', name_en: 'Lentil feta bowl', name_el: 'Μπολ φακής με φέτα', diet: 'vegetarian', servings: 1,
    ingredients: [{ name_en: 'Cooked lentils', name_el: 'Φακές', amount: 180, unit: 'g' }, { name_en: 'Feta', name_el: 'Φέτα', amount: 40, unit: 'g' }, { name_en: 'Tomato', name_el: 'Ντομάτα', amount: 80, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 8, unit: 'g' }],
    instructions_en: 'Bowl lentils with tomato, feta, oil, and lemon.', instructions_el: 'Σέρβιρε σε μπολ φακές με ντομάτα, φέτα, λάδι και λεμόνι.', calories: 420, protein: 23, carbs: 41, fat: 19,
  },
  {
    id: 'p3-potato-egg-skillet', name_en: 'Potato egg skillet', name_el: 'Τηγάνι πατάτας με αυγό', diet: 'vegetarian', servings: 1,
    ingredients: [{ name_en: 'Potato', name_el: 'Πατάτα', amount: 250, unit: 'g' }, { name_en: 'Egg', name_el: 'Αυγό', amount: 100, unit: 'g' }, { name_en: 'Onion', name_el: 'Κρεμμύδι', amount: 50, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 10, unit: 'g' }],
    instructions_en: 'Crisp potato with onion, add beaten eggs, and cook until set.', instructions_el: 'Τσιγάρισε πατάτα με κρεμμύδι, πρόσθεσε αυγά και ψήσε.', calories: 480, protein: 18, carbs: 51, fat: 22,
  },
  {
    id: 'p3-tomato-soup-toast', name_en: 'Tomato soup with toast', name_el: 'Ντοματόσουπα με τοστ', diet: 'vegetarian', servings: 1,
    ingredients: [{ name_en: 'Tomato sauce', name_el: 'Σάλτσα ντομάτας', amount: 250, unit: 'g' }, { name_en: 'Wholegrain bread', name_el: 'Ψωμί ολικής', amount: 60, unit: 'g' }, { name_en: 'Feta', name_el: 'Φέτα', amount: 30, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 8, unit: 'g' }],
    instructions_en: 'Heat tomato sauce as soup with oil, serve with feta toast.', instructions_el: 'Ζέστανε τη σάλτσα σαν σούπα με λάδι, σέρβιρε με τοστ φέτας.', calories: 370, protein: 14, carbs: 44, fat: 16,
  },
  {
    id: 'p3-halloumi-bulgur-bowl', name_en: 'Halloumi bulgur bowl', name_el: 'Μπολ πλιγουριού με χαλούμι', diet: 'vegetarian', servings: 1,
    ingredients: [{ name_en: 'Halloumi', name_el: 'Χαλούμι', amount: 50, unit: 'g' }, { name_en: 'Cooked bulgur', name_el: 'Πλιγούρι μαγειρεμένο', amount: 160, unit: 'g' }, { name_en: 'Tomato', name_el: 'Ντομάτα', amount: 80, unit: 'g' }, { name_en: 'Cucumber', name_el: 'Αγγούρι', amount: 60, unit: 'g' }],
    instructions_en: 'Bowl bulgur with tomato, cucumber, and grilled halloumi.', instructions_el: 'Σέρβιρε σε μπολ πλιγούρι με ντομάτα, αγγούρι και ψητό χαλούμι.', calories: 430, protein: 19, carbs: 44, fat: 20,
  },
  {
    id: 'p3-zucchini-pasta-cheese', name_en: 'Zucchini cheese pasta', name_el: 'Ζυμαρικά με κολοκύθι και τυρί', diet: 'vegetarian', servings: 1,
    ingredients: [{ name_en: 'Wholewheat pasta cooked', name_el: 'Ζυμαρικά ολικής', amount: 200, unit: 'g' }, { name_en: 'Zucchini', name_el: 'Κολοκύθι', amount: 150, unit: 'g' }, { name_en: 'Parmesan', name_el: 'Παρμεζάνα', amount: 20, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 8, unit: 'g' }],
    instructions_en: 'Sear zucchini in oil and toss with pasta and parmesan.', instructions_el: 'Σόταρε κολοκύθι στο λάδι και ανακάτεψε με ζυμαρικά και παρμεζάνα.', calories: 480, protein: 22, carbs: 64, fat: 15,
  },
  {
    id: 'p3-mushroom-rice-parmesan', name_en: 'Mushroom rice parmesan', name_el: 'Ρύζι με μανιτάρια και παρμεζάνα', diet: 'vegetarian', servings: 1,
    ingredients: [{ name_en: 'Cooked white rice', name_el: 'Ρύζι άσπρο μαγειρεμένο', amount: 180, unit: 'g' }, { name_en: 'Mushrooms', name_el: 'Μανιτάρια', amount: 150, unit: 'g' }, { name_en: 'Parmesan', name_el: 'Παρμεζάνα', amount: 20, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 8, unit: 'g' }],
    instructions_en: 'Sear mushrooms in oil, fold through rice with parmesan.', instructions_el: 'Σόταρε μανιτάρια στο λάδι και ανακάτεψε με ρύζι και παρμεζάνα.', calories: 430, protein: 16, carbs: 60, fat: 14,
  },
  // ---- QUICK INTERNATIONAL vegan (14) ----
  {
    id: 'p3-black-bean-tacos', name_en: 'Black bean tacos', name_el: 'Τάκος με μαύρα φασόλια', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Corn tortilla', name_el: 'Τορτίγια καλαμποκιού', amount: 120, unit: 'g' }, { name_en: 'Cooked black beans', name_el: 'Μαύρα φασόλια', amount: 150, unit: 'g' }, { name_en: 'Tomato', name_el: 'Ντομάτα', amount: 80, unit: 'g' }, { name_en: 'Lettuce', name_el: 'Μαρούλι', amount: 60, unit: 'g' }],
    instructions_en: 'Fill tortillas with beans, tomato, and lettuce. Add lemon.', instructions_el: 'Γέμισε τις τορτίγιες με φασόλια, ντομάτα και μαρούλι με λεμόνι.', calories: 480, protein: 20, carbs: 87, fat: 6,
  },
  {
    id: 'p3-red-lentil-curry', name_en: 'Red lentil curry', name_el: 'Κάρι με κόκκινες φακές', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Cooked lentils', name_el: 'Φακές', amount: 200, unit: 'g' }, { name_en: 'Cooked white rice', name_el: 'Ρύζι άσπρο μαγειρεμένο', amount: 140, unit: 'g' }, { name_en: 'Tomato', name_el: 'Ντομάτα', amount: 100, unit: 'g' }, { name_en: 'Onion', name_el: 'Κρεμμύδι', amount: 60, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 8, unit: 'g' }],
    instructions_en: 'Simmer lentils with tomato, onion, and curry spices. Serve over rice.', instructions_el: 'Σιγόβρασε φακές με ντομάτα, κρεμμύδι και κάρι. Σέρβιρε με ρύζι.', calories: 480, protein: 21, carbs: 82, fat: 9,
  },
  {
    id: 'p3-chickpea-stirfry', name_en: 'Chickpea veg stir-fry', name_el: 'Ρεβίθια σωτέ με λαχανικά', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Cooked chickpeas', name_el: 'Ρεβίθια', amount: 180, unit: 'g' }, { name_en: 'Bell pepper', name_el: 'Πιπεριά', amount: 80, unit: 'g' }, { name_en: 'Zucchini', name_el: 'Κολοκύθι', amount: 100, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 10, unit: 'g' }],
    instructions_en: 'Stir-fry chickpeas with vegetables in olive oil until golden.', instructions_el: 'Σόταρε ρεβίθια με λαχανικά στο ελαιόλαδο μέχρι να ροδίσουν.', calories: 430, protein: 16, carbs: 54, fat: 17,
  },
  {
    id: 'p3-buddha-bulgur-bowl', name_en: 'Buddha bulgur bowl', name_el: 'Μπολ βούδα με πλιγούρι', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Cooked bulgur', name_el: 'Πλιγούρι μαγειρεμένο', amount: 160, unit: 'g' }, { name_en: 'Cooked chickpeas', name_el: 'Ρεβίθια', amount: 100, unit: 'g' }, { name_en: 'Carrot', name_el: 'Καρότο', amount: 60, unit: 'g' }, { name_en: 'Tahini', name_el: 'Ταχίνι', amount: 12, unit: 'g' }],
    instructions_en: 'Bowl bulgur with chickpeas and carrot. Drizzle tahini-lemon.', instructions_el: 'Σέρβιρε σε μπολ πλιγούρι με ρεβίθια και καρότο με ταχίνι-λεμόνι.', calories: 440, protein: 15, carbs: 68, fat: 12,
  },
  {
    id: 'p3-vegan-chili', name_en: 'Bean corn chili', name_el: 'Τσίλι με φασόλια και καλαμπόκι', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Cooked white beans', name_el: 'Φασόλια', amount: 180, unit: 'g' }, { name_en: 'Sweet corn', name_el: 'Καλαμπόκι', amount: 80, unit: 'g' }, { name_en: 'Tomato sauce', name_el: 'Σάλτσα ντομάτας', amount: 150, unit: 'g' }, { name_en: 'Onion', name_el: 'Κρεμμύδι', amount: 60, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 8, unit: 'g' }],
    instructions_en: 'Simmer beans with corn, tomato, and onion 12 minutes.', instructions_el: 'Σιγόβρασε φασόλια με καλαμπόκι, ντομάτα και κρεμμύδι 12 λεπτά.', calories: 420, protein: 18, carbs: 69, fat: 9,
  },
  {
    id: 'p3-asian-rice-pan', name_en: 'Asian rice veg pan', name_el: 'Τηγάνι ρυζιού με λαχανικά', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Cooked white rice', name_el: 'Ρύζι άσπρο μαγειρεμένο', amount: 180, unit: 'g' }, { name_en: 'Bell pepper', name_el: 'Πιπεριά', amount: 80, unit: 'g' }, { name_en: 'Mushrooms', name_el: 'Μανιτάρια', amount: 100, unit: 'g' }, { name_en: 'Green peas', name_el: 'Αρακάς', amount: 60, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 8, unit: 'g' }],
    instructions_en: 'Stir-fry vegetables in oil and toss with rice.', instructions_el: 'Σόταρε τα λαχανικά στο λάδι και ανακάτεψε με ρύζι.', calories: 420, protein: 11, carbs: 75, fat: 10,
  },
  {
    id: 'p3-lentil-bolognese', name_en: 'Lentil bolognese', name_el: 'Μπολονέζ με φακές', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Wholewheat pasta cooked', name_el: 'Ζυμαρικά ολικής', amount: 200, unit: 'g' }, { name_en: 'Cooked lentils', name_el: 'Φακές', amount: 120, unit: 'g' }, { name_en: 'Tomato sauce', name_el: 'Σάλτσα ντομάτας', amount: 150, unit: 'g' }, { name_en: 'Onion', name_el: 'Κρεμμύδι', amount: 50, unit: 'g' }],
    instructions_en: 'Simmer lentils with tomato and onion, serve over pasta.', instructions_el: 'Σιγόβρασε φακές με ντομάτα και κρεμμύδι, σέρβιρε με ζυμαρικά.', calories: 500, protein: 23, carbs: 88, fat: 6,
  },
  {
    id: 'p3-chickpea-tomato-curry', name_en: 'Chickpea tomato curry', name_el: 'Κάρι ρεβιθιών με ντομάτα', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Cooked chickpeas', name_el: 'Ρεβίθια', amount: 180, unit: 'g' }, { name_en: 'Tomato', name_el: 'Ντομάτα', amount: 150, unit: 'g' }, { name_en: 'Onion', name_el: 'Κρεμμύδι', amount: 60, unit: 'g' }, { name_en: 'Cooked white rice', name_el: 'Ρύζι άσπρο μαγειρεμένο', amount: 120, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 8, unit: 'g' }],
    instructions_en: 'Simmer chickpeas with tomato, onion, and curry spices. Serve with rice.', instructions_el: 'Σιγόβρασε ρεβίθια με ντομάτα, κρεμμύδι και κάρι. Σέρβιρε με ρύζι.', calories: 500, protein: 17, carbs: 82, fat: 12,
  },
  {
    id: 'p3-bulgur-stuffed-peppers', name_en: 'Bulgur stuffed peppers', name_el: 'Πιπεριές γεμιστές με πλιγούρι', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Bell pepper', name_el: 'Πιπεριά', amount: 250, unit: 'g' }, { name_en: 'Cooked bulgur', name_el: 'Πλιγούρι μαγειρεμένο', amount: 150, unit: 'g' }, { name_en: 'Tomato', name_el: 'Ντομάτα', amount: 100, unit: 'g' }, { name_en: 'Onion', name_el: 'Κρεμμύδι', amount: 50, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 10, unit: 'g' }],
    instructions_en: 'Fill peppers with bulgur, tomato, and onion. Bake until tender.', instructions_el: 'Γέμισε τις πιπεριές με πλιγούρι, ντομάτα και κρεμμύδι και ψήσε.', calories: 360, protein: 9, carbs: 56, fat: 12,
  },
  {
    id: 'p3-bean-tomato-stew', name_en: 'Quick bean tomato stew', name_el: 'Γρήγορο φασολάκι με ντομάτα', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Cooked white beans', name_el: 'Φασόλια', amount: 200, unit: 'g' }, { name_en: 'Tomato', name_el: 'Ντομάτα', amount: 150, unit: 'g' }, { name_en: 'Onion', name_el: 'Κρεμμύδι', amount: 60, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 10, unit: 'g' }],
    instructions_en: 'Simmer beans with tomato and onion 12 minutes. Finish with oil.', instructions_el: 'Σιγόβρασε φασόλια με ντομάτα και κρεμμύδι 12 λεπτά. Τελείωσε με λάδι.', calories: 380, protein: 19, carbs: 52, fat: 11,
  },
  {
    id: 'p3-mushroom-lentil-pan', name_en: 'Mushroom lentil pan', name_el: 'Τηγάνι μανιταριών με φακές', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Cooked lentils', name_el: 'Φακές', amount: 180, unit: 'g' }, { name_en: 'Mushrooms', name_el: 'Μανιτάρια', amount: 150, unit: 'g' }, { name_en: 'Onion', name_el: 'Κρεμμύδι', amount: 60, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 10, unit: 'g' }],
    instructions_en: 'Sear mushrooms with onion, add lentils, and warm through.', instructions_el: 'Σόταρε μανιτάρια με κρεμμύδι, πρόσθεσε φακές και ζέστανε.', calories: 360, protein: 21, carbs: 42, fat: 12,
  },
  {
    id: 'p3-peanut-noodle-bowl', name_en: 'Peanut noodle bowl', name_el: 'Μπολ νουντλς με φυστικοβούτυρο', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Wholewheat pasta cooked', name_el: 'Ζυμαρικά ολικής', amount: 180, unit: 'g' }, { name_en: 'Peanut butter', name_el: 'Φυστικοβούτυρο', amount: 20, unit: 'g' }, { name_en: 'Bell pepper', name_el: 'Πιπεριά', amount: 80, unit: 'g' }, { name_en: 'Cucumber', name_el: 'Αγγούρι', amount: 60, unit: 'g' }],
    instructions_en: 'Toss pasta with peanut-lemon sauce and crunchy vegetables.', instructions_el: 'Ανακάτεψε τα ζυμαρικά με σάλτσα φυστικοβούτυρο-λεμόνι και τραγανά λαχανικά.', calories: 500, protein: 17, carbs: 69, fat: 17,
  },
  {
    id: 'p3-corn-bean-rice-bowl', name_en: 'Corn bean rice bowl', name_el: 'Μπολ ρυζιού με καλαμπόκι και φασόλια', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Cooked white rice', name_el: 'Ρύζι άσπρο μαγειρεμένο', amount: 160, unit: 'g' }, { name_en: 'Cooked black beans', name_el: 'Μαύρα φασόλια', amount: 120, unit: 'g' }, { name_en: 'Sweet corn', name_el: 'Καλαμπόκι', amount: 80, unit: 'g' }, { name_en: 'Tomato', name_el: 'Ντομάτα', amount: 80, unit: 'g' }],
    instructions_en: 'Bowl rice with beans, corn, and tomato. Dress with lime.', instructions_el: 'Σέρβιρε σε μπολ ρύζι με φασόλια, καλαμπόκι και ντομάτα με λάιμ.', calories: 460, protein: 17, carbs: 90, fat: 4,
  },
  {
    id: 'p3-tomato-chickpea-pasta', name_en: 'Tomato chickpea pasta', name_el: 'Ζυμαρικά με ντομάτα και ρεβίθια', diet: 'vegan', servings: 1,
    ingredients: [{ name_en: 'Wholewheat pasta cooked', name_el: 'Ζυμαρικά ολικής', amount: 200, unit: 'g' }, { name_en: 'Cooked chickpeas', name_el: 'Ρεβίθια', amount: 120, unit: 'g' }, { name_en: 'Tomato sauce', name_el: 'Σάλτσα ντομάτας', amount: 150, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 8, unit: 'g' }],
    instructions_en: 'Toss pasta with chickpeas, warm tomato sauce, and olive oil.', instructions_el: 'Ανακάτεψε τα ζυμαρικά με ρεβίθια, ζεστή σάλτσα και ελαιόλαδο.', calories: 540, protein: 22, carbs: 88, fat: 12,
  },
];

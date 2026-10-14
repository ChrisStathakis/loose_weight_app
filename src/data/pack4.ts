import type { Food, Recipe } from '../types';

// Pack 4: international staples, fast food, sweets, beverages and condiments.
// Values are per 100 g/ml from standard nutrition references (rounded).

const pack4FoodData: Array<[string, string, string, number, number, number, number, number]> = [
  // Fast food & takeaway
  ['pizza-margherita-food', 'Pizza margherita', 'Πίτσα μαργαρίτα', 266, 11, 33, 10, 120],
  ['pizza-pepperoni', 'Pizza pepperoni', 'Πίτσα πεπερόνι', 280, 12, 30, 13, 120],
  ['pizza-special', 'Pizza special', 'Πίτσα σπέσιαλ', 275, 12, 30, 12, 120],
  ['cheeseburger', 'Cheeseburger', 'Τσίζμπεργκερ', 250, 13, 22, 12, 150],
  ['hamburger', 'Hamburger', 'Χάμπουργκερ', 230, 12, 24, 9, 120],
  ['club-sandwich', 'Club sandwich', 'Κλαμπ σάντουιτς', 220, 12, 20, 10, 200],
  ['hot-dog', 'Hot dog', 'Χοτ ντογκ', 280, 10, 22, 17, 100],
  ['french-fries', 'French fries', 'Τηγανητές πατάτες', 320, 4, 38, 17, 100],
  ['chicken-nuggets', 'Chicken nuggets', 'Κοτομπουκιές', 280, 16, 18, 16, 100],
  ['chicken-wings', 'Chicken wings', 'Φτερούγες κοτόπουλου', 290, 27, 0, 19, 120],
  ['onion-rings', 'Onion rings', 'Ροδέλες κρεμμυδιού', 400, 5, 45, 22, 100],
  ['mozzarella-sticks', 'Mozzarella sticks', 'Στικ μοτσαρέλας', 320, 14, 22, 19, 100],
  ['spring-rolls', 'Spring rolls', 'Ρολάκια άνοιξης', 200, 5, 26, 8, 100],
  ['falafel', 'Falafel', 'Φαλάφελ', 330, 13, 32, 18, 100],
  ['garlic-bread', 'Garlic bread', 'Ψωμί με σκόρδο', 350, 8, 42, 17, 60],
  ['tortilla-wrap', 'Wheat tortilla wrap', 'Τορτίγια σταρένια', 310, 8, 52, 8, 60],
  // Sweets & snacks
  ['milk-chocolate', 'Milk chocolate', 'Σοκολάτα γάλακτος', 535, 8, 59, 30, 25],
  ['dark-chocolate', 'Dark chocolate', 'Μαύρη σοκολάτα', 600, 8, 46, 43, 25],
  ['chocolate-spread', 'Chocolate-hazelnut spread', 'Μερέντα φουντουκιού', 539, 6, 58, 31, 20],
  ['vanilla-ice-cream', 'Vanilla ice cream', 'Παγωτό βανίλια', 207, 3.5, 24, 11, 80],
  ['chocolate-ice-cream', 'Chocolate ice cream', 'Παγωτό σοκολάτα', 216, 4, 26, 11, 80],
  ['butter-cookies', 'Butter cookies', 'Κουλουράκια βουτύρου', 480, 6, 62, 23, 30],
  ['choc-chip-cookies', 'Chocolate chip cookies', 'Μπισκότα με κομματάκια σοκολάτας', 490, 6, 60, 25, 30],
  ['croissant-butter', 'Butter croissant', 'Κρουασάν βουτύρου', 406, 8, 45, 21, 60],
  ['croissant-chocolate', 'Chocolate croissant', 'Κρουασάν σοκολάτας', 420, 8, 48, 22, 80],
  ['donut-glazed', 'Glazed donut', 'Ντόνατ με γλάσο', 450, 5, 55, 25, 60],
  ['blueberry-muffin', 'Blueberry muffin', 'Μάφιν μύρτιλο', 377, 5, 52, 17, 80],
  ['chocolate-cake', 'Chocolate cake', 'Κέικ σοκολάτας', 390, 5, 55, 18, 80],
  ['cheesecake', 'Cheesecake', 'Τσιζκέικ', 320, 6, 26, 21, 100],
  ['popcorn-salted', 'Popcorn (salted)', 'Ποπκόρν με αλάτι', 400, 12, 60, 20, 30],
  ['potato-chips', 'Potato chips', 'Τσιπς', 536, 7, 53, 35, 30],
  ['strawberry-jam', 'Strawberry jam', 'Μαρμελάδα φράουλα', 278, 0.4, 68, 0.2, 20],
  ['maple-syrup', 'Maple syrup', 'Σιρόπι σφενδάμου', 260, 0, 67, 0.1, 20],
  // Breakfast
  ['corn-flakes', 'Corn flakes', 'Κορν φλέικς', 357, 7, 84, 0.5, 30],
  ['granola-honey', 'Honey granola', 'Γκρανόλα με μέλι', 430, 10, 62, 16, 45],
  ['muesli', 'Muesli', 'Μούσλι', 360, 10, 66, 6, 45],
  ['pancakes-plain', 'Pancakes', 'Τηγανίτες (pancakes)', 227, 6, 36, 7, 100],
  // Beverages
  ['orange-juice', 'Orange juice', 'Χυμός πορτοκάλι', 45, 0.7, 10.4, 0.2, 250],
  ['apple-juice', 'Apple juice', 'Χυμός μήλο', 46, 0.1, 11.3, 0.1, 250],
  ['cola', 'Cola', 'Κόλα', 42, 0, 10.6, 0, 330],
  ['lemon-soda', 'Lemon soda', 'Λεμονάδα ανθρακούχο', 40, 0, 10, 0, 330],
  ['lager-beer', 'Lager beer', 'Μπίρα lager', 43, 0.5, 3.6, 0, 330],
  ['white-wine', 'White wine', 'Λευκό κρασί', 82, 0.1, 2.6, 0, 150],
  ['hot-chocolate', 'Hot chocolate', 'Ζεστή σοκολάτα', 77, 3, 11, 2.5, 200],
  ['milkshake-vanilla', 'Vanilla milkshake', 'Μιλκσέικ βανίλια', 110, 3, 18, 3, 250],
  ['espresso', 'Espresso', 'Εσπρέσο', 2, 0.3, 0, 0, 30],
  ['cappuccino', 'Cappuccino', 'Καπουτσίνο', 40, 2.5, 3.5, 1.5, 180],
  ['black-tea', 'Black tea (plain)', 'Μαύρο τσάι (σκέτο)', 1, 0, 0.3, 0, 200],
  // Condiments & basics
  ['ketchup', 'Ketchup', 'Κέτσαπ', 100, 1.5, 25, 0.2, 15],
  ['mayonnaise', 'Mayonnaise', 'Μαγιονέζα', 680, 1, 1, 75, 15],
  ['mustard', 'Mustard', 'Μουστάρδα', 60, 4, 6, 4, 10],
  ['bbq-sauce', 'BBQ sauce', 'Σάλτσα BBQ', 150, 1, 38, 0.5, 15],
  ['caesar-dressing', 'Caesar dressing', 'Ντρέσινγκ Καίσαρα', 480, 2, 4, 51, 20],
  ['sugar-white', 'White sugar', 'Λευκή ζάχαρη', 387, 0, 100, 0, 10],
  ['salt', 'Salt', 'Αλάτι', 0, 0, 0, 0, 2],
  ['balsamic', 'Balsamic vinegar', 'Μπαλσάμικο', 88, 0.5, 17, 0, 10],
  ['soy-sauce', 'Soy sauce', 'Σάλτσα σόγιας', 53, 5, 5, 0, 10],
  // Everyday extras
  ['white-bread', 'White bread', 'Λευκό ψωμί', 265, 9, 49, 3.2, 40],
  ['baguette', 'Baguette', 'Μπαγκέτα', 270, 9, 55, 2, 60],
  ['spaghetti-white', 'White spaghetti (cooked)', 'Λευκά σπαγγέτι (βρασμένα)', 131, 5, 25, 1.1, 180],
  ['rice-white', 'White rice (cooked)', 'Λευκό ρύζι (βρασμένο)', 130, 2.7, 28, 0.3, 160],
  ['wheat-flour', 'Wheat flour', 'Αλεύρι σταρένιο', 364, 10, 76, 1, 50],
  ['minced-beef', 'Minced beef', 'Κιμάς μοσχαρίσιος', 250, 18, 0, 20, 120],
  ['minced-pork', 'Minced pork', 'Κιμάς χοιρινός', 300, 16, 0, 26, 120],
  ['bacon', 'Bacon', 'Μπέικον', 540, 37, 1.5, 42, 20],
  ['frankfurter', 'Frankfurter sausage', 'Λουκάνικο Φρανκφούρτης', 300, 12, 2, 27, 50],
  // Generic dishes (also exist as recipes, but Plan favorites search foods)
  ['vegetable-soup', 'Vegetable soup', 'Σούπα λαχανικών', 45, 1.5, 8, 1, 250],
  ['chicken-soup', 'Chicken soup', 'Κοτόσουπα', 60, 5, 5, 2, 250],
  ['green-salad', 'Green salad (no dressing)', 'Πράσινη σαλάτα (χωρίς ντρέσινγκ)', 20, 1.5, 3.5, 0.2, 150],
];

export const pack4Foods: Food[] = pack4FoodData.map(
  ([id, name_en, name_el, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, serving_grams]) => ({
    id,
    name_en,
    name_el,
    calories_per_100g,
    protein_per_100g,
    carbs_per_100g,
    fat_per_100g,
    serving_grams,
    source: 'Daily Plate starter library',
  }),
);

export const pack4Recipes: Recipe[] = [
  {
    id: 'pizza-margherita-home', name_en: 'Homemade margherita pizza', name_el: 'Σπιτική πίτσα μαργαρίτα', diet: 'vegetarian', servings: 2,
    ingredients: [{ name_en: 'Wheat flour', name_el: 'Αλεύρι', amount: 200, unit: 'g' }, { name_en: 'Tomato sauce', name_el: 'Σάλτσα ντομάτας', amount: 100, unit: 'g' }, { name_en: 'Mozzarella', name_el: 'Μοτσαρέλα', amount: 120, unit: 'g' }, { name_en: 'Olive oil', name_el: 'Ελαιόλαδο', amount: 8, unit: 'g' }],
    instructions_en: 'Make the dough, spread tomato sauce, add mozzarella and bake until golden.', instructions_el: 'Ετοίμασε τη ζύμη, άπλωσε σάλτσα, πρόσθεσε μοτσαρέλα και ψήσε.', calories: 560, protein: 22, carbs: 70, fat: 20,
  },
  {
    id: 'cheeseburger-home', name_en: 'Homemade cheeseburger', name_el: 'Σπιτικό τσίζμπεργκερ', diet: 'balanced', servings: 1,
    ingredients: [{ name_en: 'Minced beef', name_el: 'Κιμάς', amount: 120, unit: 'g' }, { name_en: 'White bread', name_el: 'Λευκό ψωμί', amount: 70, unit: 'g' }, { name_en: 'Cheddar', name_el: 'Τσένταρ', amount: 20, unit: 'g' }, { name_en: 'Tomato', name_el: 'Ντομάτα', amount: 40, unit: 'g' }, { name_en: 'Mayonnaise', name_el: 'Μαγιονέζα', amount: 10, unit: 'g' }],
    instructions_en: 'Grill the patty, melt the cheddar on top and assemble with tomato and mayo.', instructions_el: 'Ψήσε το μπιφτέκι, λιώσε το τσένταρ και στήσε με ντομάτα και μαγιονέζα.', calories: 640, protein: 32, carbs: 40, fat: 28,
  },
  {
    id: 'club-sandwich-home', name_en: 'Homemade club sandwich', name_el: 'Σπιτικό κλαμπ σάντουιτς', diet: 'balanced', servings: 1,
    ingredients: [{ name_en: 'White bread', name_el: 'Λευκό ψωμί', amount: 90, unit: 'g' }, { name_en: 'Chicken breast', name_el: 'Κοτόπουλο', amount: 80, unit: 'g' }, { name_en: 'Bacon', name_el: 'Μπέικον', amount: 20, unit: 'g' }, { name_en: 'Tomato', name_el: 'Ντομάτα', amount: 40, unit: 'g' }, { name_en: 'Mayonnaise', name_el: 'Μαγιονέζα', amount: 10, unit: 'g' }],
    instructions_en: 'Toast the bread, layer chicken, bacon and tomato with mayo.', instructions_el: 'Φρυγάνισε το ψωμί και στρώσε κοτόπουλο, μπέικον και ντομάτα με μαγιονέζα.', calories: 520, protein: 32, carbs: 42, fat: 24,
  },
  {
    id: 'pancakes-honey-home', name_en: 'Pancakes with honey', name_el: 'Τηγανίτες με μέλι', diet: 'vegetarian', servings: 2,
    ingredients: [{ name_en: 'Wheat flour', name_el: 'Αλεύρι', amount: 100, unit: 'g' }, { name_en: 'Egg', name_el: 'Αυγό', amount: 50, unit: 'g' }, { name_en: 'Semi-skimmed milk', name_el: 'Γάλα', amount: 150, unit: 'g' }, { name_en: 'Honey', name_el: 'Μέλι', amount: 20, unit: 'g' }, { name_en: 'Butter', name_el: 'Βούτυρο', amount: 10, unit: 'g' }],
    instructions_en: 'Whisk into batter, fry small pancakes and serve with honey.', instructions_el: 'Χτύπησε το μείγμα, τηγάνισε μικρές τηγανίτες και σέρβιρε με μέλι.', calories: 420, protein: 12, carbs: 68, fat: 12,
  },
  {
    id: 'chocolate-cake-home', name_en: 'Chocolate cake', name_el: 'Κέικ σοκολάτας', diet: 'vegetarian', servings: 8,
    ingredients: [{ name_en: 'Wheat flour', name_el: 'Αλεύρι', amount: 250, unit: 'g' }, { name_en: 'Cocoa powder', name_el: 'Κακάο', amount: 30, unit: 'g' }, { name_en: 'White sugar', name_el: 'Ζάχαρη', amount: 200, unit: 'g' }, { name_en: 'Egg', name_el: 'Αυγό', amount: 100, unit: 'g' }, { name_en: 'Butter', name_el: 'Βούτυρο', amount: 100, unit: 'g' }, { name_en: 'Semi-skimmed milk', name_el: 'Γάλα', amount: 100, unit: 'g' }],
    instructions_en: 'Mix, pour into a pan and bake at 180°C until set.', instructions_el: 'Ανακάτεψε, ρίξε στη φόρμα και ψήσε στους 180°C.', calories: 350, protein: 5, carbs: 50, fat: 15,
  },
  {
    id: 'caesar-salad-chicken', name_en: 'Chicken caesar salad', name_el: 'Σαλάτα Καίσαρα με κοτόπουλο', diet: 'balanced', servings: 1,
    ingredients: [{ name_en: 'Chicken breast', name_el: 'Κοτόπουλο', amount: 120, unit: 'g' }, { name_en: 'Lettuce', name_el: 'Μαρούλι', amount: 80, unit: 'g' }, { name_en: 'Parmesan', name_el: 'Παρμεζάνα', amount: 20, unit: 'g' }, { name_en: 'Caesar dressing', name_el: 'Ντρέσινγκ Καίσαρα', amount: 30, unit: 'g' }, { name_en: 'White bread', name_el: 'Λευκό ψωμί', amount: 30, unit: 'g' }],
    instructions_en: 'Grill chicken, toss with lettuce, parmesan, dressing and croutons.', instructions_el: 'Ψήσε το κοτόπουλο και ανακάτεψε με μαρούλι, παρμεζάνα, ντρέσινγκ και κρουτόν.', calories: 450, protein: 35, carbs: 12, fat: 30,
  },
];

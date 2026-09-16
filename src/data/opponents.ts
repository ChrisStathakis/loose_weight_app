import { Badge, Opponent } from '@/src/types';
import { gradients } from '@/src/theme';

export const OPPONENTS: Opponent[] = [
  {
    id: 'sugar-gremlin',
    name_en: 'Sugar Gremlin',
    name_el: 'Ζαχαρο-Καλικάντζαρος',
    emoji: '👹',
    gradient: gradients.heroBerry,
    taunt_en: 'Bet you can’t skip the sweets today.',
    taunt_el: 'Στοίχημα ότι δεν αντιστέκεσαι στα γλυκά.',
    weakness_en: 'Log 3 meals under goal',
    weakness_el: 'Κατέγραψε 3 γεύματα κάτω από τον στόχο',
  },
  {
    id: 'snack-kraken',
    name_en: 'Snack Kraken',
    name_el: 'Σνακ-Κράκεν',
    emoji: '🦑',
    gradient: gradients.heroGrape,
    taunt_en: 'I strike between meals. Be ready.',
    taunt_el: 'Χτυπάω ανάμεσα στα γεύματα. Ετοιμάσου.',
    weakness_en: 'Hit protein goal',
    weakness_el: 'Πιάσε τον στόχο πρωτεΐνης',
  },
  {
    id: 'couch-sloth',
    name_en: 'Couch Sloth',
    name_el: 'Βραδύποδας του Καναπέ',
    emoji: '🦥',
    gradient: gradients.heroSunset,
    taunt_en: 'Logging is effort. Naps are easier...',
    taunt_el: 'Η καταγραφή θέλει κόπο. Ο ύπνος είναι πιο εύκολος...',
    weakness_en: 'Keep a 2-day streak + 2L water',
    weakness_el: 'Κράτα σερί 2 ημερών + 2L νερό',
  },
];

export const BADGES: Badge[] = [
  { id: 'streak-3', emoji: '🔥', name_en: 'On Fire', name_el: 'Φωτιά', desc_en: '3-day logging streak', desc_el: 'Σερί 3 ημερών' },
  { id: 'goal-crusher', emoji: '🎯', name_en: 'Goal Crusher', name_el: 'Θρυμματιστής Στόχων', desc_en: 'Hit calorie goal', desc_el: 'Έπιασες τον στόχο θερμίδων' },
  { id: 'hydrated', emoji: '💧', name_en: 'Hydrated', name_el: 'Ενυδατωμένος', desc_en: 'Drink 2000 ml in a day', desc_el: 'Ήπιες 2000 ml σε μια μέρα' },
  { id: 'boss-slayer', emoji: '⚔️', name_en: 'Boss Slayer', name_el: 'Εξολοθρευτής', desc_en: 'Defeat a weekly opponent', desc_el: 'Νίκησες τον αντίπαλο της εβδομάδας' },
  { id: 'planner-pro', emoji: '🗓️', name_en: 'Planner Pro', name_el: 'Μάστερ Πλάνου', desc_en: 'Save a meal plan', desc_el: 'Αποθήκευσες πλάνο γευμάτων' },
  { id: 'workout-warrior', emoji: '💪', name_en: 'Workout Warrior', name_el: 'Πολεμιστής', desc_en: 'Work out on 3 days in a week', desc_el: 'Προπονήθηκες 3 ημέρες σε μια εβδομάδα' },
  { id: 'streak-7', emoji: '📆', name_en: 'Week on Fire', name_el: 'Φωτιά Εβδομάδας', desc_en: '7-day logging streak', desc_el: 'Σερί 7 ημερών' },
  { id: 'protein-pro', emoji: '🥩', name_en: 'Protein Pro', name_el: 'Πρωτεΐνη Pro', desc_en: 'Hit your protein goal', desc_el: 'Έπιασες τον στόχο πρωτεΐνης' },
  { id: 'macro-master', emoji: '🍱', name_en: 'Full Plate', name_el: 'Πλήρες Πιάτο', desc_en: 'Hit protein, carbs and fat in one day', desc_el: 'Έπιασες πρωτεΐνη, υδατάνθρακες και λίπος μαζί' },
  { id: 'first-sweat', emoji: '🌱', name_en: 'First Sweat', name_el: 'Πρώτος Ιδρώτας', desc_en: 'Log your first workout', desc_el: 'Κατέγραψες την πρώτη προπόνηση' },
  { id: 'aqua-trio', emoji: '🌊', name_en: 'Aqua Trio', name_el: 'Τριάδα Νερού', desc_en: 'Water goal on 3 days in a week', desc_el: 'Στόχος νερού 3 ημέρες σε μια εβδομάδα' },
  { id: 'scale-buddy', emoji: '⚖️', name_en: 'Scale Buddy', name_el: 'Φίλος Ζυγαριάς', desc_en: 'Log weight 3 times in 30 days', desc_el: 'Κατέγραψες βάρος 3 φορές σε 30 ημέρες' },
];

export function opponentForWeek(dateKey: string): Opponent {
  let h = 0;
  const week = dateKey.slice(0, 7);
  for (let i = 0; i < week.length; i += 1) h = (h * 31 + week.charCodeAt(i)) >>> 0;
  return OPPONENTS[h % OPPONENTS.length];
}

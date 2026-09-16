export function levelForXp(xp: number): { level: number; into: number; needed: number } {
  const level = Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1;
  const base = (level - 1) * (level - 1) * 100;
  const next = level * level * 100;
  return { level, into: Math.max(0, xp - base), needed: Math.max(1, next - base) };
}

export function xpForEvent(kind: string): number {
  switch (kind) {
    case 'log-food':
      return 10;
    case 'goal-hit':
      return 50;
    case 'water-goal':
      return 25;
    case 'plan-saved':
      return 30;
    case 'boss-hit':
      return 15;
    case 'boss-slay':
      return 120;
    case 'streak-day':
      return 20;
    case 'workout-log':
      return 15;
    case 'badge-streak':
      return 60;
    case 'badge-protein':
      return 40;
    case 'badge-macro':
      return 60;
    case 'badge-first-workout':
      return 30;
    case 'badge-water':
      return 40;
    case 'badge-weight':
      return 30;
    default:
      return 5;
  }
}

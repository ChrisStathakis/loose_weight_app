export type BossState = {
  hp: number;
  maxHp: number;
  damageDealt: number;
  defeated: boolean;
};

/** Deterministic weekly boss HP from healthy habits. No backend needed. */
export function computeBossHp(args: {
  loggedDays: number;
  goalHits: number;
  proteinHits: number;
  waterGoalHits: number;
  streak: number;
}): BossState {
  const maxHp = 100;
  const damage =
    Math.min(40, args.loggedDays * 8) +
    Math.min(30, args.goalHits * 15) +
    Math.min(15, args.proteinHits * 7) +
    Math.min(15, args.waterGoalHits * 7) +
    Math.min(20, args.streak * 4);
  const hp = Math.max(0, Math.round(maxHp - damage));
  return { hp, maxHp, damageDealt: Math.round(damage), defeated: hp <= 0 };
}

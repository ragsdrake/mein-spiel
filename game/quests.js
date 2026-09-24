/**
 * game/quests.js
 * Rotating "Aufträge": three goals at a time, each counts a lifetime stat
 * from the moment it was handed out. Claiming pays gems and deals a new one.
 */

export const QUEST_KINDS = {
  checkins: { icon: 'bell-ring',      text: n => `Checke ${n} Gäste ein`,        base: 10 },
  drinks:   { icon: 'glass-cocktail', text: n => `Serviere ${n} Drinks`,          base: 8 },
  cleans:   { icon: 'broom',          text: n => `Putze ${n} Zimmer`,             base: 8 },
  tips:     { icon: 'hand-coin',      text: n => `Sammle ${n} Trinkgelder`,       base: 3 },
  upgrades: { icon: 'arrow-up-bold',  text: n => `Baue ${n}× etwas aus`,          base: 3 },
  guests:   { icon: 'account-group',  text: n => `Verabschiede ${n} zufriedene Gäste`, base: 12 },
};

const KIND_IDS = Object.keys(QUEST_KINDS);

export function makeQuest(stats, tier, avoid = []) {
  const pool = KIND_IDS.filter(k => !avoid.includes(k));
  const kind = pool[Math.floor(Math.random() * pool.length)];
  const target = Math.round(QUEST_KINDS[kind].base * (1 + tier * 0.5));
  return {
    uid:    `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    kind,
    start:  stats[kind] ?? 0,
    target,
    reward: 4 + Math.min(12, tier * 2),
  };
}

export const questProgress = (q, stats) => Math.min(q.target, (stats[q.kind] ?? 0) - q.start);
export const questDone = (q, stats) => questProgress(q, stats) >= q.target;

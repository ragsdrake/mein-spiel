/**
 * game/config.js
 * Balancing, guest types and the hotel floor plan (world units, y = up).
 * The hotel floor spans x 0..14 and z 0..12; the camera looks from +x/+z,
 * so the walls at x = 0 and z = 0 are the "back" walls.
 */

// ─── guest types (unlocked by hotel stars) ───────────────────────────────────
export const GUEST_TYPES = [
  { id: 'gespenst',    name: 'Kleines Gespenst', star: 0, mult: 1,   color: '#eef6ff', glow: '#9fd4ff' },
  { id: 'poltergeist', name: 'Poltergeist',      star: 1, mult: 1.6, color: '#d8ffe4', glow: '#6dff9e' },
  { id: 'banshee',     name: 'Banshee',          star: 2, mult: 2.5, color: '#dfe6ff', glow: '#7f9cff' },
  { id: 'graf',        name: 'Geister-Graf',     star: 3, mult: 4,   color: '#f1e3ff', glow: '#c77dff' },
  { id: 'ritter',      name: 'Kopfloser Ritter', star: 4, mult: 7,   color: '#e6eef2', glow: '#8fe3ff' },
  { id: 'koenigin',    name: 'Geisterkönigin',   star: 5, mult: 12,  color: '#fff6dc', glow: '#ffd36b' },
];

export const getGuestType = (id) => GUEST_TYPES.find(t => t.id === id) ?? GUEST_TYPES[0];

// ─── hotel rating ────────────────────────────────────────────────────────────
/** Lifetime earnings needed for 1..5 stars. */
export const STAR_THRESHOLDS = [300, 2500, 15000, 90000, 600000];
export const GEMS_PER_STAR = 15;

export function starsFor(totalEarned) {
  return STAR_THRESHOLDS.filter(t => totalEarned >= t).length;
}

/** 0..1 progress towards the next star (1 when maxed). */
export function starProgress(totalEarned) {
  const stars = starsFor(totalEarned);
  if (stars >= STAR_THRESHOLDS.length) return 1;
  const from = stars === 0 ? 0 : STAR_THRESHOLDS[stars - 1];
  return (totalEarned - from) / (STAR_THRESHOLDS[stars] - from);
}

// ─── rooms ───────────────────────────────────────────────────────────────────
export const ROOM_MAX_LEVEL = 10;
export const ROOM_UNLOCK_COST = [0, 60, 400, 2500, 15000, 90000];
export const ROOM_NAMES = [
  'Gruft 1', 'Gruft 2', 'Mondschein-Suite', 'Spinnweben-Zimmer', 'Turmkammer', 'Königsgruft',
];
export const roomPrice   = (level) => Math.round(10 * Math.pow(1.45, level - 1));
export const roomUpgradeCost = (index, level) =>
  Math.round(30 * Math.pow(1.75, level) * (1 + index * 0.8));
export const STAY_SECONDS = 9;

// ─── bar ─────────────────────────────────────────────────────────────────────
export const BAR_UNLOCK_COST = 250;
export const BAR_MAX_LEVEL = 10;
export const drinkPrice     = (level) => Math.round(5 * Math.pow(1.5, level - 1));
export const barStools      = (level) => Math.min(4, 2 + Math.floor((level - 1) / 3));
export const barUpgradeCost = (level) => Math.round(120 * Math.pow(1.8, level));
export const DRINK_SECONDS = 3.5;
export const BAR_VISIT_CHANCE = 0.65;

// ─── reception ───────────────────────────────────────────────────────────────
export const RECEPTION_MAX_LEVEL = 10;
export const spawnInterval        = (level) => Math.max(2.2, 7 - 0.5 * (level - 1));
export const autoCheckinSeconds   = (level) => 1.6 / (1 + 0.15 * (level - 1));
export const receptionUpgradeCost = (level) => Math.round(80 * Math.pow(1.9, level));

// ─── staff (one-time hire → automation) ──────────────────────────────────────
export const STAFF = [
  { id: 'skelett', name: 'Skelett Knochenbert', job: 'Checkt Gäste automatisch ein', cost: 150,  icon: 'skull' },
  { id: 'zombie',  name: 'Zombie Modrine',      job: 'Putzt Ektoplasma automatisch',  cost: 500,  icon: 'broom' },
  { id: 'hexe',    name: 'Hexe Kessel-Kathi',   job: 'Serviert an der Bar',            cost: 1200, icon: 'pot-mix', needsBar: true },
];
export const CLEAN_SECONDS_TAP    = 0.4;
export const CLEAN_SECONDS_ZOMBIE = 2;
export const SERVE_SECONDS_WITCH  = 1.2;

// ─── boost & offline ─────────────────────────────────────────────────────────
export const BOOST_COST_GEMS = 10;
export const BOOST_SECONDS   = 5 * 60;
export const OFFLINE_CAP_SECONDS = 8 * 3600;
export const OFFLINE_MIN_SECONDS = 60;

// ─── movement ────────────────────────────────────────────────────────────────
export const GHOST_SPEED  = 2.6;
export const ZOMBIE_SPEED = 1.8;
export const MAX_QUEUE    = 4;

// ─── night clock: 1 real second = 1 in-game minute, night = 20:00 → 06:00 ────
export const NIGHT_START_MIN  = 20 * 60;
export const NIGHT_LENGTH_MIN = 10 * 60;

// ─── floor plan ──────────────────────────────────────────────────────────────
/** Guest rooms: `center` is where the coffin bed stands, `door` the corridor entry. */
export const ROOMS = [
  { center: [2, 1.5],   door: [2, 3.9],   rot: 0 },
  { center: [5, 1.5],   door: [5, 3.9],   rot: 0 },
  { center: [8, 1.5],   door: [8, 3.9],   rot: 0 },
  { center: [11, 1.5],  door: [11, 3.9],  rot: 0 },
  { center: [1.6, 5.2], door: [3.9, 5.2], rot: Math.PI / 2 },
  { center: [1.6, 8.2], door: [3.9, 8.2], rot: Math.PI / 2 },
];

export const P = {
  spawn:       [12.6, 18],
  door:        [12.6, 12.2],
  queue:       [[11, 9.8], [11.6, 10.7], [12.2, 11.5], [12.6, 12.6]],
  afterDesk:   [11.6, 8.2],
  corridorE:   [11.6, 3.9],
  corridorW:   [3.9, 3.9],
  barApproach: [9.8, 6.4],
  stools:      [[8.6, 6.2], [7.4, 6.2], [6.2, 6.2], [5, 6.2]],
  exit:        [12.6, 19],
  skelett:     [9.2, 9.6],
  hexe:        [6.8, 4.5],
  zombieIdle:  [13.2, 5.2],
  desk:        [10, 9.6],
};

/**
 * game/config.js
 * Generic balancing formulas and the shared floor plan (world units, y = up).
 * Every hotel uses the same floor plan; hotels differ in look, guests and a
 * price multiplier `pm` (see game/hotels.js).
 * The floor spans x 0..14 and z 0..12; the camera looks from +x/+z, so the
 * walls at x = 0 and z = 0 are the "back" walls.
 */

// ─── hotel rating ────────────────────────────────────────────────────────────
/** Lifetime earnings (per hotel, before `pm`) needed for 1..5 stars. */
export const STAR_THRESHOLDS = [300, 2500, 15000, 90000, 600000];
export const GEMS_PER_STAR = 15;

export const starsFor = (earned, pm = 1) =>
  STAR_THRESHOLDS.filter(t => earned >= t * pm).length;

/** 0..1 progress towards the next star (1 when maxed). */
export function starProgress(earned, pm = 1) {
  const stars = starsFor(earned, pm);
  if (stars >= STAR_THRESHOLDS.length) return 1;
  const from = stars === 0 ? 0 : STAR_THRESHOLDS[stars - 1] * pm;
  return (earned - from) / (STAR_THRESHOLDS[stars] * pm - from);
}

// ─── rooms ───────────────────────────────────────────────────────────────────
export const ROOM_MAX_LEVEL = 10;
export const ROOM_UNLOCK_COST = [0, 60, 400, 2500, 15000, 90000];
export const roomPrice       = (level, pm = 1) => Math.round(10 * pm * Math.pow(1.45, level - 1));
export const roomUpgradeCost = (index, level, pm = 1) =>
  Math.round(30 * pm * Math.pow(1.75, level) * (1 + index * 0.8));
export const roomUnlockCost  = (index, pm = 1) => Math.round(ROOM_UNLOCK_COST[index] * pm);
export const STAY_SECONDS = 9;

// ─── bar ─────────────────────────────────────────────────────────────────────
export const BAR_UNLOCK_COST = 250;
export const BAR_MAX_LEVEL = 10;
export const drinkPrice     = (level, pm = 1) => Math.round(5 * pm * Math.pow(1.5, level - 1));
export const barStools      = (level) => Math.min(4, 2 + Math.floor((level - 1) / 3));
export const barUpgradeCost = (level, pm = 1) =>
  Math.round(pm * (level === 0 ? BAR_UNLOCK_COST : 120 * Math.pow(1.8, level)));
export const DRINK_SECONDS = 3.5;
export const BAR_VISIT_CHANCE = 0.65;

// ─── reception ───────────────────────────────────────────────────────────────
export const RECEPTION_MAX_LEVEL = 10;
export const spawnInterval        = (level) => Math.max(2.2, 7 - 0.5 * (level - 1));
export const autoCheckinSeconds   = (level) => 1.6 / (1 + 0.15 * (level - 1));
export const receptionUpgradeCost = (level, pm = 1) => Math.round(80 * pm * Math.pow(1.9, level));

// ─── staff: hire once, then level up (speed) ─────────────────────────────────
export const STAFF_ROLES = ['reception', 'cleaner', 'bar'];
export const STAFF_HIRE_COST = { reception: 150, cleaner: 500, bar: 1200 };
export const STAFF_MAX_LEVEL = 5;
export const staffUpgradeCost = (role, level, pm = 1) =>
  Math.round(STAFF_HIRE_COST[role] * pm * 2.2 * Math.pow(2.4, level - 1));
/** Speed factor of a staff member (1 at level 1). */
export const staffSpeed = (level) => 1 + 0.3 * (Math.max(1, level) - 1);
export const CLEAN_SECONDS_TAP    = 0.4;
export const CLEAN_SECONDS_STAFF  = 2;
export const SERVE_SECONDS_STAFF  = 1.2;

// ─── attractions (3 per hotel, 3 levels each) ────────────────────────────────
export const ATTRACTION_MAX_LEVEL = 3;
export const attractionCost = (slot, level, pm = 1) =>
  Math.round(pm * [600, 1500, 4000][slot] * Math.pow(4, level));
/** Effect strength per level for each effect kind. */
export const ATTRACTION_EFFECT = {
  rooms: 0.25,   // +25 % room income per level
  bar:   0.3,    // +30 % drink income per level
  spawn: 0.12,   // −12 % time between guests per level
  tips:  0.08,   // +8 %-points tip chance per level
};

// ─── tips ────────────────────────────────────────────────────────────────────
export const TIP_CHANCE = 0.12;
export const TIP_MULT = 3;
export const TIP_SECONDS = 4.5;

// ─── boost, gems & offline ───────────────────────────────────────────────────
export const BOOST_COST_GEMS = 10;
export const BOOST_SECONDS   = 5 * 60;
export const INSTANT_COST_GEMS = 20;
export const INSTANT_SECONDS   = 3600;
export const OFFLINE_CAP_SECONDS = 8 * 3600;
export const OFFLINE_MIN_SECONDS = 60;
/** Hotels you are not looking at earn this share of their estimate. */
export const PASSIVE_SHARE = 0.5;

// ─── movement ────────────────────────────────────────────────────────────────
export const GHOST_SPEED  = 2.6;
export const ZOMBIE_SPEED = 1.8;
export const MAX_QUEUE    = 4;

// ─── night clock: 1 real second = 1 in-game minute, night = 20:00 → 06:00 ────
export const NIGHT_START_MIN  = 20 * 60;
export const NIGHT_LENGTH_MIN = 10 * 60;

// ─── floor plan ──────────────────────────────────────────────────────────────
/** Guest rooms: `center` is where the bed stands, `door` the corridor entry. */
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
  stools:      [[8.6, 6.2], [7.4, 6.2], [6.2, 6.2], [5, 6.2]],
  exit:        [12.6, 19],
  reception:   [9.2, 9.6],
  bar:         [6.8, 4.5],
  cleanerIdle: [2.9, 10.2],
};

/** Garden spots where the three attractions of a hotel appear. */
export const ATTRACTION_SPOTS = [[16.2, 9.5], [3.2, 15.4], [8.4, 16.2]];

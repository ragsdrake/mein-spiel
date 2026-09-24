/**
 * game/store.js
 * Persistent hotel economy (coins, gems, upgrades, staff) — Zustand + AsyncStorage.
 * The moving guests live in game/sim.js and only report earnings back here.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  BAR_MAX_LEVEL, BAR_UNLOCK_COST, BOOST_COST_GEMS, BOOST_SECONDS, GEMS_PER_STAR, GUEST_TYPES,
  OFFLINE_CAP_SECONDS, OFFLINE_MIN_SECONDS, RECEPTION_MAX_LEVEL, ROOMS, ROOM_MAX_LEVEL,
  ROOM_UNLOCK_COST, STAFF, STAY_SECONDS, barUpgradeCost, drinkPrice, receptionUpgradeCost,
  roomPrice, roomUpgradeCost, starsFor,
} from './config';

const initialState = () => ({
  coins:        80,
  gems:         20,
  totalEarned:  0,
  nightEarned:  0,
  rooms:        ROOMS.map((_, i) => (i === 0 ? 1 : 0)),   // 0 = locked, else level
  barLevel:     0,                                         // 0 = locked
  receptionLevel: 1,
  staff:        { skelett: false, zombie: false, hexe: false },
  boostUntil:   0,
  lastSeen:     0,
  seenTutorial: false,
});

/** Adds coins to wallet + lifetime total and hands out star rewards. */
function creditCoins(s, gain) {
  const before = starsFor(s.totalEarned);
  const totalEarned = s.totalEarned + gain;
  const after = starsFor(totalEarned);
  return {
    coins:  s.coins + gain,
    totalEarned,
    gems:   s.gems + (after - before) * GEMS_PER_STAR,
    starUp: after > before ? { stars: after, at: Date.now() } : s.starUp,
  };
}

const useHotel = create(persist((set, get) => ({
  ...initialState(),

  /** Pending offline reward (not persisted) — shown in a modal on launch. */
  offline: null,
  /** Last star-up (not persisted) — drives a celebration toast. */
  starUp: null,

  // ── derived ──────────────────────────────────────────────────────────────
  isBoosted() {
    return get().boostUntil > Date.now();
  },

  /** Rough income per second while the hotel runs on its own. */
  estimatedIncomePerSecond() {
    const { rooms, barLevel, staff, totalEarned } = get();
    const stars = starsFor(totalEarned);
    const types = GUEST_TYPES.filter(t => t.star <= stars);
    const avgMult = types.reduce((s, t) => s + t.mult, 0) / types.length;
    const cycle = STAY_SECONDS + 7;
    let perSec = rooms.reduce((s, lvl) => s + (lvl > 0 ? roomPrice(lvl) * avgMult / cycle : 0), 0);
    if (barLevel > 0) perSec += drinkPrice(barLevel) * avgMult * 0.5 / cycle * rooms.filter(Boolean).length;
    if (!staff.skelett) perSec *= 0.3;
    if (!staff.zombie)  perSec *= 0.5;
    return perSec;
  },

  // ── earnings ─────────────────────────────────────────────────────────────
  earn(amount) {
    const mult = get().isBoosted() ? 2 : 1;
    const gain = Math.round(amount * mult);
    set(s => ({ ...creditCoins(s, gain), nightEarned: s.nightEarned + gain }));
    return gain;
  },

  spend(cost) {
    if (get().coins < cost) return false;
    set(s => ({ coins: s.coins - cost }));
    return true;
  },

  resetNight() {
    set({ nightEarned: 0 });
  },

  // ── purchases ────────────────────────────────────────────────────────────
  unlockRoom(i) {
    const { rooms } = get();
    if (rooms[i] > 0 || (i > 0 && rooms[i - 1] === 0)) return false;
    if (!get().spend(ROOM_UNLOCK_COST[i])) return false;
    set(s => ({ rooms: s.rooms.map((l, j) => (j === i ? 1 : l)) }));
    return true;
  },

  upgradeRoom(i) {
    const lvl = get().rooms[i];
    if (lvl === 0 || lvl >= ROOM_MAX_LEVEL) return false;
    if (!get().spend(roomUpgradeCost(i, lvl))) return false;
    set(s => ({ rooms: s.rooms.map((l, j) => (j === i ? l + 1 : l)) }));
    return true;
  },

  upgradeBar() {
    const lvl = get().barLevel;
    if (lvl >= BAR_MAX_LEVEL) return false;
    const cost = lvl === 0 ? BAR_UNLOCK_COST : barUpgradeCost(lvl);
    if (!get().spend(cost)) return false;
    set({ barLevel: lvl + 1 });
    return true;
  },

  upgradeReception() {
    const lvl = get().receptionLevel;
    if (lvl >= RECEPTION_MAX_LEVEL) return false;
    if (!get().spend(receptionUpgradeCost(lvl))) return false;
    set({ receptionLevel: lvl + 1 });
    return true;
  },

  hire(id) {
    const def = STAFF.find(s => s.id === id);
    if (!def || get().staff[id]) return false;
    if (def.needsBar && get().barLevel === 0) return false;
    if (!get().spend(def.cost)) return false;
    set(s => ({ staff: { ...s.staff, [id]: true } }));
    return true;
  },

  buyBoost() {
    if (get().gems < BOOST_COST_GEMS) return false;
    const base = Math.max(Date.now(), get().boostUntil);
    set(s => ({ gems: s.gems - BOOST_COST_GEMS, boostUntil: base + BOOST_SECONDS * 1000 }));
    return true;
  },

  // ── session bookkeeping ──────────────────────────────────────────────────
  touch() {
    set({ lastSeen: Date.now() });
  },

  /** Called once after hydration / when the app returns to the foreground. */
  computeOffline() {
    const { lastSeen } = get();
    if (!lastSeen) return;
    const away = Math.min(OFFLINE_CAP_SECONDS, (Date.now() - lastSeen) / 1000);
    if (away < OFFLINE_MIN_SECONDS) return;
    const amount = Math.floor(get().estimatedIncomePerSecond() * away * 0.5);
    if (amount > 0) set({ offline: { seconds: away, amount } });
  },

  collectOffline(double) {
    const off = get().offline;
    if (!off) return;
    if (double && get().gems < 5) return;
    const amount = double ? off.amount * 2 : off.amount;
    set(s => {
      const credited = creditCoins(s, amount);
      return { ...credited, offline: null, gems: credited.gems - (double ? 5 : 0) };
    });
  },

  dismissStarUp() {
    set({ starUp: null });
  },

  finishTutorial() {
    set({ seenTutorial: true });
  },

  resetGame() {
    set({ ...initialState(), offline: null, starUp: null, lastSeen: Date.now() });
  },
}), {
  name:    'spukhotel-save-v1',
  storage: createJSONStorage(() => AsyncStorage),
  partialize: ({ offline, starUp, ...rest }) =>
    Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== 'function')),
}));

export default useHotel;

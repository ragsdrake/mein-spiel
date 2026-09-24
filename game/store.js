/**
 * game/store.js
 * Persistent economy for all hotels — Zustand + AsyncStorage.
 * Coins and gems are shared; every hotel keeps its own rooms, staff,
 * attractions and lifetime earnings (which decide its stars).
 * The moving guests live in game/sim.js and only report earnings back here.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  ATTRACTION_EFFECT, ATTRACTION_MAX_LEVEL, BAR_MAX_LEVEL, BOOST_COST_GEMS, BOOST_SECONDS,
  GEMS_PER_STAR, INSTANT_COST_GEMS, INSTANT_SECONDS, OFFLINE_CAP_SECONDS, OFFLINE_MIN_SECONDS,
  PASSIVE_SHARE, RECEPTION_MAX_LEVEL, ROOM_MAX_LEVEL, STAFF_HIRE_COST, STAFF_MAX_LEVEL,
  STAY_SECONDS, TIP_CHANCE, AD_BOOST_SECONDS, AD_BOOST_CAP_SECONDS, attractionCost, barUpgradeCost, drinkPrice, receptionUpgradeCost,
  roomPrice, roomUnlockCost, roomUpgradeCost, staffUpgradeCost, starsFor,
} from './config';
import { HOTELS, getHotel } from './hotels';
import { makeQuest, questDone } from './quests';

const makeHotelState = (id) => ({
  unlocked:       id === 'nachtruh',
  rooms:          getHotel(id).rooms.map((_, i) => (i === 0 ? 1 : 0)),   // 0 = locked, else level
  barLevel:       0,                                         // 0 = locked
  receptionLevel: 1,
  staff:          { reception: 0, cleaner: 0, bar: 0 },      // 0 = not hired, else level
  attractions:    [0, 0, 0],
  totalEarned:    0,
});

const emptyStats = () => ({ checkins: 0, drinks: 0, cleans: 0, tips: 0, upgrades: 0, guests: 0, earned: 0 });

const initialState = () => {
  const stats = emptyStats();
  const quests = [];
  for (let i = 0; i < 3; i++) quests.push(makeQuest(stats, 0, quests.map(q => q.kind)));
  return {
    coins:        80,
    gems:         20,
    nightEarned:  0,
    activeHotel:  'nachtruh',
    hotels:       Object.fromEntries(HOTELS.map(h => [h.id, makeHotelState(h.id)])),
    stats,
    quests,
    questTier:    0,
    boostUntil:   0,
    lastSeen:     0,
    seenTutorial: false,
    settings:     { quality: Platform.OS === 'web' ? 'ultra' : 'medium' },
  };
};

/** Adds coins to the wallet + a hotel's lifetime total and hands out star rewards. */
function creditCoins(s, hotelId, gain) {
  const def = getHotel(hotelId);
  const h = s.hotels[hotelId];
  const before = starsFor(h.totalEarned, def.pm);
  const totalEarned = h.totalEarned + gain;
  const after = starsFor(totalEarned, def.pm);
  return {
    coins:  s.coins + gain,
    hotels: { ...s.hotels, [hotelId]: { ...h, totalEarned } },
    stats:  { ...s.stats, earned: s.stats.earned + gain },
    gems:   s.gems + (after - before) * GEMS_PER_STAR,
    starUp: after > before ? { hotel: hotelId, stars: after, at: Date.now() } : s.starUp,
  };
}

let passiveCarry = 0;

const useHotel = create(persist((set, get) => {
  /** Immutable update of one hotel's state. */
  const patchHotel = (id, fn) => set(s => ({ hotels: { ...s.hotels, [id]: { ...s.hotels[id], ...fn(s.hotels[id]) } } }));
  const countUpgrade = () => set(s => ({ stats: { ...s.stats, upgrades: s.stats.upgrades + 1 } }));

  return {
    ...initialState(),

    /** Pending offline reward (not persisted) — shown in a modal on launch. */
    offline: null,
    /** Last star-up (not persisted) — drives a celebration popup. */
    starUp: null,

    // ── derived ────────────────────────────────────────────────────────────
    activeDef() {
      return getHotel(get().activeHotel);
    },
    active() {
      return get().hotels[get().activeHotel];
    },
    isBoosted() {
      return get().boostUntil > Date.now();
    },
    starsOf(id) {
      return starsFor(get().hotels[id].totalEarned, getHotel(id).pm);
    },
    /** Summed attraction bonus of one effect kind, e.g. 0.5 = +50 %. */
    bonus(effect, id = get().activeHotel) {
      const def = getHotel(id);
      const levels = get().hotels[id].attractions;
      return def.attractions.reduce(
        (sum, a, i) => sum + (a.effect === effect ? levels[i] * ATTRACTION_EFFECT[effect] : 0), 0);
    },
    tipChance() {
      return TIP_CHANCE + get().bonus('tips');
    },

    /** Rough income per second of one hotel while it runs on its own. */
    estimatedIncomePerSecond(id = get().activeHotel) {
      const def = getHotel(id);
      const h = get().hotels[id];
      if (!h.unlocked) return 0;
      const stars = starsFor(h.totalEarned, def.pm);
      const types = def.guests.filter(t => t.star <= stars);
      const avgMult = types.reduce((s, t) => s + t.mult, 0) / types.length;
      const cycle = STAY_SECONDS + 7;
      const roomBonus = 1 + get().bonus('rooms', id);
      let perSec = h.rooms.reduce((s, lvl) => s + (lvl > 0 ? roomPrice(lvl, def.pm) * roomBonus * avgMult / cycle : 0), 0);
      if (h.barLevel > 0) {
        perSec += drinkPrice(h.barLevel, def.pm) * (1 + get().bonus('bar', id)) * avgMult * 0.5 / cycle
          * h.rooms.filter(Boolean).length;
      }
      if (!h.staff.reception) perSec *= 0.3;
      if (!h.staff.cleaner)   perSec *= 0.5;
      return perSec;
    },

    /** What the HUD shows as "+x/s": active hotel + passive share of the others, boost included. */
    totalIncomePerSecond() {
      const { hotels, activeHotel } = get();
      let perSec = get().estimatedIncomePerSecond(activeHotel);
      for (const def of HOTELS) {
        const h = hotels[def.id];
        if (def.id !== activeHotel && h.unlocked && h.staff.reception) {
          perSec += get().estimatedIncomePerSecond(def.id) * PASSIVE_SHARE;
        }
      }
      return perSec * (get().isBoosted() ? 2 : 1);
    },

    // ── earnings ───────────────────────────────────────────────────────────
    earn(amount, hotelId = get().activeHotel) {
      const gain = Math.round(amount * (get().isBoosted() ? 2 : 1));
      set(s => ({ ...creditCoins(s, hotelId, gain), nightEarned: s.nightEarned + gain }));
      return gain;
    },

    stat(kind, n = 1) {
      set(s => ({ stats: { ...s.stats, [kind]: (s.stats[kind] ?? 0) + n } }));
    },

    spend(cost) {
      if (get().coins < cost) return false;
      set(s => ({ coins: s.coins - cost }));
      return true;
    },

    resetNight() {
      set({ nightEarned: 0 });
    },

    /** Hotels you are not looking at keep earning a share (needs a receptionist). */
    passiveTick(dt) {
      const { hotels, activeHotel } = get();
      let perSec = 0;
      for (const def of HOTELS) {
        const h = hotels[def.id];
        if (def.id === activeHotel || !h.unlocked || !h.staff.reception) continue;
        perSec += get().estimatedIncomePerSecond(def.id) * PASSIVE_SHARE;
      }
      passiveCarry += perSec * dt;
      if (passiveCarry >= 1) {
        const whole = Math.floor(passiveCarry);
        passiveCarry -= whole;
        set(s => ({ coins: s.coins + whole, stats: { ...s.stats, earned: s.stats.earned + whole } }));
      }
    },

    // ── purchases (always on the active hotel) ─────────────────────────────
    unlockRoom(i) {
      const id = get().activeHotel;
      const { rooms } = get().hotels[id];
      if (rooms[i] > 0 || (i > 0 && rooms[i - 1] === 0)) return false;
      if (!get().spend(roomUnlockCost(i, getHotel(id).pm))) return false;
      patchHotel(id, h => ({ rooms: h.rooms.map((l, j) => (j === i ? 1 : l)) }));
      countUpgrade();
      return true;
    },

    upgradeRoom(i) {
      const id = get().activeHotel;
      const lvl = get().hotels[id].rooms[i];
      if (lvl === 0 || lvl >= ROOM_MAX_LEVEL) return false;
      if (!get().spend(roomUpgradeCost(i, lvl, getHotel(id).pm))) return false;
      patchHotel(id, h => ({ rooms: h.rooms.map((l, j) => (j === i ? l + 1 : l)) }));
      countUpgrade();
      return true;
    },

    upgradeBar() {
      const id = get().activeHotel;
      const lvl = get().hotels[id].barLevel;
      if (lvl >= BAR_MAX_LEVEL) return false;
      if (!get().spend(barUpgradeCost(lvl, getHotel(id).pm))) return false;
      patchHotel(id, () => ({ barLevel: lvl + 1 }));
      countUpgrade();
      return true;
    },

    upgradeReception() {
      const id = get().activeHotel;
      const lvl = get().hotels[id].receptionLevel;
      if (lvl >= RECEPTION_MAX_LEVEL) return false;
      if (!get().spend(receptionUpgradeCost(lvl, getHotel(id).pm))) return false;
      patchHotel(id, () => ({ receptionLevel: lvl + 1 }));
      countUpgrade();
      return true;
    },

    /** Hire (level 0 → 1) or train (level n → n+1) a staff member. */
    upgradeStaff(role) {
      const id = get().activeHotel;
      const h = get().hotels[id];
      const lvl = h.staff[role];
      if (lvl >= STAFF_MAX_LEVEL) return false;
      if (role === 'bar' && h.barLevel === 0) return false;
      const pm = getHotel(id).pm;
      const cost = lvl === 0 ? STAFF_HIRE_COST[role] * pm : staffUpgradeCost(role, lvl, pm);
      if (!get().spend(cost)) return false;
      patchHotel(id, x => ({ staff: { ...x.staff, [role]: lvl + 1 } }));
      countUpgrade();
      return true;
    },

    buyAttraction(slot) {
      const id = get().activeHotel;
      const lvl = get().hotels[id].attractions[slot];
      if (lvl >= ATTRACTION_MAX_LEVEL) return false;
      if (!get().spend(attractionCost(slot, lvl, getHotel(id).pm))) return false;
      patchHotel(id, h => ({ attractions: h.attractions.map((l, j) => (j === slot ? l + 1 : l)) }));
      countUpgrade();
      return true;
    },

    // ── hotels ─────────────────────────────────────────────────────────────
    canUnlockHotel(id) {
      const def = getHotel(id);
      if (!def.unlock || get().hotels[id].unlocked) return false;
      return get().starsOf(def.unlock.hotel) >= def.unlock.stars && get().coins >= def.unlock.coins;
    },

    unlockHotel(id) {
      if (!get().canUnlockHotel(id)) return false;
      get().spend(getHotel(id).unlock.coins);
      patchHotel(id, () => ({ unlocked: true }));
      return true;
    },

    switchHotel(id) {
      if (!get().hotels[id]?.unlocked || id === get().activeHotel) return false;
      set({ activeHotel: id });
      return true;
    },

    // ── gems ───────────────────────────────────────────────────────────────
    buyBoost() {
      if (get().gems < BOOST_COST_GEMS) return false;
      const base = Math.max(Date.now(), get().boostUntil);
      set(s => ({ gems: s.gems - BOOST_COST_GEMS, boostUntil: base + BOOST_SECONDS * 1000 }));
      return true;
    },

    /** Rewarded ad: +4 min of ×2 income, stackable up to 4 h (Codigames-style). */
    adBoost() {
      const now = Date.now();
      const until = Math.min(now + AD_BOOST_CAP_SECONDS * 1000, Math.max(now, get().boostUntil) + AD_BOOST_SECONDS * 1000);
      set({ boostUntil: until });
    },

    /** Rewarded ad in the shop: 10 minutes of income right away (at least 100 × pm). */
    adChest() {
      const pm = getHotel(get().activeHotel).pm;
      const amount = Math.max(100 * pm, Math.floor(get().instantIncome() / 6));
      set(s => ({ coins: s.coins + amount }));
      return amount;
    },

    /** Rewarded ad on the offline popup: collect twice the amount. */
    collectOfflineAd() {
      const off = get().offline;
      if (!off) return;
      set(s => {
        let next = { ...s, offline: null };
        for (const [id, a] of off.perHotel) {
          if (a > 0) next = { ...next, ...creditCoins(next, id, a * 2) };
        }
        return next;
      });
    },

    /** One hour of (estimated) income of all hotels, paid out right now. */
    instantIncome() {
      return Math.floor(HOTELS.reduce((s, h) => s + get().estimatedIncomePerSecond(h.id), 0) * INSTANT_SECONDS);
    },

    buyInstant() {
      if (get().gems < INSTANT_COST_GEMS) return false;
      const amount = get().instantIncome();
      set(s => ({ gems: s.gems - INSTANT_COST_GEMS, coins: s.coins + amount }));
      return true;
    },

    // ── quests ─────────────────────────────────────────────────────────────
    claimQuest(uid) {
      const { quests, stats, questTier } = get();
      const q = quests.find(x => x.uid === uid);
      if (!q || !questDone(q, stats)) return false;
      const others = quests.filter(x => x.uid !== uid);
      const next = makeQuest(stats, questTier + 1, others.map(x => x.kind));
      set(s => ({
        gems:      s.gems + q.reward,
        questTier: s.questTier + 1,
        quests:    s.quests.map(x => (x.uid === uid ? next : x)),
      }));
      return true;
    },

    // ── settings & session ─────────────────────────────────────────────────
    setQuality(quality) {
      set(s => ({ settings: { ...s.settings, quality } }));
    },

    touch() {
      set({ lastSeen: Date.now() });
    },

    /** Called once after hydration / when the app returns to the foreground. */
    computeOffline() {
      const { lastSeen } = get();
      if (!lastSeen) return;
      const away = Math.min(OFFLINE_CAP_SECONDS, (Date.now() - lastSeen) / 1000);
      if (away < OFFLINE_MIN_SECONDS) return;
      const perHotel = HOTELS.map(h => [h.id, Math.floor(get().estimatedIncomePerSecond(h.id) * away * 0.5)]);
      const amount = perHotel.reduce((s, [, a]) => s + a, 0);
      if (amount > 0) set({ offline: { seconds: away, amount, perHotel } });
    },

    collectOffline(double) {
      const off = get().offline;
      if (!off) return;
      if (double && get().gems < 5) return;
      const factor = double ? 2 : 1;
      set(s => {
        let next = { ...s, offline: null };
        for (const [id, a] of off.perHotel) {
          if (a > 0) next = { ...next, ...creditCoins(next, id, a * factor) };
        }
        return { ...next, gems: next.gems - (double ? 5 : 0) };
      });
    },

    dismissStarUp() {
      set({ starUp: null });
    },

    finishTutorial() {
      set({ seenTutorial: true });
    },

    resetGame() {
      set({ ...initialState(), settings: get().settings, offline: null, starUp: null, lastSeen: Date.now() });
    },
  };
}, {
  name:    'spukhotel-save-v1',
  version: 2,
  storage: createJSONStorage(() => AsyncStorage),
  partialize: ({ offline, starUp, ...rest }) =>
    Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== 'function')),
  /** v0 (single hotel) → v2: move the old hotel into hotels.nachtruh. */
  migrate: (old, version) => {
    if (version >= 2 || !old) return old;
    const base = initialState();
    const staff = old.staff ?? {};
    return {
      ...base,
      coins:        old.coins ?? base.coins,
      gems:         old.gems ?? base.gems,
      nightEarned:  old.nightEarned ?? 0,
      boostUntil:   old.boostUntil ?? 0,
      lastSeen:     old.lastSeen ?? 0,
      seenTutorial: old.seenTutorial ?? false,
      hotels: {
        ...base.hotels,
        nachtruh: {
          ...base.hotels.nachtruh,
          rooms:          old.rooms ?? base.hotels.nachtruh.rooms,
          barLevel:       old.barLevel ?? 0,
          receptionLevel: old.receptionLevel ?? 1,
          staff:          { reception: staff.skelett ? 1 : 0, cleaner: staff.zombie ? 1 : 0, bar: staff.hexe ? 1 : 0 },
          totalEarned:    old.totalEarned ?? 0,
        },
      },
    };
  },
  /** Hotels or stats added later must appear in older saves too. */
  merge: (persisted, current) => {
    const merged = { ...current, ...persisted };
    merged.hotels = Object.fromEntries(HOTELS.map(h => {
      const hs = { ...makeHotelState(h.id), ...(persisted?.hotels?.[h.id] ?? {}) };
      // hotels that grew a wing get their new (locked) rooms appended
      hs.rooms = h.rooms.map((_, i) => hs.rooms[i] ?? 0);
      return [h.id, hs];
    }));
    merged.stats = { ...emptyStats(), ...(persisted?.stats ?? {}) };
    merged.settings = { ...current.settings, ...(persisted?.settings ?? {}) };
    return merged;
  },
}));

export default useHotel;

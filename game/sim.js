/**
 * game/sim.js
 * Real-time simulation of the hotel you are looking at: guests arrive, check
 * in, sleep, maybe visit the bar, pay (sometimes with a tip) and leave.
 * Staff automate the tap-jobs; other hotels earn passively via the store.
 *
 * Positions change every frame, so they live in plain mutable objects that the
 * 3D scene reads inside useFrame. Only structural changes (a guest appears or
 * leaves, a room gets dirty…) are pushed to the small `useSim` store so React
 * re-renders just when something is added or removed.
 */

import { create } from 'zustand';
import {
  BAR_VISIT_CHANCE, CLEAN_SECONDS_STAFF, CLEAN_SECONDS_TAP, DRINK_SECONDS, GHOST_SPEED,
  MAX_QUEUE, NIGHT_LENGTH_MIN, WING, NIGHT_START_MIN, P, ROOMS, SERVE_SECONDS_STAFF, STAY_SECONDS,
  TIP_MULT, TIP_SECONDS, ZOMBIE_SPEED, autoCheckinSeconds, barStools, drinkPrice, roomPrice,
  spawnInterval, staffSpeed, starsFor,
} from './config';
import { getGuestDef, getHotel } from './hotels';
import useHotel from './store';

export const useSim = create(() => ({
  guestIds:   [],
  fxIds:      [],
  dirty:      ROOMS.map(() => false),
  occupied:   ROOMS.map(() => false),
  minute:     NIGHT_START_MIN,
  lastGain:   null,
  nightSummary: null,
}));

const freshCleaner = () => ({ pos: [...P.cleanerIdle], path: [], task: null, timer: 0, facing: 0, working: false });

export const sim = {
  hotelId:    null,
  guests:     new Map(),
  fx:         new Map(),
  queue:      [],
  roomOcc:    ROOMS.map(() => null),
  roomDirty:  ROOMS.map(() => false),
  roomClean:  ROOMS.map(() => 0),     // tap-clean countdown
  stools:     P.stools.map(() => null),
  cleaner:    freshCleaner(),
  barkeeper:  { serving: null },
  spawnTimer: 1.5,
  clock:      0,
  nextId:     1,
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function syncLists() {
  useSim.setState({
    guestIds: [...sim.guests.keys()],
    fxIds:    [...sim.fx.keys()],
  });
}

function syncRooms() {
  useSim.setState({
    dirty:    [...sim.roomDirty],
    occupied: sim.roomOcc.map(Boolean),
  });
}

/** Clear everything when the player switches to another hotel. */
function resetFor(hotelId) {
  sim.hotelId = hotelId;
  sim.guests.clear();
  sim.fx.clear();
  sim.queue = [];
  sim.roomOcc = ROOMS.map(() => null);
  sim.roomDirty = ROOMS.map(() => false);
  sim.roomClean = ROOMS.map(() => 0);
  sim.stools = P.stools.map(() => null);
  sim.cleaner = freshCleaner();
  sim.barkeeper = { serving: null };
  sim.spawnTimer = 1;
  syncLists();
  syncRooms();
}

/** Move `e.pos` along `e.path`; returns true once the path is used up. */
function walk(e, dt, speed) {
  let budget = speed * dt;
  while (budget > 0 && e.path.length) {
    const [tx, tz] = e.path[0];
    const dx = tx - e.pos[0];
    const dz = tz - e.pos[1];
    const d = Math.hypot(dx, dz);
    if (d > 1e-3) e.facing = Math.atan2(dx, dz);
    if (d <= budget) {
      e.pos[0] = tx; e.pos[1] = tz;
      e.path.shift();
      budget -= d;
    } else {
      e.pos[0] += (dx / d) * budget;
      e.pos[1] += (dz / d) * budget;
      budget = 0;
    }
  }
  return e.path.length === 0;
}

function pickGuestType(def, hs) {
  const stars = starsFor(hs.totalEarned, def.pm);
  const pool = def.guests.filter(t => t.star <= stars);
  const total = pool.reduce((s, _, i) => s + i + 1, 0);
  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= i + 1;
    if (r <= 0) return pool[i].id;
  }
  return pool[pool.length - 1].id;
}

function addFx(pos, amount, kind = 'coin') {
  const id = sim.nextId++;
  sim.fx.set(id, { id, pos: [pos[0], pos[1]], t: 0, amount, kind });
  useSim.setState({ lastGain: { amount, at: Date.now(), id } });
}

/** Pay out, maybe with a tip bubble the player can tap for extra coins. */
function pay(g, amount, def) {
  const store = useHotel.getState();
  const base = amount * getGuestDef(def, g.type).mult;
  const gain = store.earn(base);
  addFx(g.pos, gain);
  if (!g.tip && Math.random() < store.tipChance()) {
    g.tip = { amount: base * TIP_MULT, timer: TIP_SECONDS };
  }
}

// ─── paths ───────────────────────────────────────────────────────────────────
/** Waypoints between the main corridor (z = 3.9) and a room's door. */
const hallTo = (r) => {
  const room = ROOMS[r];
  if (room.side === 'left') return [P.corridorW];
  if (room.side === 'right') return [[WING.hallX, 3.9]];
  return [];
};

const pathDeskToRoom = (r) => {
  const room = ROOMS[r];
  return [P.afterDesk, P.corridorE, ...hallTo(r), room.door, room.entry, room.bed];
};

const pathRoomToExit = (r) => {
  const room = ROOMS[r];
  return [room.entry, room.door, ...hallTo(r), [13.4, 3.9], [13.4, 12.2], P.exit];
};

const pathRoomToStool = (r, s) => {
  const room = ROOMS[r];
  const stool = P.stools[s];
  const via = room.side === 'left'
    ? [[4.3, room.door[1]], [4.3, 6.9]]
    : [...hallTo(r), [10.2, 3.9], [10.2, 6.9]];
  return [room.entry, room.door, ...via, [stool[0], 6.9], stool];
};

const pathStoolToExit = (s) => [[P.stools[s][0], 6.9], [13.4, 6.9], [13.4, 12.2], P.exit];

function queueSlot(i) {
  return P.queue[Math.min(i, P.queue.length - 1)];
}

function refreshQueue() {
  sim.queue.forEach((id, i) => {
    const g = sim.guests.get(id);
    if (!g) return;
    const slot = queueSlot(i);
    g.path = g.inside ? [slot] : [P.door, slot];
  });
}

// ─── guest lifecycle ─────────────────────────────────────────────────────────
function trySpawn(def, hs) {
  if (sim.queue.length >= MAX_QUEUE) return;
  const room = hs.rooms.findIndex((lvl, i) => lvl > 0 && !sim.roomOcc[i] && !sim.roomDirty[i]);
  if (room < 0) return;

  const id = sim.nextId++;
  const g = {
    id,
    type:    pickGuestType(def, hs),
    pos:     [...P.spawn],
    path:    [],
    facing:  Math.PI,
    state:   'queue',
    timer:   0,
    room,
    stool:   null,
    bubble:  null,
    tip:     null,
    inside:  false,
    alpha:   0,
    phase:   Math.random() * Math.PI * 2,
  };
  sim.roomOcc[room] = id;
  sim.guests.set(id, g);
  sim.queue.push(id);
  refreshQueue();
  syncLists();
  syncRooms();
}

function leaveHotel(g, path) {
  g.state = 'leave';
  g.bubble = null;
  g.path = path;
  useHotel.getState().stat('guests');
}

function finishCheckin(g) {
  sim.queue.shift();
  refreshQueue();
  g.state = 'toRoom';
  g.path = pathDeskToRoom(g.room);
  useHotel.getState().stat('checkins');
}

function updateGuest(g, dt, def, hs) {
  // pop in after spawning, shrink away on the way out through the garden
  const target = g.state === 'leave' && g.pos[1] > 19.5 ? 0 : 1;
  g.alpha += Math.sign(target - g.alpha) * Math.min(Math.abs(target - g.alpha), dt * 2.5);

  if (g.tip) {
    g.tip.timer -= dt;
    if (g.tip.timer <= 0) g.tip = null;
  }

  switch (g.state) {
    case 'queue': {
      const arrived = walk(g, dt, GHOST_SPEED);
      if (g.pos[1] < 12.3) g.inside = true;
      if (arrived && sim.queue[0] === g.id) {
        g.state = 'desk';
        g.timer = autoCheckinSeconds(hs.receptionLevel) / staffSpeed(hs.staff.reception);
        g.bubble = hs.staff.reception ? null : 'checkin';
      }
      break;
    }
    case 'desk': {
      if (g.bubble === 'checkin' && !hs.staff.reception) break;   // waits for a tap
      g.bubble = null;
      g.timer -= dt;
      if (g.timer <= 0) finishCheckin(g);
      break;
    }
    case 'toRoom':
      if (walk(g, dt, GHOST_SPEED)) {
        g.state = 'sleep';
        g.timer = STAY_SECONDS;
        g.bubble = 'zzz';
        g.facing = ROOMS[g.room].bedFacing;
      }
      break;
    case 'sleep': {
      g.timer -= dt;
      if (g.timer > 0) break;
      const store = useHotel.getState();
      pay(g, roomPrice(hs.rooms[g.room] || 1, def.pm) * (1 + store.bonus('rooms')), def);
      const r = g.room;
      sim.roomOcc[r] = null;
      sim.roomDirty[r] = true;
      syncRooms();

      const stools = hs.barLevel > 0 ? barStools(hs.barLevel) : 0;
      const free = sim.stools.findIndex((o, i) => i < stools && !o);
      if (free >= 0 && Math.random() < BAR_VISIT_CHANCE) {
        sim.stools[free] = g.id;
        g.stool = free;
        g.state = 'toBar';
        g.bubble = null;
        g.path = pathRoomToStool(r, free);
      } else {
        leaveHotel(g, pathRoomToExit(r));
      }
      break;
    }
    case 'toBar':
      if (walk(g, dt, GHOST_SPEED)) {
        g.state = 'waitDrink';
        g.facing = Math.PI;
        g.bubble = 'drink';
      }
      break;
    case 'waitDrink':
      // either the barkeeper serves (updateBarkeeper) or the player taps
      break;
    case 'serve':
      g.timer -= dt;
      if (g.timer <= 0) {
        g.state = 'drink';
        g.timer = DRINK_SECONDS;
        g.bubble = null;
      }
      break;
    case 'drink':
      g.timer -= dt;
      if (g.timer <= 0) {
        const store = useHotel.getState();
        pay(g, drinkPrice(hs.barLevel, def.pm) * (1 + store.bonus('bar')), def);
        store.stat('drinks');
        sim.stools[g.stool] = null;
        leaveHotel(g, pathStoolToExit(g.stool));
      }
      break;
    case 'leave':
      if (walk(g, dt, GHOST_SPEED) || g.alpha <= 0) {
        sim.guests.delete(g.id);
        syncLists();
      }
      break;
    default:
      break;
  }
}

// ─── staff ───────────────────────────────────────────────────────────────────
function updateBarkeeper(hs) {
  if (!hs.staff.bar) return;
  const b = sim.barkeeper;
  if (b.serving == null) {
    const next = [...sim.guests.values()].find(g => g.state === 'waitDrink');
    if (next) {
      b.serving = next.id;
      next.state = 'serve';
      next.timer = SERVE_SECONDS_STAFF / staffSpeed(hs.staff.bar);
      next.bubble = null;
    }
  } else if (!sim.guests.has(b.serving) || sim.guests.get(b.serving).state !== 'serve') {
    b.serving = null;
  }
}

function cleanerPathTo(r) {
  const room = ROOMS[r];
  const via = room.side === 'left' ? [[4.4, room.door[1]]] : [[4.4, 3.9], ...hallTo(r)];
  return [[4.4, P.cleanerIdle[1]], ...via, room.door, room.entry, room.clean];
}

function finishClean(r) {
  sim.roomDirty[r] = false;
  syncRooms();
  useHotel.getState().stat('cleans');
}

function updateCleaner(dt, hs) {
  if (!hs.staff.cleaner) return;
  const c = sim.cleaner;
  const speed = ZOMBIE_SPEED * staffSpeed(hs.staff.cleaner);
  if (c.task == null) {
    const r = sim.roomDirty.findIndex((d, i) => d && sim.roomClean[i] <= 0);
    if (r >= 0) {
      c.task = r;
      c.working = false;
      c.path = cleanerPathTo(r);
    } else if (c.path.length) {
      walk(c, dt, speed);
    }
    return;
  }
  if (!sim.roomDirty[c.task]) {            // player was faster
    c.task = null;
    c.path = [[4.4, P.cleanerIdle[1]], P.cleanerIdle];
    return;
  }
  if (!c.working) {
    if (walk(c, dt, speed)) {
      c.working = true;
      c.timer = CLEAN_SECONDS_STAFF / staffSpeed(hs.staff.cleaner);
    }
    return;
  }
  c.timer -= dt;
  if (c.timer <= 0) {
    finishClean(c.task);
    const room = ROOMS[c.task];
    const back = room.side === 'left'
      ? [room.entry, room.door, [4.4, room.door[1]]]
      : [room.entry, room.door, ...hallTo(c.task).reverse(), [4.4, 3.9]];
    c.task = null;
    c.working = false;
    c.path = [...back, [4.4, P.cleanerIdle[1]], P.cleanerIdle];
  }
}

// ─── public API ──────────────────────────────────────────────────────────────
export function step(rawDt) {
  // slow devices get several small steps instead of a slower game
  let left = Math.min(rawDt, 0.5);
  while (left > 1e-4) {
    const dt = Math.min(left, 0.1);
    left -= dt;
    stepOnce(dt);
  }
}

function stepOnce(dt) {
  const store = useHotel.getState();
  if (sim.hotelId !== store.activeHotel) resetFor(store.activeHotel);
  const def = getHotel(store.activeHotel);
  const hs = store.hotels[store.activeHotel];

  // night clock
  sim.clock += dt;
  const minute = NIGHT_START_MIN + Math.floor(sim.clock) % NIGHT_LENGTH_MIN;
  if (minute !== useSim.getState().minute) {
    if (minute === NIGHT_START_MIN && sim.clock > 1) {
      useSim.setState({ nightSummary: { amount: store.nightEarned, at: Date.now() } });
      store.resetNight();
    }
    useSim.setState({ minute });
  }

  store.passiveTick(dt);

  sim.spawnTimer -= dt;
  if (sim.spawnTimer <= 0) {
    sim.spawnTimer = spawnInterval(hs.receptionLevel) * (1 - Math.min(0.5, store.bonus('spawn')));
    trySpawn(def, hs);
  }

  for (const g of [...sim.guests.values()]) updateGuest(g, dt, def, hs);
  updateBarkeeper(hs);
  updateCleaner(dt, hs);

  for (let r = 0; r < sim.roomClean.length; r++) {
    if (sim.roomClean[r] > 0) {
      sim.roomClean[r] -= dt;
      if (sim.roomClean[r] <= 0) finishClean(r);
    }
  }

  let fxChanged = false;
  for (const f of sim.fx.values()) {
    f.t += dt;
    if (f.t > 1.2) { sim.fx.delete(f.id); fxChanged = true; }
  }
  if (fxChanged) syncLists();
}

/** Player taps a guest: collect a tip first, else handle its speech bubble. */
export function tapGuest(id) {
  const g = sim.guests.get(id);
  if (!g) return false;
  if (g.tip) {
    const store = useHotel.getState();
    const gain = store.earn(g.tip.amount);
    store.stat('tips');
    addFx(g.pos, gain, 'tip');
    g.tip = null;
    return true;
  }
  if (g.state === 'desk' && g.bubble === 'checkin') {
    g.bubble = null;
    g.timer = 0.35;
    return true;
  }
  if (g.state === 'waitDrink') {
    g.state = 'serve';
    g.timer = 0.4;
    g.bubble = null;
    return true;
  }
  return false;
}

/** Player taps a dirty room. */
export function tapRoom(r) {
  if (!sim.roomDirty[r] || sim.roomClean[r] > 0) return false;
  sim.roomClean[r] = CLEAN_SECONDS_TAP;
  return true;
}

export function dismissNightSummary() {
  useSim.setState({ nightSummary: null });
}

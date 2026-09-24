/**
 * game/sim.js
 * Real-time hotel simulation: ghosts arrive, check in, sleep in their coffin,
 * maybe visit the bar, pay and float away. Staff automate the tap-jobs.
 *
 * Positions change every frame, so they live in plain mutable objects that the
 * 3D scene reads inside useFrame. Only structural changes (a guest appears or
 * leaves, a room gets dirty…) are pushed to the small `useSim` store so React
 * re-renders just when something is added or removed.
 */

import { create } from 'zustand';
import {
  BAR_VISIT_CHANCE, CLEAN_SECONDS_TAP, CLEAN_SECONDS_ZOMBIE, DRINK_SECONDS, GHOST_SPEED,
  GUEST_TYPES, MAX_QUEUE, NIGHT_LENGTH_MIN, NIGHT_START_MIN, P, ROOMS, SERVE_SECONDS_WITCH,
  STAY_SECONDS, ZOMBIE_SPEED, autoCheckinSeconds, barStools, drinkPrice, getGuestType,
  roomPrice, spawnInterval, starsFor,
} from './config';
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

export const sim = {
  guests:     new Map(),
  fx:         new Map(),
  queue:      [],
  roomOcc:    ROOMS.map(() => null),
  roomDirty:  ROOMS.map(() => false),
  roomClean:  ROOMS.map(() => 0),     // tap-clean countdown
  stools:     P.stools.map(() => null),
  zombie:     { pos: [...P.zombieIdle], path: [], task: null, timer: 0, facing: 0, working: false },
  witch:      { serving: null, timer: 0 },
  spawnTimer: 1.5,
  clock:      0,
  nextId:     1,
};

// ─── helpers ─────────────────────────────────────────────────────────────────
const isLeftRoom = (r) => ROOMS[r].rot !== 0;

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

function pickGuestType() {
  const stars = starsFor(useHotel.getState().totalEarned);
  const pool = GUEST_TYPES.filter(t => t.star <= stars);
  const total = pool.reduce((s, _, i) => s + i + 1, 0);
  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= i + 1;
    if (r <= 0) return pool[i].id;
  }
  return pool[pool.length - 1].id;
}

function addFx(pos, amount) {
  const id = sim.nextId++;
  sim.fx.set(id, { id, pos: [pos[0], pos[1]], t: 0, amount });
  useSim.setState({ lastGain: { amount, at: Date.now(), id } });
}

function pay(g, amount) {
  const gain = useHotel.getState().earn(amount * getGuestType(g.type).mult);
  addFx(g.pos, gain);
}

// ─── paths ───────────────────────────────────────────────────────────────────
const pathDeskToRoom = (r) => {
  const room = ROOMS[r];
  const via = isLeftRoom(r) ? [P.corridorE, P.corridorW] : [P.corridorE];
  return [P.afterDesk, ...via, room.door, room.center];
};

const pathRoomToExit = (r) => {
  const room = ROOMS[r];
  const via = isLeftRoom(r) ? [P.corridorW] : [];
  return [room.door, ...via, [13.4, 3.9], [13.4, 12.2], P.exit];
};

const pathRoomToStool = (r, s) => {
  const room = ROOMS[r];
  const stool = P.stools[s];
  const via = isLeftRoom(r)
    ? [[4.3, room.door[1]], [4.3, 6.9]]
    : [[10.2, 3.9], [10.2, 6.9]];
  return [room.door, ...via, [stool[0], 6.9], stool];
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
function trySpawn() {
  const h = useHotel.getState();
  if (sim.queue.length >= MAX_QUEUE) return;
  const room = h.rooms.findIndex((lvl, i) => lvl > 0 && !sim.roomOcc[i] && !sim.roomDirty[i]);
  if (room < 0) return;

  const id = sim.nextId++;
  const g = {
    id,
    type:    pickGuestType(),
    pos:     [...P.spawn],
    path:    [],
    facing:  Math.PI,
    state:   'queue',
    timer:   0,
    room,
    stool:   null,
    bubble:  null,
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
}

function updateGuest(g, dt, h) {
  // fade in after spawning, fade out on the way out through the garden
  const target = g.state === 'leave' && g.pos[1] > 14 ? 0 : 1;
  g.alpha += Math.sign(target - g.alpha) * Math.min(Math.abs(target - g.alpha), dt * 2);

  switch (g.state) {
    case 'queue': {
      const arrived = walk(g, dt, GHOST_SPEED);
      if (g.pos[1] < 12.3) g.inside = true;
      if (arrived && sim.queue[0] === g.id) {
        g.state = 'desk';
        g.timer = autoCheckinSeconds(h.receptionLevel);
        g.bubble = h.staff.skelett ? null : 'checkin';
      }
      break;
    }
    case 'desk': {
      if (g.bubble === 'checkin' && !h.staff.skelett) break;   // waits for a tap
      g.bubble = null;
      g.timer -= dt;
      if (g.timer <= 0) {
        sim.queue.shift();
        refreshQueue();
        g.state = 'toRoom';
        g.path = pathDeskToRoom(g.room);
      }
      break;
    }
    case 'toRoom':
      if (walk(g, dt, GHOST_SPEED)) {
        g.state = 'sleep';
        g.timer = STAY_SECONDS;
        g.bubble = 'zzz';
        g.facing = ROOMS[g.room].rot + Math.PI / 2;
      }
      break;
    case 'sleep': {
      g.timer -= dt;
      if (g.timer > 0) break;
      pay(g, roomPrice(h.rooms[g.room] || 1));
      const r = g.room;
      sim.roomOcc[r] = null;
      sim.roomDirty[r] = true;
      syncRooms();

      const stools = h.barLevel > 0 ? barStools(h.barLevel) : 0;
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
      // either the witch serves (handled in updateWitch) or the player taps
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
        pay(g, drinkPrice(h.barLevel));
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
function updateWitch(dt, h) {
  if (!h.staff.hexe) return;
  const w = sim.witch;
  if (w.serving == null) {
    const next = [...sim.guests.values()].find(g => g.state === 'waitDrink');
    if (next) {
      w.serving = next.id;
      next.state = 'serve';
      next.timer = SERVE_SECONDS_WITCH;
      next.bubble = null;
    }
  } else if (!sim.guests.has(w.serving) || sim.guests.get(w.serving).state !== 'serve') {
    w.serving = null;
  }
}

function zombiePathTo(r) {
  const room = ROOMS[r];
  const via = isLeftRoom(r) ? [[4.4, room.door[1]]] : [[4.4, 3.9], room.door];
  const bed = room.center;
  const spot = isLeftRoom(r) ? [bed[0] + 0.9, bed[1] + 0.6] : [bed[0] + 0.6, bed[1] + 0.9];
  return [[4.4, P.zombieIdle[1]], ...via, spot];
}

function updateZombie(dt, h) {
  if (!h.staff.zombie) return;
  const z = sim.zombie;
  if (z.task == null) {
    const r = sim.roomDirty.findIndex(Boolean);
    if (r >= 0) {
      z.task = r;
      z.working = false;
      z.path = zombiePathTo(r);
    } else if (z.path.length) {
      walk(z, dt, ZOMBIE_SPEED);
    }
    return;
  }
  if (!sim.roomDirty[z.task]) {            // player was faster
    z.task = null;
    z.path = [...zombiePathTo(0).slice(0, 1), P.zombieIdle];
    return;
  }
  if (!z.working) {
    if (walk(z, dt, ZOMBIE_SPEED)) {
      z.working = true;
      z.timer = CLEAN_SECONDS_ZOMBIE;
    }
    return;
  }
  z.timer -= dt;
  if (z.timer <= 0) {
    sim.roomDirty[z.task] = false;
    syncRooms();
    const back = isLeftRoom(z.task)
      ? [[4.4, ROOMS[z.task].door[1]]]
      : [ROOMS[z.task].door, [4.4, 3.9]];
    z.task = null;
    z.working = false;
    z.path = [...back, [4.4, P.zombieIdle[1]], P.zombieIdle];
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
  const h = useHotel.getState();

  // night clock
  sim.clock += dt;
  const minute = NIGHT_START_MIN + Math.floor(sim.clock) % NIGHT_LENGTH_MIN;
  if (minute !== useSim.getState().minute) {
    if (minute === NIGHT_START_MIN && sim.clock > 1) {
      useSim.setState({ nightSummary: { amount: h.nightEarned, at: Date.now() } });
      h.resetNight();
    }
    useSim.setState({ minute });
  }

  sim.spawnTimer -= dt;
  if (sim.spawnTimer <= 0) {
    sim.spawnTimer = spawnInterval(h.receptionLevel);
    trySpawn();
  }

  for (const g of [...sim.guests.values()]) updateGuest(g, dt, h);
  updateWitch(dt, h);
  updateZombie(dt, h);

  for (let r = 0; r < sim.roomClean.length; r++) {
    if (sim.roomClean[r] > 0) {
      sim.roomClean[r] -= dt;
      if (sim.roomClean[r] <= 0) {
        sim.roomDirty[r] = false;
        syncRooms();
      }
    }
  }

  let fxChanged = false;
  for (const f of sim.fx.values()) {
    f.t += dt;
    if (f.t > 1.2) { sim.fx.delete(f.id); fxChanged = true; }
  }
  if (fxChanged) syncLists();
}

/** Player taps a ghost with a speech bubble. */
export function tapGuest(id) {
  const g = sim.guests.get(id);
  if (!g) return false;
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

/** Player taps an ectoplasm puddle. */
export function tapRoom(r) {
  if (!sim.roomDirty[r] || sim.roomClean[r] > 0) return false;
  sim.roomClean[r] = CLEAN_SECONDS_TAP;
  return true;
}

export function dismissNightSummary() {
  useSim.setState({ nightSummary: null });
}

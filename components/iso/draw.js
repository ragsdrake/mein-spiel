/**
 * Draws one frame of the sprite hotel into a Skia canvas (imperative, called
 * once per animation frame): backdrop, floor layers, depth-sorted sprites
 * and characters, then world-space badges, money pop-ups and particles.
 */

import { FilterMode, MipmapMode, Skia } from '@shopify/react-native-skia';
import { P, ROOMS } from '../../game/config';
import { toScreen } from '../../game/iso';
import { sim } from '../../game/sim';
import { behind, variantFor } from './pack';

// paints are created lazily: on the web CanvasKit loads after module import
let paint = null;
let shadowPaint = null;
function initPaints() {
  if (paint) return;
  paint = Skia.Paint();
  paint.setAntiAlias(true);
  shadowPaint = Skia.Paint();
  shadowPaint.setAntiAlias(true);
  shadowPaint.setColor(Skia.Color('rgba(8, 4, 20, 0.35)'));
  shadowPaint.setMaskFilter(Skia.MaskFilter.MakeBlur(0, 3, true));
}

function drawImg(c, img, src, x, y, w, h, alpha = 1) {
  if (!img) return;
  paint.setAlphaf(alpha);
  c.drawImageRectOptions(img, src, Skia.XYWHRect(x, y, w, h), FilterMode.Linear, MipmapMode.None, paint);
}

// ─── station levels & pop-in animation ───────────────────────────────────────
export function stationLevel(hs, station) {
  if (!station) return 1;
  if (station === 'bar') return hs.barLevel;
  const [kind, idx] = station.split(':');
  if (kind === 'room') return hs.rooms[Number(idx)] ?? 0;
  if (kind === 'attr') return hs.attractions[Number(idx)] ?? 0;
  return 1;
}

const easeOutBack = (x) => 1 + 2.4 * Math.pow(x - 1, 3) + 1.4 * Math.pow(x - 1, 2);

/** Scale for a sprite that pops in `delay` s after `t0` (seconds). */
function popScale(now, t0, delay, dur = 0.45) {
  if (t0 == null) return 1;
  const k = (now - t0 - delay) / dur;
  if (k <= 0) return 0;
  if (k >= 1) return 1;
  return Math.max(0, easeOutBack(k));
}

// ─── characters ──────────────────────────────────────────────────────────────
const DIRS = ['pz', 'px', 'nz', 'nx'];
function dirOf(facing) {
  const q = Math.round(((facing % (2 * Math.PI)) + 2 * Math.PI) / (Math.PI / 2)) % 4;
  return DIRS[q];
}

function charFrame(pack, id, pose, facing) {
  const dir = dirOf(facing);
  return pack.chars[`${id}-${pose}-${dir}`] ?? pack.chars[`${id}-idle-${dir}`] ?? pack.chars[`${id}-idle-pz`];
}

/**
 * Builds the moving drawables of this frame (guests, staff, crowd, traffic).
 * Each: { foot:[x0,x1,z0,z1], x, z, y, frame, alpha }
 */
export function collectActors(pack, theme, hs, now, stars) {
  const out = [];
  const add = (id, pose, facing, x, z, y = 0, alpha = 1, extra) => {
    const f = charFrame(pack, id, pose, facing);
    if (!f) return;
    out.push({ foot: [x - 0.25, x + 0.25, z - 0.25, z + 0.25], x, z, y, frame: f, alpha, ...extra });
  };
  const walk = (t, phase) => {
    const k = Math.floor((t * 7 + phase) % 4);
    return k === 1 ? 'walkA' : k === 3 ? 'walkB' : 'idle';
  };
  const floating = (id) => !pack.chars[`${id}-walkA-pz`];

  for (const g of sim.guests.values()) {
    const def = theme.guests.find(d => d.id === g.type) ?? theme.guests[0];
    const floats = floating(def.id);
    const moving = g.path.length > 0;
    let pose = 'idle', y = 0;
    if (g.state === 'sleep') { pose = floats ? 'idle' : 'lie'; y = floats ? 0.55 + Math.sin(now * 2.2 + g.phase) * 0.08 : 0.58; }
    else if (g.state === 'drink' || g.state === 'waitDrink' || g.state === 'serve') { pose = floats ? 'idle' : 'sit'; y = floats ? 0.35 : 0.3; }
    else if (moving && !floats) pose = walk(now, g.phase);
    if (floats && g.state !== 'sleep') y = 0.25 + Math.sin(now * 2.2 + g.phase) * 0.08;
    const s = Math.max(0.001, easeOutBack(Math.min(1, Math.max(0, g.alpha))));
    add(def.id, pose, g.facing, g.pos[0], g.pos[1], y, 1, { scale: s, guest: g });
  }

  const staff = hs.staff;
  if (staff.reception > 0) add('staff-reception', 'idle', Math.PI / 2, P.reception[0], P.reception[1], Math.abs(Math.sin(now * 1.5)) * 0.03);
  if (staff.bar > 0) add('staff-bar', 'idle', 0, P.bar[0], P.bar[1], Math.abs(Math.sin(now * 2.5)) * 0.03);
  if (staff.cleaner > 0) {
    const c = sim.cleaner;
    add('staff-cleaner', c.path.length ? walk(now, 0) : 'idle', c.facing, c.pos[0], c.pos[1]);
  }

  // ambient crowd: passers-by on the sidewalk, guests relaxing in the lounge
  const pool = theme.guests.filter(g => g.star <= stars && !floating(g.id));
  const walkers = pool.length ? pool : theme.guests.filter(g => g.star <= stars);
  for (let i = 0; i < 7 && walkers.length; i++) {
    const speed = 1.1 + (i % 3) * 0.25;
    const dir = i % 2 ? 1 : -1;
    const d = (now * speed + i * 6.3) % 50;
    const x = dir > 0 ? -16 + d : 34 - d;
    add(walkers[i % walkers.length].id, walk(now, i), dir > 0 ? Math.PI / 2 : -Math.PI / 2, x, i % 2 ? 20.6 : 21.4);
  }
  const rooms = hs.rooms.filter(Boolean).length;
  SEATS.slice(0, Math.min(SEATS.length, 2 + rooms)).forEach(([x, z, face], i) => {
    if (walkers.length) add(walkers[(i + 2) % walkers.length].id, 'sit', face, x, z, 0.18);
  });

  // traffic
  const cars = theme.palette.cars ?? [];
  [[23.9, 1, 2.4, 0], [25.3, -1, 2.0, 17], [23.9, 1, 2.4, 30]].forEach(([z, dir, speed, off], i) => {
    if (!cars.length) return;
    const d = (now * speed + off) % 110;
    const x = dir > 0 ? -45 + d : 60 - d;
    const f = pack.chars[`car${i % cars.length}-idle-${dir > 0 ? 'px' : 'nx'}`];
    if (f) out.push({ foot: [x - 1, x + 1, z - 0.5, z + 0.5], x, z, y: -0.5, frame: f, alpha: 1, car: true });
  });
  return out;
}

const SEATS = [
  [5.65, 9.2, -Math.PI / 2], [7.35, 9.2, Math.PI / 2], [7.35, 11.1, -Math.PI / 2],
  [9.05, 11.1, Math.PI / 2], [4.45, 11.3, -Math.PI / 2], [6.15, 11.3, Math.PI / 2],
  [2.8, 11.35, Math.PI], [3.6, 11.35, Math.PI],
];

// ─── doors ───────────────────────────────────────────────────────────────────
function doorOpen(index) {
  const room = ROOMS[index];
  const near = (p) => (p[0] - room.door[0]) ** 2 + (p[1] - room.door[1]) ** 2 < 1.1
    || (p[0] - room.entry[0]) ** 2 + (p[1] - room.entry[1]) ** 2 < 0.9;
  for (const g of sim.guests.values()) if (near(g.pos)) return true;
  return near(sim.cleaner.pos);
}

// ─── the frame ───────────────────────────────────────────────────────────────
/**
 * @param state  { pack, theme, hs, view, now, pops: Map(station -> t0),
 *                 building: Map(station -> until), actors }
 */
export function drawFrame(c, state) {
  initPaints();
  const { pack, hs, view: v, now, pops, building } = state;
  const k = v.k;
  const X = (px) => v.ox + px * k;
  const Y = (py) => v.oy + py * k;

  // backdrop
  for (const b of pack.backdrop) {
    drawImg(c, b.img, Skia.XYWHRect(0, 0, b.img.width(), b.img.height()), X(b.x), Y(b.y), b.w * k, b.h * k);
  }

  const levelOf = (p) => stationLevel(hs, p.station);
  const hidden = (p) => p.station && building.has(p.station);

  // wall decals + floor layers (rugs, dynamic shadows, character shadows)
  for (const p of pack.decals) {
    const vv = !hidden(p) && variantFor(pack, p, levelOf(p));
    if (vv) drawImg(c, vv.img, vv.src, X(vv.x), Y(vv.y), vv.w * k, vv.h * k, popScale(now, pops.get(p.station), 0.5) > 0.5 ? 1 : 0);
  }
  for (const p of pack.flats) {
    const vv = !hidden(p) && variantFor(pack, p, levelOf(p));
    if (vv) drawImg(c, vv.img, vv.src, X(vv.x), Y(vv.y), vv.w * k, vv.h * k, Math.min(1, popScale(now, pops.get(p.station), 0)));
  }
  const env = [];
  for (const p of pack.ordered) {
    if (hidden(p)) continue;
    let key = p.key;
    let vv;
    if (p.id.endsWith('-door') && p.station) {
      const idx = Number(p.station.split(':')[1]);
      const lvl = levelOf(p);
      const open = lvl > 0 && doorOpen(idx) && pack.parts.get(`${p.id}@open`);
      vv = open ? pack.parts.get(`${p.id}@open`).variants[0] : variantFor(pack, p, lvl);
      key = open ? `${p.id}@open` : key;
    } else {
      vv = variantFor(pack, p, levelOf(p));
    }
    if (!vv) continue;
    if (vv.shadow?.img) {
      const sh = vv.shadow;
      drawImg(c, sh.img, sh.src, X(sh.x), Y(sh.y), sh.w * k, sh.h * k, popScale(now, pops.get(p.station), 0.1));
    }
    env.push({ part: p, v: vv, key });
  }
  for (const a of state.actors) {
    if (a.car) continue;
    const [sx, sy] = toScreen(v, a.x, a.z, 0);
    const r = 0.32 * v.ppu * k * (a.scale ?? 1);
    c.drawOval(Skia.XYWHRect(sx - r, sy - r * 0.5, r * 2, r), shadowPaint);
  }

  // depth-sorted environment + actors
  const slots = new Map();
  for (const a of state.actors) {
    let idx = -1;
    for (let i = env.length - 1; i >= 0; i--) {
      const e = env[i];
      if (behind(e.part.foot, a.foot) && screenHit(e, a, v)) { idx = i; break; }
    }
    if (!slots.has(idx)) slots.set(idx, []);
    slots.get(idx).push(a);
  }
  slots.forEach(list => list.sort((a, b) => (a.x + a.z) - (b.x + b.z)));
  const drawActors = (idx) => {
    const list = slots.get(idx);
    if (list) list.forEach(a => drawActor(c, v, a));
  };
  drawActors(-1);
  env.forEach((e, i) => {
    const s = popScale(now, pops.get(e.part.station), popDelay(e.part));
    if (s > 0) {
      const { v: vv } = e;
      if (s === 1) drawImg(c, vv.img, vv.src, X(vv.x), Y(vv.y), vv.w * k, vv.h * k);
      else {
        // scale around the part's foot point
        const f = e.part.foot;
        const [fx, fy] = toScreen(v, (f[0] + f[1]) / 2, (f[2] + f[3]) / 2, 0);
        c.save();
        c.translate(fx, fy);
        c.scale(s, s);
        c.translate(-fx, -fy);
        drawImg(c, vv.img, vv.src, X(vv.x), Y(vv.y), vv.w * k, vv.h * k);
        c.restore();
      }
    }
    drawActors(i);
  });

  // construction sites on top of hidden stations
  building.forEach((until, station) => {
    const f = pack.chars[station === 'bar' ? 'build-bar-idle-pz' : station.startsWith('attr') ? 'build-attr-idle-pz' : 'build-room-idle-pz'];
    const at = buildSpot(station, state.spots);
    if (f && at) drawActor(c, v, { x: at[0], z: at[1], y: at[2] ?? 0, frame: f, alpha: 1, scale: popScale(now, until - 1.6, 0, 0.35) });
  });
}

function popDelay(part) {
  const m = /item(\d+)/.exec(part.id);
  if (m) return 0.2 + Number(m[1]) * 0.07;
  if (part.id.endsWith('-bed')) return 0.05;
  return 0;
}

function buildSpot(station, spots) {
  if (station === 'bar') return [7.2, 5.1];
  const [kind, i] = station.split(':');
  if (kind === 'room') return ROOMS[Number(i)].center;
  if (kind === 'attr') return spots?.[Number(i)] && [spots[Number(i)][0], spots[Number(i)][1], -0.5];
  return null;
}

function screenHit(e, a, v) {
  const vv = e.v;
  const [sx, sy] = toScreen(v, a.x, a.z, a.y);
  const x0 = v.ox + vv.x * v.k, y0 = v.oy + vv.y * v.k;
  const w = vv.w * v.k, h = vv.h * v.k;
  const cw = a.frame.w * v.k, ch = a.frame.h * v.k;
  const ax = sx + a.frame.x * v.k, ay = sy + a.frame.y * v.k;
  return ax < x0 + w && x0 < ax + cw && ay < y0 + h && y0 < ay + ch;
}

function drawActor(c, v, a) {
  const f = a.frame;
  const [sx, sy] = toScreen(v, a.x, a.z, a.y ?? 0);
  const s = a.scale ?? 1;
  if (s <= 0.001) return;
  const k = v.k;
  if (s !== 1) {
    c.save();
    c.translate(sx, sy);
    c.scale(s, s);
    c.translate(-sx, -sy);
  }
  drawImg(c, f.img, f.src, sx + f.x * k, sy + f.y * k, f.w * k, f.h * k, a.alpha ?? 1);
  if (s !== 1) c.restore();
}


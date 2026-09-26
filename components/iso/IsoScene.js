/**
 * The game view with pre-rendered Blender sprites, drawn by Skia.
 *
 * One animation loop steps the simulation, records the frame into an
 * SkPicture (components/iso/draw.js + overlay.js) and hands it to the Canvas
 * through a shared value — no React re-render per frame. Taps are mapped
 * back to the ground plane (game/iso.js) and routed to the game actions.
 */

import { Canvas, Picture, Skia } from '@shopify/react-native-skia';
import { Asset } from 'expo-asset';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import {
  BAR_MAX_LEVEL, P, RECEPTION_MAX_LEVEL, ROOMS, ROOM_MAX_LEVEL, attractionSpots, barUpgradeCost,
  receptionUpgradeCost, roomUpgradeCost,
} from '../../game/config';
import { CAM_BOUNDS, cam } from '../../game/camera';
import { fmt } from '../../game/format';
import { burst, intro, useFx } from '../../game/fx';
import { getHotel } from '../../game/hotels';
import { toGround, toScreen, viewFor } from '../../game/iso';
import { sim, step, tapGuest, tapRoom } from '../../game/sim';
import useHotel from '../../game/store';
import useUi from '../../game/ui';
import { EventFx } from '../scene/Fx';
import { collectActors, drawFrame, stationLevel } from './draw';
import { drawBadge, drawMoney, drawPuddle, initOverlay, spawnBurst, stepBurst } from './overlay';
import { loadPack } from './pack';

const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

let fontPromise = null;
function loadFont() {
  if (!fontPromise) {
    fontPromise = (async () => {
      const asset = Asset.fromModule(require('@expo-google-fonts/lilita-one/400Regular/LilitaOne_400Regular.ttf'));
      await asset.downloadAsync();
      const data = await Skia.Data.fromURI(asset.localUri ?? asset.uri);
      const tf = Skia.Typeface.MakeFreeTypeFaceFromData(data);
      return Skia.Font(tf, 17);
    })().catch(() => null);
  }
  return fontPromise;
}

let empty = null;
/** A blank picture for the first frames (the Picture node needs a value). */
function emptyPicture() {
  if (!empty) {
    const rec = Skia.PictureRecorder();
    rec.beginRecording(Skia.XYWHRect(0, 0, 1, 1));
    empty = rec.finishRecordingAsPicture();
  }
  return empty;
}

function stations(hs) {
  const list = hs.rooms.map((_, i) => `room:${i}`);
  list.push('bar');
  hs.attractions.forEach((_, i) => list.push(`attr:${i}`));
  return list;
}

export default function IsoScene() {
  const hotelId = useHotel(s => s.activeHotel);
  const { width, height } = useWindowDimensions();
  const [pack, setPack] = useState(null);
  const picture = useSharedValue(emptyPicture());
  const size = useRef({ width, height });
  size.current = { width, height };
  const targets = useRef([]);
  const viewRef = useRef(null);

  useEffect(() => {
    let live = true;
    setPack(null);
    loadPack(hotelId).then(p => { if (live) setPack(p); });
    loadFont();
    return () => { live = false; };
  }, [hotelId]);

  // frame the building on entering a hotel (wings are wider)
  useEffect(() => {
    const n = getHotel(hotelId).rooms.length;
    // start close on the building; zoom-out and panning stop at its edges,
    // so the surroundings stay a frame instead of taking over the screen
    const wide = n > 6;
    cam.x = wide ? 9.4 : 6.9;
    cam.z = wide ? 6.4 : 6.6;
    cam.zoom = wide ? 1.25 : 1.35;
    Object.assign(CAM_BOUNDS, {
      minX: 2, maxX: wide ? 18 : 13, minZ: 2, maxZ: 13.5,
      minZoom: wide ? 0.85 : 0.95, maxZoom: 2.6,
    });
  }, [hotelId]);

  useEffect(() => {
    if (!pack) return undefined;
    const theme = getHotel(hotelId);
    let font = null;
    loadFont().then(f => { font = f; });
    const pops = new Map();
    const building = new Map();
    const prev = new Map();
    const bursts = [];
    let introT = 0;
    let introStarted = false;
    let last = null;
    let raf;
    let now = 0;

    const frame = (ts) => {
      raf = requestAnimationFrame(frame);
      const dt = last == null ? 0.016 : Math.min(0.1, (ts - last) / 1000);
      last = ts;
      now += dt;
      intro.frames += 1;
      step(dt);

      const store = useHotel.getState();
      const hs = store.hotels[hotelId];
      const pm = theme.pm;
      const spots = attractionSpots(hs.rooms.length);

      // intro: zoom/pan in while the hotel builds itself station by station
      if (!intro.hold) {
        if (!introStarted) {
          introStarted = true;
          stations(hs).forEach((st, i) => pops.set(st, now + 0.3 + i * 0.12));
        }
        introT = Math.min(1, introT + Math.min(dt, 1 / 30) / 2.4);
      }
      const e = easeInOut(introT);

      // level changes → construction site, pop-in, particles
      for (const st of stations(hs)) {
        const lvl = stationLevel(hs, st);
        const before = prev.get(st);
        prev.set(st, lvl);
        if (before == null || before === lvl) continue;
        const at = spotOf(st, spots);
        if (before === 0 && lvl > 0) {
          building.set(st, now + 1.6);
          burst('dust', [at[0], 0.3, at[1]]);
        } else {
          pops.set(st, now);
          burst('sparkle', [at[0], 1.2, at[1]]);
        }
      }
      building.forEach((until, st) => {
        if (now < until) return;
        building.delete(st);
        pops.set(st, now);
        const at = spotOf(st, spots);
        burst('dust', [at[0], 0.3, at[1]]);
        burst('confetti', [at[0], 1.2, at[1]], 0.15);
      });

      // particle requests from the game
      const reqs = useFx.getState().items;
      if (reqs.length) {
        reqs.forEach(r => bursts.push(spawnBurst(r, now)));
        useFx.setState({ items: [] });
      }

      const { width: W, height: H } = size.current;
      const v = viewFor(pack.ppu, W, H, 0.6 + 0.4 * e, (1 - e) * 3, (1 - e) * 3);
      viewRef.current = v;
      const actors = collectActors(pack, theme, hs, now, store.starsOf(hotelId));

      initOverlay();
      const rec = Skia.PictureRecorder();
      const c = rec.beginRecording(Skia.XYWHRect(0, 0, W, H));
      c.drawColor(Skia.Color(theme.palette.bg));
      drawFrame(c, { pack, theme, hs, view: v, now, pops, building, actors, spots });

      // puddles + badges
      const tg = [];
      const r = 17;
      hs.rooms.forEach((lvl, i) => {
        const room = ROOMS[i];
        if (sim.roomDirty[i]) {
          drawPuddle(c, v, room.clean[0], room.clean[1], theme.palette.slime);
          tg.push({ kind: 'puddle', room: i, at: toScreen(v, room.clean[0], room.clean[1], 0), r: 34 });
          if (!hs.staff.cleaner) {
            const [x, y] = toScreen(v, room.clean[0], room.clean[1], 1.5 + Math.sin(now * 4) * 0.08);
            drawBadge(c, 'clean', x, y, r);
          }
        }
        const reachable = i === 0 || hs.rooms[i - 1] > 0;
        let badge = null;
        if (lvl === 0 && reachable) badge = 'lock';
        else if (lvl > 0 && lvl < ROOM_MAX_LEVEL && store.coins >= roomUpgradeCost(i, lvl, pm) && !sim.roomDirty[i]) badge = 'upgrade';
        if (badge && !building.has(`room:${i}`)) {
          const bob = Math.abs(Math.sin(now * 3 + i)) * 0.15;
          const [x, y] = toScreen(v, room.center[0], room.center[1], 2.1 + bob);
          drawBadge(c, badge, x, y, r);
          tg.push({ kind: 'room', room: i, at: [x, y], r: 30 });
        }
      });
      if (hs.barLevel === 0 || (hs.barLevel < BAR_MAX_LEVEL && store.coins >= barUpgradeCost(hs.barLevel, pm))) {
        if (!building.has('bar')) {
          const [x, y] = toScreen(v, 7.2, 5.3, 2.2 + Math.abs(Math.sin(now * 3)) * 0.15);
          drawBadge(c, hs.barLevel === 0 ? 'lock' : 'upgrade', x, y, r);
          tg.push({ kind: 'bar', at: [x, y], r: 30 });
        }
      }
      if (hs.receptionLevel < RECEPTION_MAX_LEVEL && store.coins >= receptionUpgradeCost(hs.receptionLevel, pm)) {
        const [x, y] = toScreen(v, 10, 9.6, 2.4 + Math.abs(Math.sin(now * 3 + 1)) * 0.15);
        drawBadge(c, 'upgrade', x, y, r);
        tg.push({ kind: 'reception', at: [x, y], r: 30 });
      }
      for (const a of actors) {
        const g = a.guest;
        if (!g) continue;
        const show = g.tip ? 'tip' : g.bubble;
        if (show) {
          const floats = !pack.chars[`${g.type}-walkA-pz`];
          const [x, y] = toScreen(v, g.pos[0], g.pos[1], a.y + (floats ? 1.55 : 2.0) + Math.abs(Math.sin(now * 3 + g.phase)) * 0.12);
          drawBadge(c, show, x, y, show === 'zzz' ? 15 : r);
        }
        const [gx, gy] = toScreen(v, g.pos[0], g.pos[1], a.y + 0.9);
        tg.push({ kind: 'guest', id: g.id, at: [gx, gy], r: 30, prio: show && show !== 'zzz' ? 2 : 0 });
      }
      // money pop-ups
      for (const f of sim.fx.values()) drawMoney(c, v, font, f, `+${fmt(f.amount)}`);
      // particles
      for (let i = bursts.length - 1; i >= 0; i--) {
        if (!stepBurst(c, v, bursts[i], now, dt)) bursts.splice(i, 1);
      }
      targets.current = tg;
      if (__DEV__ && Platform.OS === 'web') {
        // test hooks for browser automation (dev only)
        window.__cam = cam;
        window.__store = useHotel;
        window.__isoTargets = () => targets.current.map(t => ({ kind: t.kind, at: t.at }));
        window.__project = (x, y, z) => toScreen(v, x, z, y);
      }
      picture.value = rec.finishRecordingAsPicture();
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [pack, hotelId, picture]);

  const onTap = (e) => {
    // react-native-web has no locationX on press events; the view fills the screen
    const ne = e.nativeEvent;
    const x = ne.locationX ?? ne.offsetX ?? ne.pageX;
    const y = ne.locationY ?? ne.offsetY ?? ne.pageY;
    const v = viewRef.current;
    if (!v) return;
    const dist = (t) => Math.hypot(t.at[0] - x, t.at[1] - y);
    const hits = targets.current.filter(t => dist(t) < t.r).sort((a, b) => (b.prio ?? 1) - (a.prio ?? 1) || dist(a) - dist(b));
    const ui = useUi.getState();
    for (const t of hits) {
      if (t.kind === 'guest' && tapGuest(t.id)) return;
      if (t.kind === 'puddle') { tapRoom(t.room); return; }
      if (t.kind === 'room') { ui.openUpgrade('room', t.room); return; }
      if (t.kind === 'bar') { ui.openUpgrade('bar'); return; }
      if (t.kind === 'reception') { ui.openUpgrade('reception'); return; }
    }
    // tap on a station's floor area
    const [gx, gz] = toGround(v, x, y);
    const hs = useHotel.getState().active();
    for (let i = 0; i < hs.rooms.length; i++) {
      const room = ROOMS[i];
      const c = Math.cos(room.rot), s = Math.sin(room.rot);
      const dx = gx - room.center[0], dz = gz - room.center[1];
      const lx = dx * c - dz * s, lz = dx * s + dz * c;
      if (Math.abs(lx) < 1.5 && lz > -1.6 && lz < room.front) {
        if (hs.rooms[i] > 0 || i === 0 || hs.rooms[i - 1] > 0) ui.openUpgrade('room', i);
        return;
      }
    }
    if (gx > 4.4 && gx < 10.8 && gz > 3.8 && gz < 6.4) { ui.openUpgrade('bar'); return; }
    if (gx > 8.4 && gx < 11 && gz > 8.1 && gz < 11.2) ui.openUpgrade('reception');
  };

  return (
    <View style={[styles.wrap, { backgroundColor: getHotel(hotelId).palette.bg }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onTap}>
        <Canvas style={styles.canvas}>
          <Picture picture={picture} />
        </Canvas>
      </Pressable>
      <EventFx />
    </View>
  );
}

function spotOf(station, spots) {
  if (station === 'bar') return P.bar;
  const [kind, i] = station.split(':');
  if (kind === 'room') return ROOMS[Number(i)].center;
  return spots[Number(i)] ?? [8, 16];
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  canvas: { flex: 1 },
});

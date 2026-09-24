/**
 * Everything that moves: guests, staff and the coin pop-ups.
 * Positions are read from the mutable simulation every frame.
 */

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { P } from '../../game/config';
import { getGuestDef } from '../../game/hotels';
import { sim, tapGuest, useSim } from '../../game/sim';
import useHotel from '../../game/store';
import Character, { FLOATING } from './Blocky';
import { Ball, Blob, Box, Cyl, M, Sprite, Torus } from './primitives';
import { useTheme } from './theme';

const WHITE = M('#ffffff', { emissive: '#ffffff', intensity: 0.35, smooth: true });
const ALERT = M('#ff3b3b', { emissive: '#ff2a2a', intensity: 0.6 });
const COIN  = M('#ffc94a', { emissive: '#ff9d00', intensity: 0.9, metal: 0.8, rough: 0.25 });

/** Speech bubble contents are simple shapes — no fonts needed. */
function BubbleCheckin() {
  return (
    <group>
      <Ball rad={0.3} w={12} hs={9} mat={WHITE} cast={false} />
      <Box p={[0, 0.06, 0.26]} s={[0.08, 0.26, 0.06]} mat={ALERT} cast={false} />
      <Box p={[0, -0.16, 0.26]} s={[0.08, 0.08, 0.06]} mat={ALERT} cast={false} />
    </group>
  );
}

function BubbleDrink() {
  const { palette } = useTheme();
  return (
    <group>
      <Ball rad={0.3} w={12} hs={9} mat={WHITE} cast={false} />
      <Cyl p={[-0.03, -0.02, 0.24]} rt={0.1} rb={0.08} h={0.24} seg={8}
        mat={M(palette.accentLight, { emissive: palette.accentLight, intensity: 1 })} cast={false} />
      <Torus p={[0.1, -0.02, 0.24]} rad={0.06} tube={0.02} arc={Math.PI} r={[0, 0, -Math.PI / 2]} mat={M('#3a3440')} cast={false} />
    </group>
  );
}

function BubbleTip() {
  return (
    <group>
      <Cyl rt={0.28} h={0.08} seg={16} r={[Math.PI / 2, 0, 0]} mat={COIN} cast={false} />
      <Cyl p={[0, 0, 0.045]} rt={0.2} h={0.02} seg={16} r={[Math.PI / 2, 0, 0]} mat={M('#ffe08a', { emissive: '#ffb300', intensity: 0.8, metal: 0.8 })} cast={false} />
      <Sprite size={1.3} color="#ffc94a" opacity={0.6} />
    </group>
  );
}

function BubbleZzz() {
  const z = (x, y, s) => (
    <group position={[x, y, 0]} scale={s}>
      <Box p={[0, 0.08, 0]} s={[0.16, 0.035, 0.03]} mat={WHITE} cast={false} />
      <Box p={[0, 0, 0]} s={[0.035, 0.2, 0.03]} r={[0, 0, -0.95]} mat={WHITE} cast={false} />
      <Box p={[0, -0.08, 0]} s={[0.16, 0.035, 0.03]} mat={WHITE} cast={false} />
    </group>
  );
  return (
    <group>
      {z(0, 0, 0.8)}
      {z(0.18, 0.2, 1)}
      {z(0.4, 0.44, 1.2)}
    </group>
  );
}

/** Characters are drawn ~20 % larger than the old models so they read at a distance. */
const CHAR_SCALE = 1.2;

const easeOutBack = (x) => 1 + 2.2 * Math.pow(x - 1, 3) + 1.2 * Math.pow(x - 1, 2);

function GuestActor({ id }) {
  const theme = useTheme();
  const g = sim.guests.get(id);
  const def = getGuestDef(theme, g?.type);
  const floats = FLOATING.has(def.model);
  const root = useRef();
  const body = useRef();
  const lie = useRef();
  const bubble = useRef();
  const motion = useRef({ moving: false, phase: g?.phase ?? 0 });
  const refs = { checkin: useRef(), drink: useRef(), zzz: useRef(), tip: useRef() };

  useFrame(({ clock, camera }) => {
    const guest = sim.guests.get(id);
    if (!guest || !root.current) return;
    const t = clock.elapsedTime + guest.phase;
    const sleeping = guest.state === 'sleep';
    const atBar = guest.state === 'drink' || guest.state === 'waitDrink' || guest.state === 'serve';
    const moving = guest.path.length > 0;

    motion.current.moving = moving && !floats;
    const y = floats
      ? (sleeping ? 0.55 : atBar ? 0.35 : 0.25) + Math.sin(t * 2.2) * 0.08
      : (sleeping ? 0.58 : atBar ? 0.3 : 0) + (moving ? Math.abs(Math.sin(t * 11)) * 0.03 : 0);
    root.current.position.set(guest.pos[0], y, guest.pos[1]);
    const s = easeOutBack(Math.max(0, Math.min(1, guest.alpha)));
    root.current.scale.setScalar(Math.max(0.001, s));

    const cur = body.current.rotation.y;
    let diff = guest.facing - cur;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    body.current.rotation.y = cur + diff * 0.15;
    body.current.rotation.z = floats ? (sleeping ? Math.sin(t) * 0.08 : Math.sin(t * 2.2) * 0.05) : 0;
    // walkers lie down in their bed (head towards the pillow)
    const lying = sleeping && !floats;
    lie.current.rotation.x = lying ? -Math.PI / 2 : 0;
    lie.current.position.z = lying ? 0.55 : 0;

    bubble.current.quaternion.copy(camera.quaternion);
    bubble.current.position.y = (floats ? 1.55 : 2.0) + Math.abs(Math.sin(t * 3)) * 0.12;
    const shown = guest.tip ? 'tip' : guest.bubble;
    for (const k of Object.keys(refs)) refs[k].current.visible = shown === k;
    if (guest.tip) refs.tip.current.rotation.y = clock.elapsedTime * 4;
  });

  if (!g) return null;
  return (
    <group ref={root} onClick={(e) => { e.stopPropagation(); tapGuest(id); }}>
      <group ref={body}>
        <group ref={lie} scale={CHAR_SCALE}>
          <Character def={def} motion={motion} />
        </group>
      </group>
      <Blob p={[0, floats ? -0.2 : 0.02, 0]} size={floats ? 0.8 : 0.9} />
      <group ref={bubble}>
        <group ref={refs.checkin}><BubbleCheckin /></group>
        <group ref={refs.drink}><BubbleDrink /></group>
        <group ref={refs.zzz}><BubbleZzz /></group>
        <group ref={refs.tip}><BubbleTip /></group>
      </group>
      <mesh visible={false} position={[0, 0.9, 0]}>
        <sphereGeometry args={[0.9, 6, 4]} />
      </mesh>
    </group>
  );
}

function Guests() {
  const ids = useSim(s => s.guestIds);
  return ids.map(id => <GuestActor key={id} id={id} />);
}

const CASH = M('#3fce6a');
const CASH_BAND = M('#e8fff0');

/** Green money bundle that pops up and rises when a guest pays. */
function CoinFx({ id }) {
  const ref = useRef();
  const tip = sim.fx.get(id)?.kind === 'tip';
  useFrame(() => {
    const f = sim.fx.get(id);
    if (!f || !ref.current) return;
    ref.current.position.set(f.pos[0], 1.5 + f.t * 1.3, f.pos[1]);
    ref.current.rotation.y = 0.6 + f.t * 2;
    const pop = f.t < 0.2 ? easeOutBack(f.t / 0.2) : 1 - Math.max(0, f.t - 0.85) / 0.35;
    ref.current.scale.setScalar(Math.max(0.001, (tip ? 1.5 : 1) * pop));
  });
  return (
    <group ref={ref}>
      {[0, 1, 2].map(i => (
        <group key={i} position={[0, i * 0.09, 0]} rotation={[0, i * 0.15, 0]}>
          <Box s={[0.5, 0.08, 0.26]} mat={CASH} cast={false} />
          <Box s={[0.1, 0.085, 0.265]} mat={CASH_BAND} cast={false} />
        </group>
      ))}
    </group>
  );
}

function Effects() {
  const ids = useSim(s => s.fxIds);
  return ids.map(id => <CoinFx key={id} id={id} />);
}

function Idle({ p, face = 0, speed = 1.5, children }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * speed + p[0];
    ref.current.position.y = Math.abs(Math.sin(t)) * 0.03;
  });
  return (
    <group position={[p[0], 0, p[1]]} rotation={[0, face, 0]}>
      <group ref={ref} scale={CHAR_SCALE}>{children}</group>
      <Blob size={0.9} />
    </group>
  );
}

function CleanerActor({ def }) {
  const ref = useRef();
  const inner = useRef();
  const motion = useRef({ moving: false, phase: 0 });
  useFrame(({ clock }) => {
    const c = sim.cleaner;
    if (!ref.current) return;
    ref.current.position.set(c.pos[0], 0, c.pos[1]);
    const cur = ref.current.rotation.y;
    let diff = c.facing - cur;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    ref.current.rotation.y = cur + diff * 0.12;
    const t = clock.elapsedTime;
    const moving = c.path.length > 0;
    motion.current.moving = moving;
    inner.current.rotation.z = c.working ? Math.sin(t * 10) * 0.08 : 0;
    inner.current.rotation.y = c.working ? Math.sin(t * 8) * 0.4 : 0;
  });
  return (
    <group ref={ref}>
      <group ref={inner} scale={CHAR_SCALE}><Character def={def} motion={motion} /></group>
      <Blob size={0.9} />
    </group>
  );
}

function Staff() {
  const theme = useTheme();
  const staff = useHotel(s => s.hotels[s.activeHotel].staff);
  return (
    <group>
      {staff.reception > 0 && (
        <Idle p={P.reception} face={Math.PI / 2}><Character def={theme.staff.reception} /></Idle>
      )}
      {staff.bar > 0 && (
        <Idle p={P.bar} face={0} speed={2.5}><Character def={theme.staff.bar} /></Idle>
      )}
      {staff.cleaner > 0 && <CleanerActor def={theme.staff.cleaner} />}
    </group>
  );
}

// ─── ambient crowd: passers-by on the sidewalk and guests relaxing inside ────
const SIT_MOTION = { current: { moving: false } };

function Passerby({ def, z, speed, offset, dir }) {
  const ref = useRef();
  const motion = useRef({ moving: true, phase: offset });
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const span = 44;
    const d = (clock.elapsedTime * speed + offset) % span;
    ref.current.position.set(dir > 0 ? -14 + d : 30 - d, -0.45, z);
    ref.current.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
  });
  return (
    <group ref={ref}>
      <group scale={CHAR_SCALE}><Character def={def} motion={motion} /></group>
      <Blob size={0.8} />
    </group>
  );
}

/** Seats: [x, z, facing] on the lounge chairs and the sofa. */
const SEATS = [
  [5.65, 9.2, -Math.PI / 2], [7.35, 9.2, Math.PI / 2], [7.35, 11.1, -Math.PI / 2],
  [9.05, 11.1, Math.PI / 2], [4.45, 11.3, -Math.PI / 2], [6.15, 11.3, Math.PI / 2],
  [2.8, 11.35, Math.PI], [3.6, 11.35, Math.PI],
];

function Crowd() {
  const theme = useTheme();
  const stars = useHotel(s => s.starsOf(s.activeHotel));
  const rooms = useHotel(s => s.hotels[s.activeHotel].rooms.filter(Boolean).length);
  const pool = theme.guests.filter(g => g.star <= stars && !FLOATING.has(g.model));
  const walkers = pool.length ? pool : theme.guests.filter(g => g.star <= stars);
  const sitters = Math.min(SEATS.length, 2 + rooms);
  return (
    <group>
      {Array.from({ length: 7 }, (_, i) => (
        <Passerby key={i} def={walkers[i % walkers.length]} z={i % 2 ? 20.6 : 21.4}
          speed={1.1 + (i % 3) * 0.25} offset={i * 6.3} dir={i % 2 ? 1 : -1} />
      ))}
      {SEATS.slice(0, sitters).map(([x, z, face], i) => (
        <group key={i} position={[x, 0.18, z]} rotation={[0, face, 0]}>
          <group scale={CHAR_SCALE}><Character def={walkers[(i + 2) % walkers.length]} motion={SIT_MOTION} /></group>
        </group>
      ))}
    </group>
  );
}

export default function Actors() {
  return (
    <group>
      <Guests />
      <Staff />
      <Crowd />
      <Effects />
    </group>
  );
}

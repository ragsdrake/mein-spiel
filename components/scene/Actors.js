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
        <group ref={lie}>
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

function CoinFx({ id }) {
  const ref = useRef();
  const tip = sim.fx.get(id)?.kind === 'tip';
  useFrame(() => {
    const f = sim.fx.get(id);
    if (!f || !ref.current) return;
    ref.current.position.set(f.pos[0], 1.3 + f.t * 1.4, f.pos[1]);
    ref.current.rotation.y = f.t * 9;
    ref.current.scale.setScalar((tip ? 1.6 : 1) * (f.t < 0.15 ? f.t / 0.15 : 1 - Math.max(0, f.t - 0.8) / 0.4));
  });
  return (
    <group ref={ref}>
      <Cyl rt={0.2} h={0.06} seg={14} r={[Math.PI / 2, 0, 0]} mat={COIN} cast={false} />
      <Sprite size={0.9} color="#ffc94a" opacity={0.5} />
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
      <group ref={ref}>{children}</group>
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
      <group ref={inner}><Character def={def} motion={motion} /></group>
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

export default function Actors() {
  return (
    <group>
      <Guests />
      <Staff />
      <Effects />
    </group>
  );
}

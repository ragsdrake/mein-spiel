/**
 * Everything that moves: ghost guests, staff and the coin pop-ups.
 * Positions are read from the mutable simulation every frame.
 */

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { P } from '../../game/config';
import { sim, tapGuest, useSim } from '../../game/sim';
import useHotel from '../../game/store';
import { Ghost, Skeleton, Witch, Zombie, useGhostMaterials } from './Characters';
import { Ball, Box, Cyl, M } from './primitives';

const WHITE = M('#ffffff', { emissive: '#ffffff', intensity: 0.25 });
const ALERT = M('#ff3b3b', { emissive: '#ff2a2a', intensity: 0.4 });
const COIN  = M('#ffc94a', { emissive: '#ff9d00', intensity: 0.6, metal: 0.5, rough: 0.35 });

/** Speech bubble contents are simple shapes — no fonts needed. */
function BubbleCheckin() {
  return (
    <group>
      <Ball rad={0.3} w={8} hs={6} mat={WHITE} cast={false} />
      <Box p={[0, 0.06, 0.26]} s={[0.08, 0.26, 0.06]} mat={ALERT} cast={false} />
      <Box p={[0, -0.16, 0.26]} s={[0.08, 0.08, 0.06]} mat={ALERT} cast={false} />
    </group>
  );
}

function BubbleDrink() {
  return (
    <group>
      <Ball rad={0.3} w={8} hs={6} mat={WHITE} cast={false} />
      <Cyl p={[-0.03, -0.02, 0.24]} rt={0.1} rb={0.08} h={0.24} seg={6}
        mat={M('#7dff7a', { emissive: '#35e05a', intensity: 0.8 })} cast={false} />
      <mesh position={[0.1, -0.02, 0.24]} rotation={[0, 0, Math.PI / 2]} material={M('#3a3440')}>
        <torusGeometry args={[0.06, 0.02, 4, 6, Math.PI]} />
      </mesh>
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

function GuestActor({ id }) {
  const g = sim.guests.get(id);
  const mats = useGhostMaterials(g?.type);
  const root = useRef();
  const body = useRef();
  const bubble = useRef();
  const bCheckin = useRef();
  const bDrink = useRef();
  const bZzz = useRef();

  useFrame(({ clock, camera }) => {
    const guest = sim.guests.get(id);
    if (!guest || !root.current) return;
    const t = clock.elapsedTime + guest.phase;
    const sleeping = guest.state === 'sleep';
    const drinking = guest.state === 'drink' || guest.state === 'waitDrink' || guest.state === 'serve';

    root.current.position.set(
      guest.pos[0],
      (sleeping ? 0.55 : drinking ? 0.35 : 0.25) + Math.sin(t * 2.2) * 0.08,
      guest.pos[1],
    );
    // turn smoothly towards the walking direction
    const cur = body.current.rotation.y;
    let diff = guest.facing - cur;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    body.current.rotation.y = cur + diff * 0.15;
    body.current.rotation.z = sleeping ? Math.sin(t) * 0.08 : Math.sin(t * 2.2) * 0.05;

    for (const m of [mats.body, mats.ink, mats.cheek]) {
      m.opacity = guest.alpha * (m === mats.body ? 0.9 : 1);
    }
    root.current.visible = guest.alpha > 0.02;

    bubble.current.quaternion.copy(camera.quaternion);
    bubble.current.position.y = 1.55 + Math.abs(Math.sin(t * 3)) * 0.12;
    bCheckin.current.visible = guest.bubble === 'checkin';
    bDrink.current.visible = guest.bubble === 'drink';
    bZzz.current.visible = guest.bubble === 'zzz';
  });

  if (!g) return null;
  return (
    <group ref={root} onClick={(e) => { e.stopPropagation(); tapGuest(id); }}>
      <group ref={body}>
        <Ghost type={g.type} mats={mats} />
      </group>
      <group ref={bubble}>
        <group ref={bCheckin}><BubbleCheckin /></group>
        <group ref={bDrink}><BubbleDrink /></group>
        <group ref={bZzz}><BubbleZzz /></group>
      </group>
      {/* larger invisible tap target */}
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
  useFrame(() => {
    const f = sim.fx.get(id);
    if (!f || !ref.current) return;
    ref.current.position.set(f.pos[0], 1.3 + f.t * 1.4, f.pos[1]);
    ref.current.rotation.y = f.t * 9;
    ref.current.scale.setScalar(f.t < 0.15 ? f.t / 0.15 : 1 - Math.max(0, f.t - 0.8) / 0.4);
  });
  return (
    <group ref={ref}>
      <Cyl rt={0.2} h={0.06} seg={10} r={[Math.PI / 2, 0, 0]} mat={COIN} cast={false} />
    </group>
  );
}

function Effects() {
  const ids = useSim(s => s.fxIds);
  return ids.map(id => <CoinFx key={id} id={id} />);
}

function Bobbing({ p, face = 0, speed = 1.5, children }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.elapsedTime * speed + p[0];
      ref.current.position.y = Math.abs(Math.sin(t)) * 0.04;
      ref.current.rotation.z = Math.sin(t) * 0.04;
    }
  });
  return (
    <group position={[p[0], 0, p[1]]} rotation={[0, face, 0]}>
      <group ref={ref}>{children}</group>
    </group>
  );
}

function ZombieActor() {
  const ref = useRef();
  const inner = useRef();
  useFrame(({ clock }) => {
    const z = sim.zombie;
    if (!ref.current) return;
    ref.current.position.set(z.pos[0], 0, z.pos[1]);
    const cur = ref.current.rotation.y;
    let diff = z.facing - cur;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    ref.current.rotation.y = cur + diff * 0.12;
    const t = clock.elapsedTime;
    const moving = z.path.length > 0;
    inner.current.rotation.z = moving ? Math.sin(t * 6) * 0.12 : z.working ? Math.sin(t * 10) * 0.08 : 0;
    inner.current.rotation.y = z.working ? Math.sin(t * 8) * 0.4 : 0;
  });
  return (
    <group ref={ref}>
      <group ref={inner}><Zombie /></group>
    </group>
  );
}

function Staff() {
  const staff = useHotel(s => s.staff);
  return (
    <group>
      {staff.skelett && (
        <Bobbing p={P.skelett} face={Math.PI / 2}><Skeleton /></Bobbing>
      )}
      {staff.hexe && (
        <Bobbing p={P.hexe} face={0} speed={2.5}><Witch /></Bobbing>
      )}
      {staff.zombie && <ZombieActor />}
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

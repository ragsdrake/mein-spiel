/**
 * World-space status badges (upgrade arrow, check-in "!", drink, Zzz, tip,
 * cleaning hint) in the tycoon style: flat, unlit discs with a dark outline,
 * a white ring and a coloured face, plus an optional speech-bubble tail.
 * They are drawn on top of the scene (no depth test) so walls never cut
 * them. Place them inside a group that copies the camera rotation.
 */

import { DoubleSide, MeshBasicMaterial } from 'three';

const OUTLINE = '#1f2447';
const cache = new Map();

/** Unlit, always-on-top material. */
export function flat(color, opacity = 1) {
  const key = `${color}|${opacity}`;
  let m = cache.get(key);
  if (!m) {
    m = new MeshBasicMaterial({ color, transparent: true, opacity, depthTest: false, depthWrite: false, side: DoubleSide });
    cache.set(key, m);
  }
  return m;
}

const BASE = 20;   // render order of the badge background; icons draw above it

function Disc({ r, color, p = [0, 0, 0], order, opacity, sc, seg = 28 }) {
  return (
    <mesh position={p} scale={sc} material={flat(color, opacity)} renderOrder={BASE + order}>
      <circleGeometry args={[r, seg]} />
    </mesh>
  );
}

/** Triangle (tail / arrow head) pointing along `rot` (0 = down). */
function Tri({ r, color, p, rot = 0, order }) {
  return (
    <mesh position={p} rotation={[0, 0, -Math.PI / 2 + rot]} material={flat(color)} renderOrder={BASE + order}>
      <circleGeometry args={[r, 3]} />
    </mesh>
  );
}

/** Flat rectangle for icon shapes. */
export function Bar({ p = [0, 0], s, r = 0, color = '#ffffff', order = 6 }) {
  return (
    <mesh position={[p[0], p[1], 0]} rotation={[0, 0, r]} material={flat(color)} renderOrder={BASE + order}>
      <planeGeometry args={s} />
    </mesh>
  );
}

/** Flat circle for icon shapes. */
export function Dot({ p = [0, 0], r, color = '#ffffff', order = 6 }) {
  return (
    <mesh position={[p[0], p[1], 0]} material={flat(color)} renderOrder={BASE + order}>
      <circleGeometry args={[r, 20]} />
    </mesh>
  );
}

/** Round badge: shadow, outline, white ring, coloured face with a soft highlight. */
export function Badge({ color, size = 1, tail = false, children }) {
  return (
    <group scale={size}>
      <Disc r={0.4} color="#000000" opacity={0.28} p={[0.035, -0.05, 0]} order={0} />
      {tail && (
        <group>
          <Tri r={0.17} color={OUTLINE} p={[0, -0.38, 0]} order={1} />
          <Tri r={0.11} color="#ffffff" p={[0, -0.34, 0]} order={2} />
        </group>
      )}
      <Disc r={0.38} color={OUTLINE} order={1} />
      <Disc r={0.34} color="#ffffff" order={2} />
      <Disc r={0.28} color={color} order={3} />
      <Disc r={0.2} color="#ffffff" opacity={0.22} p={[0, 0.1, 0]} sc={[1, 0.42, 1]} order={4} />
      {children}
    </group>
  );
}

// ─── the badges used in the game ─────────────────────────────────────────────
export function UpgradeBadge() {
  return (
    <Badge color="#2ecc5a">
      <Bar p={[0, -0.07]} s={[0.1, 0.2]} color={OUTLINE} order={5} />
      <Tri r={0.16} color={OUTLINE} p={[0, 0.06, 0]} rot={Math.PI} order={5} />
      <Bar p={[0, -0.06]} s={[0.07, 0.18]} />
      <Tri r={0.12} color="#ffffff" p={[0, 0.06, 0]} rot={Math.PI} order={6} />
    </Badge>
  );
}

export function CheckinBadge() {
  return (
    <Badge color="#ff8a1a" tail>
      <Bar p={[0, 0.05]} s={[0.08, 0.22]} />
      <Dot p={[0, -0.13]} r={0.045} />
    </Badge>
  );
}

export function DrinkBadge({ color = '#2f9be8' }) {
  return (
    <Badge color={color} tail>
      <Bar p={[-0.03, -0.01]} s={[0.17, 0.22]} />
      <Bar p={[-0.03, 0.08]} s={[0.17, 0.04]} color="#fff1b8" order={7} />
      <Dot p={[0.08, -0.01]} r={0.07} />
      <Dot p={[0.08, -0.01]} r={0.035} color={color} order={7} />
    </Badge>
  );
}

function Z({ p, s }) {
  return (
    <group position={[p[0], p[1], 0]} scale={s}>
      <Bar p={[0, 0.07]} s={[0.14, 0.035]} />
      <Bar p={[0, 0]} s={[0.035, 0.17]} r={-0.9} />
      <Bar p={[0, -0.07]} s={[0.14, 0.035]} />
    </group>
  );
}

export function ZzzBadge() {
  return (
    <Badge color="#8a5ad0" tail>
      <Z p={[-0.1, -0.08]} s={0.7} />
      <Z p={[0.01, 0.01]} s={0.85} />
      <Z p={[0.12, 0.1]} s={1} />
    </Badge>
  );
}

export function TipBadge() {
  return (
    <Badge color="#ffc31a">
      <Dot r={0.19} color="#f09a00" order={5} />
      <Dot r={0.15} color="#ffd84a" order={6} />
      <Bar p={[0, 0]} s={[0.05, 0.2]} color="#f09a00" order={7} />
      <Bar p={[0, 0.05]} s={[0.12, 0.04]} color="#f09a00" order={7} />
      <Bar p={[0, -0.05]} s={[0.12, 0.04]} color="#f09a00" order={7} />
    </Badge>
  );
}

export function CleanBadge() {
  return (
    <Badge color="#1fb7c9" tail>
      <Bar p={[0.03, 0.05]} s={[0.05, 0.28]} r={-0.5} color="#ffffff" />
      <Bar p={[-0.07, -0.12]} s={[0.18, 0.09]} r={-0.5} color="#ffd24a" order={7} />
    </Badge>
  );
}

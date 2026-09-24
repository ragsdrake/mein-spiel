/** Outdoor building blocks shared by the hotel exteriors. */

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Flame, IRON } from '../Props';
import { Ball, Blob, Box, Cone, Cyl, M, Rock, Sprite, rand } from '../primitives';
import { useTheme } from '../theme';

export function Ground() {
  const { palette } = useTheme();
  return (
    <Box p={[8, -0.7, 10]} s={[64, 0.4, 56]} mat={M(palette.ground, { tx: palette.groundTex, rx: 24, ry: 21, bump: 1.5 })} cast={false} />
  );
}

/** Stepping stones from the garden gate to the entrance. */
export function GardenPath() {
  const { palette } = useTheme();
  return Array.from({ length: 12 }, (_, i) => (
    <Cyl key={i} p={[12.9 + (rand(i + 7) - 0.5) * 0.8, -0.48, 12.9 + i * 0.6]} rt={0.35} h={0.06} seg={7}
      r={[0, rand(i) * 3, 0]} mat={M(palette.path, { tx: 'stone', bump: 1.5 })} cast={false} />
  ));
}

export function Gravestone({ p, r = 0, kind = 0, color = '#8e889a' }) {
  const stone = M(color, { tx: 'stone', bump: 2 });
  return (
    <group position={p} rotation={[0, r, (kind - 1) * 0.06]}>
      {kind === 2 ? (
        <group>
          <Box p={[0, 0.55, 0]} s={[0.14, 1.1, 0.14]} mat={stone} />
          <Box p={[0, 0.75, 0]} s={[0.6, 0.14, 0.14]} mat={stone} />
        </group>
      ) : (
        <group>
          <Box p={[0, 0.4, 0]} s={[0.6, 0.8, 0.18]} mat={stone} />
          <Cyl p={[0, 0.8, 0]} rt={0.3} h={0.18} seg={10} r={[Math.PI / 2, 0, 0]} mat={stone} />
          <Box p={[0, 0.45, 0.095]} s={[0.3, 0.04, 0.01]} c="#4a4458" cast={false} />
          <Box p={[0, 0.55, 0.095]} s={[0.04, 0.25, 0.01]} c="#4a4458" cast={false} />
        </group>
      )}
      <Rock p={[0, 0.05, 0.3]} rad={0.3} sc={[1.3, 0.3, 1]} c="#3d5e3a" />
      <Blob p={[0, 0.02, 0.1]} size={1.1} />
    </group>
  );
}

export function Pumpkin({ p, s = 1 }) {
  const face = M('#fff1b8', { emissive: '#ffa53b', intensity: 2.6 });
  return (
    <group position={p} scale={s}>
      <Ball p={[0, 0.25, 0]} rad={0.32} w={10} hs={7} sc={[1, 0.8, 1]}
        mat={M('#ff8a1f', { emissive: '#ff5a00', intensity: 0.35, rough: 0.6 })} />
      <Cyl p={[0, 0.52, 0]} rt={0.04} h={0.14} seg={5} c="#3f6b2a" />
      <Box p={[0.1, 0.3, 0.29]} s={[0.07, 0.07, 0.02]} mat={face} cast={false} />
      <Box p={[-0.1, 0.3, 0.29]} s={[0.07, 0.07, 0.02]} mat={face} cast={false} />
      <Box p={[0, 0.17, 0.29]} s={[0.2, 0.04, 0.02]} mat={face} cast={false} />
      <Sprite p={[0, 0.25, 0.3]} size={1} color="#ff8a2e" opacity={0.45} />
    </group>
  );
}

export function DeadTree({ p, s = 1, color = '#3b2a2f' }) {
  const bark = M(color, { tx: 'planks', bump: 1.5 });
  return (
    <group position={p} scale={s}>
      <Cyl p={[0, 1, 0]} rt={0.12} rb={0.28} h={2} seg={6} mat={bark} />
      <Cyl p={[0.35, 1.8, 0]} rt={0.04} rb={0.09} h={1} seg={5} r={[0, 0, -0.8]} mat={bark} />
      <Cyl p={[0.72, 2.25, 0]} rt={0.02} rb={0.045} h={0.5} seg={4} r={[0, 0, -0.2]} mat={bark} />
      <Cyl p={[-0.3, 2.0, 0.1]} rt={0.03} rb={0.08} h={0.9} seg={5} r={[0.2, 0, 0.9]} mat={bark} />
      <Cyl p={[0, 2.3, -0.2]} rt={0.03} rb={0.07} h={0.8} seg={5} r={[-0.6, 0, 0]} mat={bark} />
      <Blob p={[0, 0.03, 0]} size={1.6} />
    </group>
  );
}

export function Bush({ p, s = 1, color = '#2f5a3f', flowers }) {
  return (
    <group position={p} scale={s}>
      <Rock p={[0, 0.35, 0]} rad={0.55} sc={[1.2, 0.8, 1]} mat={M(color)} detail={1} />
      <Rock p={[0.45, 0.25, 0.2]} rad={0.35} mat={M(color)} detail={1} />
      <Rock p={[-0.4, 0.25, 0.1]} rad={0.38} mat={M(color)} detail={1} />
      {flowers && [0, 1, 2, 3, 4].map(i => (
        <Ball key={i} p={[Math.cos(i * 1.3) * 0.5, 0.55 + rand(i) * 0.2, Math.sin(i * 1.3) * 0.4]} rad={0.08} w={5} hs={4}
          mat={M(flowers, { emissive: flowers, intensity: 0.3 })} />
      ))}
      <Blob p={[0, 0.02, 0]} size={1.8} />
    </group>
  );
}

/** Fence with posts; `spikes` for wrought-iron castle fences. */
export function Fence({ from, to, count, color = '#2a2230', spikes }) {
  const posts = Array.from({ length: count }, (_, i) => i / (count - 1));
  const len = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const ang = Math.atan2(to[0] - from[0], to[1] - from[1]);
  const mat = spikes ? IRON() : M(color);
  return (
    <group>
      {posts.map(t => {
        const x = from[0] + (to[0] - from[0]) * t;
        const z = from[1] + (to[1] - from[1]) * t;
        return (
          <group key={t} position={[x, -0.5, z]}>
            <Box p={[0, 0.45, 0]} s={[0.1, 0.9, 0.1]} mat={mat} />
            {spikes && <Cone p={[0, 0.98, 0]} rad={0.07} h={0.18} seg={4} mat={mat} />}
          </group>
        );
      })}
      <Box p={[(from[0] + to[0]) / 2, 0.15, (from[1] + to[1]) / 2]} s={[0.06, 0.06, len]} r={[0, ang, 0]} mat={mat} />
      <Box p={[(from[0] + to[0]) / 2, -0.25, (from[1] + to[1]) / 2]} s={[0.06, 0.06, len]} r={[0, ang, 0]} mat={mat} />
    </group>
  );
}

/** Round stone tower with conical roof and glowing windows. */
export function Tower({ p, h = 8, rad = 1.6, roof = '#5a2a3a', wall = '#6d6878', glow = '#ffb347', tx = 'bricks', crenel }) {
  const stone = M(wall, { tx, rx: 4, ry: h / 1.5, bump: 2 });
  return (
    <group position={p}>
      <Cyl p={[0, h / 2, 0]} rt={rad} rb={rad * 1.08} h={h} seg={12} mat={stone} />
      {crenel ? (
        <group>
          <Cyl p={[0, h + 0.2, 0]} rt={rad * 1.15} h={0.4} seg={12} mat={stone} />
          {Array.from({ length: 10 }, (_, i) => {
            const a = (i / 10) * Math.PI * 2;
            return <Box key={i} p={[Math.sin(a) * rad * 1.1, h + 0.65, Math.cos(a) * rad * 1.1]} s={[0.4, 0.5, 0.3]} r={[0, a, 0]} mat={stone} />;
          })}
        </group>
      ) : (
        <group>
          <Cyl p={[0, h + 0.1, 0]} rt={rad * 1.2} h={0.2} seg={12} mat={M(roof)} />
          <Cone p={[0, h + 1.9, 0]} rad={rad * 1.25} h={3.6} seg={12} mat={M(roof, { tx: 'tiles', rx: 4, ry: 3, bump: 1.5 })} />
          <Cyl p={[0, h + 4, 0]} rt={0.03} h={0.8} seg={4} mat={IRON()} />
        </group>
      )}
      {[0.3, 0.55, 0.8].map((f, i) => {
        const a = Math.PI / 4 + i * 0.5;
        return (
          <group key={f} position={[Math.sin(a) * rad * 1.02, h * f, Math.cos(a) * rad * 1.02]} rotation={[0, a, 0]}>
            <Box s={[0.45, 0.8, 0.1]} mat={M('#fff1b8', { emissive: glow, intensity: 2.2 })} cast={false} />
            <Sprite size={1.6} color={glow} opacity={0.35} />
          </group>
        );
      })}
    </group>
  );
}

export function Hill({ p, s = [6, 2, 6], color = '#1d2a24' }) {
  return <Rock p={p} rad={1} sc={s} mat={M(color, { tx: 'stone', bump: 1 })} detail={1} />;
}

/** Torch on a pole (garden lighting). */
export function PoleTorch({ p }) {
  return (
    <group position={p}>
      <Cyl p={[0, 0.7, 0]} rt={0.05} h={1.4} seg={5} mat={IRON()} />
      <Cyl p={[0, 1.45, 0]} rt={0.14} rb={0.07} h={0.18} seg={6} mat={IRON()} />
      <Flame p={[0, 1.55, 0]} s={2} />
      <Blob p={[0, 0.02, 0]} size={0.8} />
    </group>
  );
}

/** Small bob/spin animation wrapper for magical objects. */
export function Floaty({ p = [0, 0, 0], amp = 0.15, speed = 1.5, spin = 0, children }) {
  const ref = useRef();
  useFrame(({ clock }, dt) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * speed + p[0];
    ref.current.position.y = p[1] + Math.sin(t) * amp;
    if (spin) ref.current.rotation.y += spin * dt;
  });
  return <group ref={ref} position={p}>{children}</group>;
}

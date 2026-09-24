/**
 * Shared furniture and small props. Colours come from the active hotel's
 * palette so the same prop fits every theme.
 */

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Ball, Box, Cone, Cyl, FlameM, Halo, M, Sprite, Torus } from './primitives';
import { useTheme } from './theme';

export const GOLD = () => M('#ffc94a', { metal: 0.85, rough: 0.28 });
export const IRON = () => M('#3a3440', { metal: 0.6, rough: 0.45 });

export function Flame({ p = [0, 0, 0], s = 1, color }) {
  const { palette } = useTheme();
  return (
    <group position={p} scale={s}>
      <Cone p={[0, 0.05, 0]} rad={0.04} h={0.12} seg={5} mat={FlameM('#fff1b8', color ?? palette.warm)} cast={false} />
      <Sprite p={[0, 0.06, 0]} size={0.5} color={color ?? palette.warm} opacity={0.6} />
    </group>
  );
}

export function Candle({ p, h = 0.25 }) {
  return (
    <group position={p}>
      <Cyl p={[0, h / 2, 0]} rt={0.05} h={h} seg={7} mat={M('#f3ead2', { smooth: true, rough: 0.6 })} />
      <Flame p={[0, h + 0.02, 0]} />
    </group>
  );
}

export function Candelabra({ p, gold }) {
  const mat = gold ? GOLD() : IRON();
  return (
    <group position={p}>
      <Cyl p={[0, 0.02, 0]} rt={0.14} h={0.04} seg={8} mat={mat} />
      <Cyl p={[0, 0.45, 0]} rt={0.025} h={0.9} seg={6} mat={mat} />
      <Box p={[0, 0.9, 0]} s={[0.4, 0.03, 0.03]} mat={mat} />
      <Candle p={[-0.18, 0.92, 0]} h={0.14} />
      <Candle p={[0, 0.92, 0]} h={0.18} />
      <Candle p={[0.18, 0.92, 0]} h={0.14} />
    </group>
  );
}

/** Wall torch / lantern with a real glow halo. */
export function Torch({ p, r = [0, 0, 0] }) {
  return (
    <group position={p} rotation={r}>
      <Box p={[0, 0, 0.08]} s={[0.1, 0.3, 0.16]} mat={IRON()} />
      <Cyl p={[0, 0.2, 0.18]} rt={0.09} rb={0.05} h={0.14} seg={6} mat={IRON()} />
      <Flame p={[0, 0.3, 0.18]} s={1.6} />
    </group>
  );
}

/** Themed window: frame + glowing glass + little light shaft on the floor. */
export function Window({ p, r }) {
  const { palette, id } = useTheme();
  const glass = M(palette.window, { emissive: palette.windowGlow, intensity: 1.6 });
  const frame = M(palette.woodDark);
  if (id === 'pyramide') {
    return (
      <group position={p} rotation={r}>
        <Box s={[0.9, 1.0, 0.12]} mat={M(palette.trim, { metal: 0.5, rough: 0.4 })} />
        <Box p={[0, 0, 0.04]} s={[0.7, 0.8, 0.08]} mat={glass} cast={false} />
        {[-0.2, 0, 0.2].map(x => <Box key={x} p={[x, 0, 0.09]} s={[0.05, 0.8, 0.03]} mat={frame} />)}
        <Box p={[0, 0.6, 0.02]} s={[1.1, 0.14, 0.14]} mat={M(palette.trim, { metal: 0.5, rough: 0.4 })} />
      </group>
    );
  }
  if (id === 'eispalast') {
    return (
      <group position={p} rotation={r}>
        <Torus p={[0, 0, 0.04]} rad={0.45} tube={0.08} seg={12} mat={M('#e8f8ff', { rough: 0.2 })} />
        <mesh position={[0, 0, 0.03]} material={glass}>
          <circleGeometry args={[0.42, 12]} />
        </mesh>
        <Box p={[0, 0, 0.07]} s={[0.05, 0.85, 0.03]} mat={M('#e8f8ff')} />
        <Box p={[0, 0, 0.07]} s={[0.85, 0.05, 0.03]} mat={M('#e8f8ff')} />
      </group>
    );
  }
  const tall = id === 'dracula';
  return (
    <group position={p} rotation={r}>
      <Box s={[1.1, tall ? 1.5 : 1.2, 0.1]} mat={frame} />
      <Box p={[0, 0, 0.04]} s={[0.86, tall ? 1.26 : 0.96, 0.06]} mat={glass} cast={false} />
      <Box p={[0, 0, 0.09]} s={[0.07, tall ? 1.26 : 0.96, 0.04]} mat={frame} />
      <Box p={[0, 0.05, 0.09]} s={[0.86, 0.07, 0.04]} mat={frame} />
      <Cone p={[0, tall ? 0.95 : 0.72, 0.02]} rad={0.62} h={tall ? 0.6 : 0.35} seg={tall ? 4 : 3}
        r={[0, tall ? Math.PI / 4 : 0, 0]} mat={M(palette.wood)} />
    </group>
  );
}

export function Painting({ p, r, hue = '#3c6b5a' }) {
  return (
    <group position={p} rotation={r}>
      <Box s={[0.7, 0.85, 0.06]} mat={GOLD()} />
      <Box p={[0, 0, 0.035]} s={[0.56, 0.7, 0.02]} c={hue} cast={false} />
      <Ball p={[0, 0.06, 0.05]} rad={0.13} w={6} hs={4} sc={[1, 1.2, 0.3]} c="#e8dcc8" cast={false} />
    </group>
  );
}

export function Padlock({ p, onPress }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.y = p[1] + Math.sin(clock.elapsedTime * 2 + p[0]) * 0.1;
    ref.current.rotation.y = Math.sin(clock.elapsedTime * 1.3 + p[2]) * 0.4;
  });
  return (
    <group ref={ref} position={p} onClick={(e) => { e.stopPropagation(); onPress(); }}>
      <Box s={[0.5, 0.42, 0.2]} mat={M('#ffc94a', { metal: 0.8, rough: 0.3, emissive: '#ff9d00', intensity: 0.5 })} />
      <Torus p={[0, 0.28, 0]} rad={0.16} tube={0.045} seg={10} arc={Math.PI} mat={M('#d9dde6', { metal: 0.9, rough: 0.25 })} />
      <Box p={[0, -0.02, 0.11]} s={[0.08, 0.14, 0.02]} c="#3a2a14" cast={false} />
      <Sprite size={1.5} color="#ffc94a" opacity={0.35} />
      <mesh visible={false}>
        <sphereGeometry args={[0.9, 6, 4]} />
      </mesh>
    </group>
  );
}

export function Barrel({ p, r = [0, 0, Math.PI / 2], color = '#7a4326' }) {
  return (
    <group position={p} rotation={r}>
      <Cyl rt={0.34} rb={0.34} h={0.8} seg={10} mat={M(color, { tx: 'planks', rx: 2, bump: 1 })} />
      <Cyl p={[0, 0, 0]} rt={0.37} h={0.1} seg={10} mat={IRON()} />
      <Cyl p={[0, 0.3, 0]} rt={0.35} h={0.06} seg={10} mat={IRON()} />
      <Cyl p={[0, -0.3, 0]} rt={0.35} h={0.06} seg={10} mat={IRON()} />
    </group>
  );
}

/** Round lounge table with two chairs and a candle. */
export function Table({ p }) {
  const { palette } = useTheme();
  return (
    <group position={p}>
      <Cyl p={[0, 0.35, 0]} rt={0.08} h={0.7} seg={6} mat={M(palette.woodDark)} />
      <Cyl p={[0, 0.03, 0]} rt={0.3} h={0.06} seg={8} mat={M(palette.woodDark)} />
      <Cyl p={[0, 0.72, 0]} rt={0.55} h={0.08} seg={12} mat={M(palette.wood, { tx: 'planks', bump: 0.6 })} />
      <Cyl p={[0, 0.765, 0]} rt={0.4} h={0.01} seg={12} mat={M(palette.rugHi, { tx: 'fabric' })} cast={false} />
      <Candle p={[0, 0.77, 0]} h={0.16} />
      {[1, -1].map(side => (
        <group key={side} position={[side * 0.85, 0, 0]}>
          <Box p={[0, 0.25, 0]} s={[0.42, 0.08, 0.42]} mat={M(palette.rug, { tx: 'fabric' })} />
          <Box p={[0, 0.12, 0]} s={[0.36, 0.22, 0.36]} mat={M(palette.woodDark)} />
          <Box p={[side * 0.19, 0.58, 0]} s={[0.06, 0.66, 0.42]} mat={M(palette.woodDark)} />
        </group>
      ))}
      <Halo p={[0, 0.02, 0]} size={2.4} color={palette.warm} opacity={0.18} />
    </group>
  );
}

export function Cobweb({ p, r, s = 1 }) {
  return (
    <mesh position={p} rotation={r} scale={s} material={M('#e8e6f0', { opacity: 0.35 })}>
      <circleGeometry args={[0.5, 3]} />
    </mesh>
  );
}
